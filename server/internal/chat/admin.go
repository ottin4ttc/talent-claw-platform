package chat

import (
	"context"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
)

// AdminListSessions returns all sessions on the platform (admin only).
func AdminListSessions(ctx context.Context, c *app.RequestContext) {
	status := c.DefaultQuery("status", "")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := database.DB.Model(&model.Session{})
	if status != "" {
		query = query.Where("status = ?", status)
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

// AdminGetSession returns a single session detail (admin only).
func AdminGetSession(ctx context.Context, c *app.RequestContext) {
	id := c.Param("id")

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", id).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	response.Success(ctx, c, session)
}

// AdminGetMessages returns all messages in a session (admin only, no unread tracking).
func AdminGetMessages(ctx context.Context, c *app.RequestContext) {
	sessionID := c.Param("id")
	after := c.DefaultQuery("after", "")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	if limit < 1 || limit > 100 {
		limit = 50
	}

	var session model.Session
	if err := database.DB.First(&session, "id = ?", sessionID).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	query := database.DB.Where("session_id = ?", sessionID)
	if after != "" {
		var afterMsg model.Message
		if err := database.DB.First(&afterMsg, "id = ? AND session_id = ?", after, sessionID).Error; err != nil {
			response.ErrBadRequest(ctx, c, "invalid after cursor")
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

	type messagesResp struct {
		Items   []model.Message `json:"items"`
		HasMore bool            `json:"has_more"`
	}

	response.Success(ctx, c, messagesResp{
		Items:   messages,
		HasMore: hasMore,
	})
}
