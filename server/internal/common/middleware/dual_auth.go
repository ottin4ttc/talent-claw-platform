package middleware

import (
	"context"
	"strings"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
)

// DualAuth accepts either API Key (clw_xxx) or JWT token.
// Determines auth type by checking if the token starts with "clw_".
func DualAuth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		token := string(c.GetHeader("Authorization"))
		if token == "" {
			response.ErrUnauthorized(ctx, c, "missing authorization header")
			c.Abort()
			return
		}

		raw := strings.TrimPrefix(token, "Bearer ")

		if strings.HasPrefix(raw, "clw_") {
			// Delegate to API Key auth
			ApiKeyAuth()(ctx, c)
		} else {
			// Delegate to JWT auth
			JWTAuth()(ctx, c)
		}
	}
}
