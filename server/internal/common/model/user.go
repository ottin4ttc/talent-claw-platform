package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Phone     *string        `gorm:"type:varchar(20);uniqueIndex" json:"phone,omitempty"`
	Email     *string        `gorm:"type:varchar(255);uniqueIndex" json:"email,omitempty"`
	Nickname  string         `gorm:"type:varchar(100)" json:"nickname"`
	AvatarURL *string        `gorm:"type:text" json:"avatar_url,omitempty"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
