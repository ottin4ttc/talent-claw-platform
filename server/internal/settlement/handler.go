package settlement

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/middleware"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
	"gorm.io/gorm"
)

// --- Wallet ---

type BalanceResp struct {
	Balance float64 `json:"balance"`
}

func GetBalance(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	var wallet model.Wallet
	if err := database.DB.FirstOrCreate(&wallet, model.Wallet{UserID: userID}).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to get wallet")
		return
	}

	response.Success(ctx, c, BalanceResp{Balance: wallet.Balance})
}

type TopupReq struct {
	Amount float64 `json:"amount" vd:"$>0"`
}

func Topup(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	var req TopupReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var wallet model.Wallet
		if err := tx.FirstOrCreate(&wallet, model.Wallet{UserID: userID}).Error; err != nil {
			return err
		}

		// Update balance
		if err := tx.Model(&wallet).Update("balance", gorm.Expr("balance + ?", req.Amount)).Error; err != nil {
			return err
		}

		// Record transaction
		txn := model.Transaction{
			ToID:   &userID,
			Amount: req.Amount,
			Type:   "topup",
		}
		return tx.Create(&txn).Error
	})

	if err != nil {
		response.ErrInternal(ctx, c, "topup failed")
		return
	}

	// Return updated balance
	var wallet model.Wallet
	database.DB.First(&wallet, "user_id = ?", userID)
	response.Success(ctx, c, BalanceResp{Balance: wallet.Balance})
}

// --- Pay ---

type PayReq struct {
	Amount float64 `json:"amount" vd:"$>0"`
}

type PayResp struct {
	TransactionID string  `json:"transaction_id"`
	FromBalance   float64 `json:"from_balance"`
	Amount        float64 `json:"amount"`
}

func Pay(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	sessionID := c.Param("id")

	var req PayReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	// Find session and verify caller is claw_a (fix #11: validate claw identity, not just owner)
	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", sessionID).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	// If X-Claw-ID is set, verify it matches claw_a exactly
	if clawID, ok := middleware.GetClawID(c); ok {
		if clawID != session.ClawAID {
			response.ErrForbidden(ctx, c, "only the initiator claw can pay")
			return
		}
	} else if session.ClawA.OwnerID != userID {
		response.ErrForbidden(ctx, c, "only the initiator can pay")
		return
	}

	if session.Status != "chatting" {
		response.ErrConflict(ctx, c, 40902, "session already paid or closed")
		return
	}

	var txnID string

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Lock and check payer balance
		var payerWallet model.Wallet
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&payerWallet, "user_id = ?", userID).Error; err != nil {
			return fmt.Errorf("payer wallet not found")
		}

		if payerWallet.Balance < req.Amount {
			return fmt.Errorf("insufficient balance")
		}

		// Deduct from payer — escrow: money held by platform, NOT credited to provider yet
		if err := tx.Model(&payerWallet).Update("balance", gorm.Expr("balance - ?", req.Amount)).Error; err != nil {
			return err
		}

		// Record escrow_hold transaction
		memo := fmt.Sprintf("%s: escrow hold", session.ClawB.Name)
		txn := model.Transaction{
			SessionID: &session.ID,
			FromID:    &userID,
			Amount:    req.Amount,
			Type:      "escrow_hold",
			Memo:      &memo,
		}
		if err := tx.Create(&txn).Error; err != nil {
			return err
		}
		txnID = txn.ID.String()

		// Update session status to paid + record escrowed amount + paid_at
		now := time.Now()
		if err := tx.Model(&session).Updates(map[string]any{
			"status":        "paid",
			"escrow_amount": req.Amount,
			"paid_at":       now,
		}).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		if err.Error() == "insufficient balance" {
			response.ErrConflict(ctx, c, 40901, "insufficient balance")
			return
		}
		response.ErrInternal(ctx, c, "payment failed")
		return
	}

	// Get updated balance
	var wallet model.Wallet
	database.DB.First(&wallet, "user_id = ?", userID)

	response.Success(ctx, c, PayResp{
		TransactionID: txnID,
		FromBalance:   wallet.Balance,
		Amount:        req.Amount,
	})
}

// --- Complete (escrow release) ---

