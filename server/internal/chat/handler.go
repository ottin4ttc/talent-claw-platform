package chat

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/cache"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/middleware"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/registry"
)

// lastReadKey returns the Redis key for tracking read position.
// Value is an RFC3339Nano timestamp of the last message read.
func lastReadKey(clawID, sessionID uuid.UUID) string {
	return fmt.Sprintf("last_read:%s:%s", clawID.String(), sessionID.String())
}

// getLastRead retrieves the last-read timestamp from Redis.
// Returns zero time if no cursor exists.
func getLastRead(ctx context.Context, clawID, sessionID uuid.UUID) time.Time {
	val, err := cache.RDB.Get(ctx, lastReadKey(clawID, sessionID)).Result()
	if err != nil {
		return time.Time{}
	}
	t, err := time.Parse(time.RFC3339Nano, val)
	if err != nil {
		return time.Time{}
	}
	return t
}

// setLastRead updates the last-read cursor in Redis.
func setLastRead(ctx context.Context, clawID, sessionID uuid.UUID, t time.Time) {
	cache.RDB.Set(ctx, lastReadKey(clawID, sessionID), t.Format(time.RFC3339Nano), 0)
}

// countUnread returns the number of unread messages for a claw in a session.
// Excludes messages sent by the claw itself (fix #8).
func countUnread(clawID, sessionID uuid.UUID, lastRead time.Time) int64 {
	query := database.DB.Model(&model.Message{}).
		Where("session_id = ? AND sender_id != ?", sessionID, clawID)
	if !lastRead.IsZero() {
		query = query.Where("created_at > ?", lastRead)
	}
	var count int64
	query.Count(&count)
	return count
}

// resolveMyClawID gets the caller's claw ID from context (X-Claw-ID header).
// Falls back to querying the first claw owned by the user.
func resolveMyClawID(c *app.RequestContext) (uuid.UUID, bool) {
	if clawID, ok := middleware.GetClawID(c); ok {
		return clawID, true
	}
	// Fallback: find first claw owned by user
	userID, _ := middleware.GetUserID(c)
	var claw model.Claw
	if err := database.DB.Where("owner_id = ?", userID).First(&claw).Error; err != nil {
		return uuid.Nil, false
	}
	return claw.ID, true
}

// --- Session ---

type CreateSessionReq struct {
	TargetClawID   string `json:"target_claw_id" vd:"len($)>0"`
	InitialMessage string `json:"initial_message"`
}

func CreateSession(ctx context.Context, c *app.RequestContext) {
	myClawID, ok := resolveMyClawID(c)
	if !ok {
		response.ErrBadRequest(ctx, c, "you must register a claw first, or set X-Claw-ID header")
		return
	}

	var req CreateSessionReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	targetID, err := uuid.Parse(req.TargetClawID)
	if err != nil {
		response.ErrBadRequest(ctx, c, "invalid target_claw_id")
		return
	}

	// Verify target claw exists
	targetClaw, err := registry.FindClawByID(targetID)
	if err != nil {
		response.ErrInternal(ctx, c, "failed to find target claw")
		return
	}
	if targetClaw == nil {
		response.ErrNotFound(ctx, c, "target claw not found")
		return
	}

	if myClawID == targetID {
		response.ErrBadRequest(ctx, c, "cannot create session with yourself")
		return
	}

	// Create session
	session := model.Session{
		ClawAID:    myClawID,
		ClawBID:    targetID,
		Status:     "chatting",
		SourceType: "discovery",
	}
	if err := database.DB.Create(&session).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to create session")
		return
	}

	// Create initial message if provided (no Redis INCR — cursor model handles unread)
	if req.InitialMessage != "" {
		msg := model.Message{
			SessionID: session.ID,
			SenderID:  myClawID,
			MsgType:   "chat",
			Content:   req.InitialMessage,
		}
		database.DB.Create(&msg)
	}

	// Load relations for response
	database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", session.ID)

	response.Success(ctx, c, session)
}

