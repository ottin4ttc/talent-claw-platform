package middleware

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
)

// AdminOnly checks that the authenticated user has role "admin".
// Must be used after JWTAuth middleware.
func AdminOnly() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		userID, ok := GetUserID(c)
		if !ok {
			response.ErrUnauthorized(ctx, c, "authentication required")
			c.Abort()
			return
		}

		var user model.User
		if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
			response.ErrUnauthorized(ctx, c, "user not found")
			c.Abort()
			return
		}

		if user.Role != "admin" {
			response.ErrForbidden(ctx, c, "admin access required")
			c.Abort()
			return
		}

		c.Next(ctx)
	}
}
