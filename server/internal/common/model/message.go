package model

import (
	"time"

	"github.com/google/uuid"
)

type Message struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionID uuid.UUID `gorm:"type:uuid;not null;index:idx_messages_session_created" json:"session_id"`
	SenderID  uuid.UUID `gorm:"type:uuid;not null" json:"sender_id"`
	MsgType   string    `gorm:"type:varchar(20);not null;default:'chat'" json:"msg_type"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `gorm:"autoCreateTime;index:idx_messages_session_created" json:"created_at"`

	Session Session `gorm:"foreignKey:SessionID" json:"-"`
	Sender  Claw    `gorm:"foreignKey:SenderID" json:"-"`
}