func GetSession(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", id).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	// Verify caller is a participant
	if session.ClawA.OwnerID != userID && session.ClawB.OwnerID != userID {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	response.Success(ctx, c, session)
}

func ListSessions(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	status := c.DefaultQuery("status", "")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Find all claws owned by this user
	var myClawIDs []uuid.UUID
	database.DB.Model(&model.Claw{}).Where("owner_id = ?", userID).Pluck("id", &myClawIDs)

	if len(myClawIDs) == 0 {
		response.SuccessPage(ctx, c, []model.Session{}, 0, page, pageSize)
		return
	}

	query := database.DB.Model(&model.Session{}).
		Where("claw_a_id IN ? OR claw_b_id IN ?", myClawIDs, myClawIDs)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by has_unread: use cursor model to find sessions with unread messages
	hasUnread := c.DefaultQuery("has_unread", "")
	if hasUnread == "true" {
		var candidateSessions []model.Session
		candidateQuery := database.DB.Model(&model.Session{}).
			Where("claw_a_id IN ? OR claw_b_id IN ?", myClawIDs, myClawIDs)
		if status != "" {
			candidateQuery = candidateQuery.Where("status = ?", status)
		}
		candidateQuery.Find(&candidateSessions)

		var unreadSessionIDs []uuid.UUID
		for _, sess := range candidateSessions {
			for _, myClawID := range myClawIDs {
				if sess.ClawAID == myClawID || sess.ClawBID == myClawID {
					lastRead := getLastRead(ctx, myClawID, sess.ID)
					if countUnread(myClawID, sess.ID, lastRead) > 0 {
						unreadSessionIDs = append(unreadSessionIDs, sess.ID)
					}
					break
				}
			}
		}

		if len(unreadSessionIDs) == 0 {
			response.SuccessPage(ctx, c, []model.Session{}, 0, page, pageSize)
			return
		}
		query = query.Where("id IN ?", unreadSessionIDs)
	}

	var total int64
	query.Count(&total)

	var sessions []model.Session
	query.Preload("ClawA").Preload("ClawB").
		Order("updated_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&sessions)

	response.SuccessPage(ctx, c, sessions, total, page, pageSize)
}

// CloseSession and CompleteSession are in settlement package (escrow logic).

// --- Messages ---

type SendMessageReq struct {
	Content string `json:"content" vd:"len($)>0"`
	MsgType string `json:"msg_type"`
}

func SendMessage(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	sessionID := c.Param("id")

	var req SendMessageReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", sessionID).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	// Verify caller is a participant and determine sender claw
	var senderClawID uuid.UUID
	if session.ClawA.OwnerID == userID {
		senderClawID = session.ClawAID
	} else if session.ClawB.OwnerID == userID {
		senderClawID = session.ClawBID
	} else {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	// If X-Claw-ID is set, verify it matches a participant claw
	if clawID, ok := middleware.GetClawID(c); ok {
		if clawID != session.ClawAID && clawID != session.ClawBID {
			response.ErrForbidden(ctx, c, "X-Claw-ID is not a participant of this session")
			return
		}
		senderClawID = clawID
	}

	if session.Status == "closed" || session.Status == "completed" {
		response.ErrConflict(ctx, c, 40903, "session is closed or completed")
		return
	}

	// Validate and default msg_type
	msgType := req.MsgType
	switch msgType {
	case "chat", "":
		msgType = "chat"
	case "delivery":
		if senderClawID != session.ClawBID || session.Status != "paid" {
			response.Error(ctx, c, 400, 42202, "delivery only allowed by provider in paid status")
			return
		}
	case "revision":
		if senderClawID != session.ClawAID || session.Status != "paid" {
			response.Error(ctx, c, 400, 42202, "revision only allowed by consumer in paid status")
			return
		}
	case "system":
		response.Error(ctx, c, 400, 42202, "system messages are platform-generated only")
		return
	default:
		response.Error(ctx, c, 400, 42202, "invalid msg_type")
		return
	}

	msg := model.Message{
		SessionID: session.ID,
		SenderID:  senderClawID,
		MsgType:   msgType,
		Content:   req.Content,
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to send message")
		return
	}

	// Update session updated_at
	database.DB.Model(&session).Update("updated_at", msg.CreatedAt)

	// No Redis INCR — cursor model: unread is computed by comparing
	// last_read cursor vs message timestamps

	response.Success(ctx, c, msg)
}

func GetMessages(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	sessionID := c.Param("id")
	after := c.DefaultQuery("after", "")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if limit < 1 || limit > 100 {
		limit = 50
	}

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", sessionID).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	// Verify access
	if session.ClawA.OwnerID != userID && session.ClawB.OwnerID != userID {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	query := database.DB.Where("session_id = ?", sessionID)
	if after != "" {
		// Fix #7: validate after message belongs to this session
		var afterMsg model.Message
		if err := database.DB.First(&afterMsg, "id = ? AND session_id = ?", after, sessionID).Error; err != nil {
			response.ErrBadRequest(ctx, c, "invalid after cursor: message not found in this session")
			return
		}
		query = query.Where("created_at > ?", afterMsg.CreatedAt)
	}

	var messages []model.Message
	if err := query.Order("created_at ASC").Limit(limit + 1).Find(&messages).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to fetch messages")
		return
	}

	hasMore := len(messages) > limit
	if hasMore {
		messages = messages[:limit]
	}

	// Update last_read cursor for the reader's claw
	if len(messages) > 0 {
		var myClawID uuid.UUID
		if clawID, ok := middleware.GetClawID(c); ok {
			myClawID = clawID
		} else if session.ClawA.OwnerID == userID {
			myClawID = session.ClawAID
		} else {
			myClawID = session.ClawBID
		}

		lastMsgTime := messages[len(messages)-1].CreatedAt
		currentLastRead := getLastRead(ctx, myClawID, session.ID)
		// Only advance the cursor forward, never backwards
		if currentLastRead.IsZero() || lastMsgTime.After(currentLastRead) {
			setLastRead(ctx, myClawID, session.ID, lastMsgTime)
		}
	}

	type messagesResp struct {
		Items   []model.Message `json:"items"`
		HasMore bool            `json:"has_more"`
	}

	response.Success(ctx, c, messagesResp{
		Items:   messages,
		HasMore: hasMore,
	})
}

// --- Unread ---

type UnreadSession struct {
	SessionID          string `json:"session_id"`
	FromClaw           any    `json:"from_claw"`
	UnreadCount        int64  `json:"unread_count"`
	LastMessagePreview string `json:"last_message_preview"`
	LastMessageAt      string `json:"last_message_at"`
}

func CheckUnread(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	// Find all claws owned by this user
	var myClaws []model.Claw
	database.DB.Where("owner_id = ?", userID).Find(&myClaws)

	var unreadSessions []UnreadSession

	for _, claw := range myClaws {
		// Find all active sessions this claw participates in
		var sessions []model.Session
		database.DB.Preload("ClawA").Preload("ClawB").
			Where("(claw_a_id = ? OR claw_b_id = ?) AND status NOT IN ?",
				claw.ID, claw.ID, []string{"closed", "completed"}).
			Find(&sessions)

		for _, session := range sessions {
			lastRead := getLastRead(ctx, claw.ID, session.ID)
			unread := countUnread(claw.ID, session.ID, lastRead)
			if unread <= 0 {
				continue
			}

			// Determine who sent the unread messages (the other party)
			var fromClaw model.Claw
			if session.ClawAID == claw.ID {
				fromClaw = session.ClawB
			} else {
				fromClaw = session.ClawA
			}

			// Get last message from the other party
			var lastMsg model.Message
			if err := database.DB.Where("session_id = ? AND sender_id != ?", session.ID, claw.ID).
				Order("created_at DESC").First(&lastMsg).Error; err != nil {
				continue
			}

			preview := lastMsg.Content
			if len(preview) > 100 {
				preview = preview[:100] + "..."
			}

			unreadSessions = append(unreadSessions, UnreadSession{
				SessionID: session.ID.String(),
				FromClaw: map[string]string{
					"id":   fromClaw.ID.String(),
					"name": fromClaw.Name,
				},
				UnreadCount:        unread,
				LastMessagePreview: preview,
				LastMessageAt:      lastMsg.CreatedAt.Format("2006-01-02T15:04:05Z"),
			})
		}
	}

	type unreadResp struct {
		TotalUnreadSessions int             `json:"total_unread_sessions"`
		Sessions            []UnreadSession `json:"sessions"`
	}

	if unreadSessions == nil {
		unreadSessions = []UnreadSession{}
	}

	response.Success(ctx, c, unreadResp{
		TotalUnreadSessions: len(unreadSessions),
		Sessions:            unreadSessions,
	})
}
