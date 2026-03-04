package scheduler

import (
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"gorm.io/gorm"
)

const (
	MessageTimeoutHours = 24
	PaymentTimeoutHours = 72
)

// StartTimeoutChecker runs a periodic check for timed-out sessions.
func StartTimeoutChecker(interval time.Duration) {
	ticker := time.NewTicker(interval)
	log.Printf("[scheduler] timeout checker started, interval=%v", interval)
	for range ticker.C {
		checkMessageTimeout()
		checkPaymentTimeout()
	}
}

// checkMessageTimeout closes chatting sessions with no new messages for 24h.
func checkMessageTimeout() {
	cutoff := time.Now().Add(-MessageTimeoutHours * time.Hour)

	var sessions []model.Session
	database.DB.Where("status = ? AND updated_at < ?", "chatting", cutoff).
		Find(&sessions)

	for _, session := range sessions {
		database.DB.Model(&session).Update("status", "closed")

		// Insert system message
		msg := model.Message{
			SessionID: session.ID,
			SenderID:  uuid.Nil,
			Content:   "[系统] 会话因超过 24 小时无回复已自动关闭",
		}
		database.DB.Create(&msg)

		log.Printf("[scheduler] message timeout: session %s closed", session.ID)
	}
}

// checkPaymentTimeout refunds and closes paid sessions older than 72h.
func checkPaymentTimeout() {
	cutoff := time.Now().Add(-PaymentTimeoutHours * time.Hour)

	var sessions []model.Session
	database.DB.Preload("ClawA").Preload("ClawB").
		Where("status = ? AND paid_at < ?", "paid", cutoff).
		Find(&sessions)

	for _, session := range sessions {
		err := database.DB.Transaction(func(tx *gorm.DB) error {
			// Refund escrowed funds to claw_a owner
			payerID := session.ClawA.OwnerID
			var payerWallet model.Wallet
			if err := tx.First(&payerWallet, "user_id = ?", payerID).Error; err != nil {
				return err
			}
			if err := tx.Model(&payerWallet).Update("balance", gorm.Expr("balance + ?", session.EscrowAmount)).Error; err != nil {
				return err
			}

			// Record escrow_refund transaction
			memo := fmt.Sprintf("%s: escrow refund (timeout)", session.ClawB.Name)
			txn := model.Transaction{
				SessionID: &session.ID,
				ToID:      &payerID,
				Amount:    session.EscrowAmount,
				Type:      "escrow_refund",
				Memo:      &memo,
			}
			if err := tx.Create(&txn).Error; err != nil {
				return err
			}

			// Close session
			return tx.Model(&session).Updates(map[string]any{
				"status":        "closed",
				"escrow_amount": 0,
			}).Error
		})

		if err != nil {
			log.Printf("[scheduler] payment timeout refund failed for session %s: %v", session.ID, err)
			continue
		}

		// Insert system message
		msg := model.Message{
			SessionID: session.ID,
			SenderID:  uuid.Nil,
			Content:   "[系统] 会话因超过 72 小时未确认交付已自动退款并关闭",
		}
		database.DB.Create(&msg)

		log.Printf("[scheduler] payment timeout: session %s refunded and closed", session.ID)
	}
}
