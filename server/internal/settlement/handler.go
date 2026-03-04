package settlement

import (
	"context"
	"fmt"
	"strconv"

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

	providerOwnerID := session.ClawB.OwnerID

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

		// Deduct from payer
		if err := tx.Model(&payerWallet).Update("balance", gorm.Expr("balance - ?", req.Amount)).Error; err != nil {
			return err
		}

		// Add to provider
		var providerWallet model.Wallet
		tx.FirstOrCreate(&providerWallet, model.Wallet{UserID: providerOwnerID})
		if err := tx.Model(&providerWallet).Update("balance", gorm.Expr("balance + ?", req.Amount)).Error; err != nil {
			return err
		}

		// Record transaction
		memo := fmt.Sprintf("%s: payment", session.ClawB.Name)
		txn := model.Transaction{
			SessionID: &session.ID,
			FromID:    &userID,
			ToID:      &providerOwnerID,
			Amount:    req.Amount,
			Type:      "payment",
			Memo:      &memo,
		}
		if err := tx.Create(&txn).Error; err != nil {
			return err
		}
		txnID = txn.ID.String()

		// Update session status to paid
		if err := tx.Model(&session).Update("status", "paid").Error; err != nil {
			return err
		}

		// Increment total_calls for provider claw
		if err := tx.Model(&model.Claw{}).Where("id = ?", session.ClawBID).Update("total_calls", gorm.Expr("total_calls + 1")).Error; err != nil {
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
