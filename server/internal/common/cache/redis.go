package cache

import (
	"context"
	"log"

	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/config"
	"github.com/redis/go-redis/v9"
)

var RDB *redis.Client

func Init(cfg *config.RedisConfig) {
	RDB = redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	if err := RDB.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("failed to connect redis: %v", err)
	}

	log.Println("redis connected")
}
