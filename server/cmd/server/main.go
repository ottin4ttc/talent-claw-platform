package main

import (
	"log"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/auth"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/chat"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/cache"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/config"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/middleware"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/registry"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/settlement"
)

func main() {
	// Load config
	cfg := config.Load()

	// Init database
	database.Init(&cfg.Database)
	database.AutoMigrate(
		&model.User{},
		&model.ApiKey{},
		&model.Claw{},
		&model.Session{},
		&model.Message{},
		&model.Wallet{},
		&model.Transaction{},
	)

	// Init Redis
	cache.Init(&cfg.Redis)

	// Init JWT
	middleware.SetJWTSecret(cfg.JWT.Secret)

	// Create Hertz server
	h := server.Default(server.WithHostPorts("0.0.0.0:" + cfg.Server.Port))

	// Global middleware
	h.Use(middleware.CORS())

	// API v1
	v1 := h.Group("/v1")

	// --- Public routes (no auth) ---
	v1.POST("/auth/send-code", auth.SendCode)
	v1.POST("/auth/login", auth.Login)
	v1.GET("/claws", registry.SearchClaws)
	v1.GET("/claws/:id", registry.GetClaw)

	// --- JWT auth routes (for Web users) ---
	jwtAuth := v1.Group("", middleware.JWTAuth())
	jwtAuth.GET("/auth/me", auth.Me)
	jwtAuth.POST("/api-keys", auth.CreateApiKey)
	jwtAuth.GET("/api-keys", auth.ListApiKeys)
	jwtAuth.DELETE("/api-keys/:id", auth.DeleteApiKey)
	jwtAuth.POST("/wallets/topup", settlement.Topup)

	// --- API Key auth routes (for Claws) ---
	clawAuth := v1.Group("", middleware.ApiKeyAuth())
	// Registry
	clawAuth.POST("/claws", registry.CreateClaw)
	clawAuth.DELETE("/claws/:id", registry.DeleteClaw)
	// Chat
	clawAuth.POST("/sessions", chat.CreateSession)
	clawAuth.GET("/sessions", chat.ListSessions)
	clawAuth.GET("/sessions/unread", chat.CheckUnread)
	clawAuth.GET("/sessions/:id", chat.GetSession)
	clawAuth.POST("/sessions/:id/messages", chat.SendMessage)
	clawAuth.GET("/sessions/:id/messages", chat.GetMessages)
	clawAuth.POST("/sessions/:id/close", chat.CloseSession)
	clawAuth.POST("/sessions/:id/complete", chat.CompleteSession)
	// Settlement
	clawAuth.POST("/sessions/:id/pay", settlement.Pay)

	// --- Dual auth routes (API Key or JWT) ---
	dualAuth := v1.Group("", middleware.DualAuth())
	dualAuth.GET("/wallets/me", settlement.GetBalance)
	dualAuth.GET("/transactions", settlement.ListTransactions)
	dualAuth.GET("/claws/mine", registry.MyClaws)
	dualAuth.PATCH("/claws/:id", registry.UpdateClaw)

	log.Printf("server starting on port %s", cfg.Server.Port)
	h.Spin()
}
