package middleware

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
)

const (
	ContextKeyUserID = "user_id"
	ContextKeyAuthType = "auth_type"
	AuthTypeApiKey   = "apikey"
	AuthTypeJWT      = "jwt"
)

// ApiKeyAuth validates API Key from Authorization header.
// Expects: Authorization: Bearer clw_xxxxxxxx
func ApiKeyAuth() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		token := string(c.GetHeader("Authorization"))
		if token == "" {
			response.ErrUnauthorized(ctx, c, "missing authorization header")
			c.Abort()
			return
		}

		token = strings.TrimPrefix(token, "Bearer ")
		if !strings.HasPrefix(token, "clw_") {
			response.ErrUnauthorized(ctx, c, "invalid api key format")
			c.Abort()
			return
		}

		hash := sha256.Sum256([]byte(token))
		keyHash := fmt.Sprintf("%x", hash)

		var apiKey model.ApiKey
		if err := database.DB.Where("key_hash = ?", keyHash).First(&apiKey).Error; err != nil {
			response.ErrUnauthorized(ctx, c, "invalid api key")
			c.Abort()
			return
		}

		// Update last_used_at
		now := time.Now()
		database.DB.Model(&apiKey).Update("last_used_at", &now)

		c.Set(ContextKeyUserID, apiKey.UserID)
		c.Set(ContextKeyAuthType, AuthTypeApiKey)
		c.Next(ctx)
	}
}

// GetUserID extracts user ID from context (set by either ApiKeyAuth or JWTAuth).
func GetUserID(c *app.RequestContext) (uuid.UUID, bool) {
	val, exists := c.Get(ContextKeyUserID)
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}
