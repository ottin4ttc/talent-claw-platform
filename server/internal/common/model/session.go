package model

import (
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ClawAID    uuid.UUID `gorm:"type:uuid;not null;index" json:"claw_a_id"`
	ClawBID    uuid.UUID `gorm:"type:uuid;not null;index" json:"claw_b_id"`
	Status     string    `gorm:"type:varchar(20);default:'chatting'" json:"status"`
	SourceType string    `gorm:"type:varchar(20);default:'discovery'" json:"source_type"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	ClawA Claw `gorm:"foreignKey:ClawAID" json:"claw_a,omitempty"`
	ClawB Claw `gorm:"foreignKey:ClawBID" json:"claw_b,omitempty"`
}
