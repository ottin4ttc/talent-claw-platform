package chat

import (
	"context"
	"fmt"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/cache"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/middleware"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/registry"
)

// --- Session ---

type CreateSessionReq struct {
	TargetClawID   string `json:"target_claw_id" vd:"len($)>0"`
	InitialMessage string `json:"initial_message"`
}

func CreateSession(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

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

	// Find caller's claw (the first one owned by this user)
	var myClaw model.Claw
	if err := database.DB.Where("owner_id = ?", userID).First(&myClaw).Error; err != nil {
		response.ErrBadRequest(ctx, c, "you must register a claw first")
		return
	}

	// Create session
	session := model.Session{
		ClawAID:    myClaw.ID,
		ClawBID:    targetID,
		Status:     "chatting",
		SourceType: "discovery",
	}
	if err := database.DB.Create(&session).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to create session")
		return
	}

	// Create initial message if provided
	if req.InitialMessage != "" {
		msg := model.Message{
			SessionID: session.ID,
			SenderID:  myClaw.ID,
			Content:   req.InitialMessage,
		}
		database.DB.Create(&msg)

		// Set unread for target claw
		unreadKey := fmt.Sprintf("unread:%s:%s", targetID.String(), session.ID.String())
		cache.RDB.Incr(ctx, unreadKey)
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

	// Filter by has_unread: only return sessions with unread messages
	hasUnread := c.DefaultQuery("has_unread", "")
	var unreadSessionIDs []string
	if hasUnread == "true" {
		for _, clawID := range myClawIDs {
			pattern := fmt.Sprintf("unread:%s:*", clawID.String())
			keys, _ := cache.RDB.Keys(ctx, pattern).Result()
			for _, key := range keys {
				count, _ := cache.RDB.Get(ctx, key).Int64()
				if count > 0 {
					sessionIDStr := key[len(fmt.Sprintf("unread:%s:", clawID.String())):]
					unreadSessionIDs = append(unreadSessionIDs, sessionIDStr)
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

func CloseSession(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", id).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	if session.ClawA.OwnerID != userID && session.ClawB.OwnerID != userID {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	database.DB.Model(&session).Update("status", "closed")
	response.Success(ctx, c, nil)
}

func CompleteSession(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", id).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	if session.ClawA.OwnerID != userID && session.ClawB.OwnerID != userID {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	if session.Status != "paid" {
		response.ErrConflict(ctx, c, 40902, "session must be paid before completing")
		return
	}

	database.DB.Model(&session).Update("status", "completed")
	response.Success(ctx, c, nil)
}

// --- Messages ---

type SendMessageReq struct {
	Content string `json:"content" vd:"len($)>0"`
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

	// Verify caller is a participant
	var senderClawID uuid.UUID
	var receiverClawID uuid.UUID
	if session.ClawA.OwnerID == userID {
		senderClawID = session.ClawAID
		receiverClawID = session.ClawBID
	} else if session.ClawB.OwnerID == userID {
		senderClawID = session.ClawBID
		receiverClawID = session.ClawAID
	} else {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	if session.Status == "closed" {
		response.ErrConflict(ctx, c, 40902, "session is closed")
		return
	}

	msg := model.Message{
		SessionID: session.ID,
		SenderID:  senderClawID,
		Content:   req.Content,
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to send message")
		return
	}

	// Update session updated_at
	database.DB.Model(&session).Update("updated_at", msg.CreatedAt)

	// Increment unread for receiver
	unreadKey := fmt.Sprintf("unread:%s:%s", receiverClawID.String(), session.ID.String())
	cache.RDB.Incr(ctx, unreadKey)

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
		// Find the created_at of the "after" message
		var afterMsg model.Message
		if err := database.DB.First(&afterMsg, "id = ?", after).Error; err == nil {
			query = query.Where("created_at > ?", afterMsg.CreatedAt)
		}
	}

	var messages []model.Message
	query.Order("created_at ASC").Limit(limit + 1).Find(&messages)

	hasMore := len(messages) > limit
	if hasMore {
		messages = messages[:limit]
	}

	// Clear unread for the reader's claw
	var myClawID uuid.UUID
	if session.ClawA.OwnerID == userID {
		myClawID = session.ClawAID
	} else {
		myClawID = session.ClawBID
	}
	unreadKey := fmt.Sprintf("unread:%s:%s", myClawID.String(), session.ID.String())
	cache.RDB.Del(ctx, unreadKey)

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
		// Scan Redis for unread keys matching this claw
		pattern := fmt.Sprintf("unread:%s:*", claw.ID.String())
		keys, _ := cache.RDB.Keys(ctx, pattern).Result()

		for _, key := range keys {
			count, _ := cache.RDB.Get(ctx, key).Int64()
			if count <= 0 {
				continue
			}

			// Extract session_id from key
			// key format: unread:{claw_id}:{session_id}
			sessionIDStr := key[len(fmt.Sprintf("unread:%s:", claw.ID.String())):]

			var session model.Session
			if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", sessionIDStr).Error; err != nil {
				continue
			}

			// Determine who sent the message
			var fromClaw model.Claw
			if session.ClawAID == claw.ID {
				fromClaw = session.ClawB
			} else {
				fromClaw = session.ClawA
			}

			// Get last message
			var lastMsg model.Message
			database.DB.Where("session_id = ?", sessionIDStr).Order("created_at DESC").First(&lastMsg)

			preview := lastMsg.Content
			if len(preview) > 100 {
				preview = preview[:100] + "..."
			}

			unreadSessions = append(unreadSessions, UnreadSession{
				SessionID: sessionIDStr,
				FromClaw: map[string]string{
					"id":   fromClaw.ID.String(),
					"name": fromClaw.Name,
				},
				UnreadCount:        count,
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
