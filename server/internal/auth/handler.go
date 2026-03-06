package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"math/big"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/cache"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/middleware"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/sms"
)

// --- Auth ---

type SendCodeReq struct {
	Phone string `json:"phone" vd:"len($)>0"`
}

func generateCode() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	return fmt.Sprintf("%06d", n.Int64())
}

func SendCode(ctx context.Context, c *app.RequestContext) {
	var req SendCodeReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	// Rate limit: 1 code per 60 seconds per phone
	rateLimitKey := "sms_rate:" + req.Phone
	if cache.RDB.Exists(ctx, rateLimitKey).Val() > 0 {
		response.ErrBadRequest(ctx, c, "please wait before requesting another code")
		return
	}

	code := generateCode()

	// Store code in Redis with 5 min TTL
	codeKey := "sms_code:" + req.Phone
	cache.RDB.Set(ctx, codeKey, code, 5*time.Minute)
	// Set rate limit: 60 seconds
	cache.RDB.Set(ctx, rateLimitKey, "1", 60*time.Second)

	// Send via Aliyun SMS
	if err := sms.SendCode(req.Phone, code); err != nil {
		log.Printf("failed to send sms to %s: %v", req.Phone, err)
		// Clean up on failure
		cache.RDB.Del(ctx, codeKey)
		cache.RDB.Del(ctx, rateLimitKey)
		response.ErrInternal(ctx, c, "failed to send verification code")
		return
	}

	response.Success(ctx, c, nil)
}

type LoginReq struct {
	Phone string `json:"phone" vd:"len($)>0"`
	Code  string `json:"code" vd:"len($)>0"`
}

type LoginResp struct {
	Token string     `json:"token"`
	User  model.User `json:"user"`
}

func Login(ctx context.Context, c *app.RequestContext) {
	var req LoginReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	// Verify code from Redis
	codeKey := "sms_code:" + req.Phone
	stored, err := cache.RDB.Get(ctx, codeKey).Result()
	if err != nil || stored != req.Code {
		response.ErrUnauthorized(ctx, c, "invalid verification code")
		return
	}

	// Code verified, delete it
	cache.RDB.Del(ctx, codeKey)

	// Find or create user
	var user model.User
	result := database.DB.Where("phone = ?", req.Phone).First(&user)
	if result.Error != nil {
		// Auto register
		nickname := "User_" + req.Phone[len(req.Phone)-4:]
		user = model.User{
			Phone:    &req.Phone,
			Nickname: nickname,
		}
		if err := database.DB.Create(&user).Error; err != nil {
			response.ErrInternal(ctx, c, "failed to create user")
			return
		}
		// Create wallet with initial credits
		wallet := model.Wallet{UserID: user.ID, Balance: 1000}
		database.DB.Create(&wallet)
	}

	// Generate JWT
	token, err := middleware.GenerateJWT(user.ID, 7)
	if err != nil {
		response.ErrInternal(ctx, c, "failed to generate token")
		return
	}

	// Mask phone
	maskedPhone := req.Phone[:3] + "****" + req.Phone[len(req.Phone)-4:]
	user.Phone = &maskedPhone

	response.Success(ctx, c, LoginResp{
		Token: token,
		User:  user,
	})
}

func Me(ctx context.Context, c *app.RequestContext) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		response.ErrUnauthorized(ctx, c, "unauthorized")
		return
	}

	var user model.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		response.ErrNotFound(ctx, c, "user not found")
		return
	}

	response.Success(ctx, c, user)
}

// --- API Keys ---

type CreateApiKeyReq struct {
	Name string `json:"name"`
}

type CreateApiKeyResp struct {
	ID        uuid.UUID `json:"id"`
	Key       string    `json:"key"`
	KeyPrefix string    `json:"key_prefix"`
	Name      string    `json:"name"`
}

func CreateApiKey(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	var req CreateApiKeyReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	// Generate random API key
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		response.ErrInternal(ctx, c, "failed to generate key")
		return
	}
	rawKey := "clw_" + hex.EncodeToString(rawBytes)
	prefix := rawKey[:12]

	hash := sha256.Sum256([]byte(rawKey))
	keyHash := fmt.Sprintf("%x", hash)

	apiKey := model.ApiKey{
		UserID:    userID,
		KeyHash:   keyHash,
		KeyPrefix: prefix,
		KeyFull:   rawKey,
		Name:      req.Name,
	}
	if err := database.DB.Create(&apiKey).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to create api key")
		return
	}

	response.Success(ctx, c, CreateApiKeyResp{
		ID:        apiKey.ID,
		Key:       rawKey,
		KeyPrefix: prefix,
		Name:      req.Name,
	})
}

func ListApiKeys(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	var keys []model.ApiKey
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&keys)

	response.SuccessPage(ctx, c, keys, int64(len(keys)), 1, len(keys))
}

func DeleteApiKey(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.ApiKey{})
	if result.RowsAffected == 0 {
		response.ErrNotFound(ctx, c, "api key not found")
		return
	}

	response.Success(ctx, c, nil)
}