// CompleteSession is called by the initiator (claw_a) to confirm delivery.
// Releases escrowed funds to the provider (claw_b).
func CompleteSession(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	sessionID := c.Param("id")

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", sessionID).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	// Only the initiator (claw_a owner) can confirm completion
	if clawID, ok := middleware.GetClawID(c); ok {
		if clawID != session.ClawAID {
			response.ErrForbidden(ctx, c, "only the initiator can confirm completion")
			return
		}
	} else if session.ClawA.OwnerID != userID {
		response.ErrForbidden(ctx, c, "only the initiator can confirm completion")
		return
	}

	if session.Status != "paid" {
		response.ErrConflict(ctx, c, 40902, "session must be paid before completing")
		return
	}

	providerOwnerID := session.ClawB.OwnerID

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// Release escrowed funds to provider
		var providerWallet model.Wallet
		tx.FirstOrCreate(&providerWallet, model.Wallet{UserID: providerOwnerID})
		if err := tx.Model(&providerWallet).Update("balance", gorm.Expr("balance + ?", session.EscrowAmount)).Error; err != nil {
			return err
		}

		// Record escrow_release transaction
		memo := fmt.Sprintf("%s: escrow release", session.ClawB.Name)
		txn := model.Transaction{
			SessionID: &session.ID,
			FromID:    &userID,
			ToID:      &providerOwnerID,
			Amount:    session.EscrowAmount,
			Type:      "escrow_release",
			Memo:      &memo,
		}
		if err := tx.Create(&txn).Error; err != nil {
			return err
		}

		// Update session status
		if err := tx.Model(&session).Update("status", "completed").Error; err != nil {
			return err
		}

		// Increment total_calls for provider claw
		if err := tx.Model(&model.Claw{}).Where("id = ?", session.ClawBID).
			Update("total_calls", gorm.Expr("total_calls + 1")).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		response.ErrInternal(ctx, c, "failed to complete session")
		return
	}

	response.Success(ctx, c, nil)
}

// --- Close / Refund ---

// CloseSession closes a session. If escrow funds are held (status=paid),
// refunds to the initiator (claw_a).
func CloseSession(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	sessionID := c.Param("id")

	var session model.Session
	if err := database.DB.Preload("ClawA").Preload("ClawB").First(&session, "id = ?", sessionID).Error; err != nil {
		response.ErrNotFound(ctx, c, "session not found")
		return
	}

	// Verify caller is a participant
	if session.ClawA.OwnerID != userID && session.ClawB.OwnerID != userID {
		response.ErrForbidden(ctx, c, "access denied")
		return
	}

	if session.Status == "closed" || session.Status == "completed" {
		response.ErrConflict(ctx, c, 40902, "session already closed or completed")
		return
	}

	// If paid, only the initiator can close (triggers refund)
	if session.Status == "paid" {
		if clawID, ok := middleware.GetClawID(c); ok {
			if clawID != session.ClawAID {
				response.ErrForbidden(ctx, c, "only the initiator can cancel a paid session")
				return
			}
		} else if session.ClawA.OwnerID != userID {
			response.ErrForbidden(ctx, c, "only the initiator can cancel a paid session")
			return
		}

		// Refund escrowed funds
		err := database.DB.Transaction(func(tx *gorm.DB) error {
			var payerWallet model.Wallet
			if err := tx.First(&payerWallet, "user_id = ?", userID).Error; err != nil {
				return err
			}
			if err := tx.Model(&payerWallet).Update("balance", gorm.Expr("balance + ?", session.EscrowAmount)).Error; err != nil {
				return err
			}

			memo := fmt.Sprintf("%s: escrow refund", session.ClawB.Name)
			txn := model.Transaction{
				SessionID: &session.ID,
				ToID:      &userID,
				Amount:    session.EscrowAmount,
				Type:      "escrow_refund",
				Memo:      &memo,
			}
			if err := tx.Create(&txn).Error; err != nil {
				return err
			}

			return tx.Model(&session).Updates(map[string]any{
				"status":        "closed",
				"escrow_amount": 0,
			}).Error
		})

		if err != nil {
			response.ErrInternal(ctx, c, "failed to refund and close session")
			return
		}

		response.Success(ctx, c, nil)
		return
	}

	// chatting → closed (no money involved)
	database.DB.Model(&session).Update("status", "closed")
	response.Success(ctx, c, nil)
}

// --- Transactions ---

func ListTransactions(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	txType := c.DefaultQuery("type", "")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := database.DB.Model(&model.Transaction{}).Where("from_id = ? OR to_id = ?", userID, userID)

	if txType != "" {
		query = query.Where("type = ?", txType)
	}

	var total int64
	query.Count(&total)

	var transactions []model.Transaction
	query.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&transactions)

	response.SuccessPage(ctx, c, transactions, total, page, pageSize)
}
