package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Claw struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OwnerID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"owner_id"`
	Name         string         `gorm:"type:varchar(100);not null" json:"name"`
	Description  string         `gorm:"type:text;not null" json:"description"`
	Capabilities JSON           `gorm:"type:jsonb;not null;default:'[]'" json:"capabilities"`
	Tags         StringArray    `gorm:"type:text[]" json:"tags"`
	Pricing      JSON           `gorm:"type:jsonb" json:"pricing,omitempty"`
	Status       string         `gorm:"type:varchar(20);default:'offline';index" json:"status"`
	RatingAvg    float64        `gorm:"type:decimal(3,2);default:0" json:"rating_avg"`
	RatingCount  int            `gorm:"default:0" json:"rating_count"`
	TotalCalls   int            `gorm:"default:0" json:"total_calls"`
	CreatedAt    time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Owner User `gorm:"foreignKey:OwnerID" json:"-"`
}
