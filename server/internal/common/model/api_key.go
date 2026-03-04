package model

import (
	"time"

	"github.com/google/uuid"
)

type ApiKey struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	KeyHash    string     `gorm:"type:varchar(64);not null;uniqueIndex" json:"-"`
	KeyPrefix  string     `gorm:"type:varchar(16);not null" json:"key_prefix"`
	Name       string     `gorm:"type:varchar(100)" json:"name"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	CreatedAt  time.Time  `gorm:"autoCreateTime" json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}
