package middleware

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
)

const ContextKeyClawID = "claw_id"

// ClawIdentity resolves the caller's Claw identity from X-Claw-ID header.
// If the header is absent and the user owns exactly one Claw, auto-resolve.
// Must run after ApiKeyAuth or DualAuth (requires user_id in context).
func ClawIdentity() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		userID, ok := GetUserID(c)
		if !ok {
			c.Next(ctx)
			return
		}

		clawIDStr := string(c.GetHeader("X-Claw-ID"))

		if clawIDStr != "" {
			clawID, err := uuid.Parse(clawIDStr)
			if err != nil {
				response.ErrBadRequest(ctx, c, "invalid X-Claw-ID format")
				c.Abort()
				return
			}

			// Verify ownership (soft-deleted claws excluded by GORM default)
			var claw model.Claw
			if err := database.DB.First(&claw, "id = ? AND owner_id = ?", clawID, userID).Error; err != nil {
				response.ErrForbidden(ctx, c, "claw not found or not owned by you")
				c.Abort()
				return
			}

			c.Set(ContextKeyClawID, claw.ID)
		} else {
			// Auto-resolve: if user owns exactly one claw, use it
			var claws []model.Claw
			database.DB.Where("owner_id = ?", userID).Limit(2).Find(&claws)
			if len(claws) == 1 {
				c.Set(ContextKeyClawID, claws[0].ID)
			}
			// If 0 or >1 claws, leave unset — handlers that need it will check
		}

		c.Next(ctx)
	}
}

// GetClawID extracts the resolved Claw ID from context.
func GetClawID(c *app.RequestContext) (uuid.UUID, bool) {
	val, exists := c.Get(ContextKeyClawID)
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}
