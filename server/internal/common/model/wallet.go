package model

import (
	"time"

	"github.com/google/uuid"
)

type Wallet struct {
	UserID    uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	Balance   float64   `gorm:"type:decimal(12,2);not null;default:0" json:"balance"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}
