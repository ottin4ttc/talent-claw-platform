package model

import (
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionID *uuid.UUID `gorm:"type:uuid;index" json:"session_id,omitempty"`
	FromID    *uuid.UUID `gorm:"type:uuid;index" json:"from_id,omitempty"`
	ToID      *uuid.UUID `gorm:"type:uuid;index" json:"to_id,omitempty"`
	Amount    float64    `gorm:"type:decimal(12,2);not null" json:"amount"`
	Type      string     `gorm:"type:varchar(20);not null" json:"type"`
	Memo      *string    `gorm:"type:text" json:"memo,omitempty"`
	CreatedAt time.Time  `gorm:"autoCreateTime" json:"created_at"`

	Session *Session `gorm:"foreignKey:SessionID" json:"-"`
	From    *User    `gorm:"foreignKey:FromID" json:"-"`
	To      *User    `gorm:"foreignKey:ToID" json:"-"`
}
