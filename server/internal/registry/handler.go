package registry

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/database"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/middleware"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/model"
	"github.com/ottin4ttc/talent-claw-platform/server/internal/common/response"
	"gorm.io/gorm"
)

// --- Claw CRUD ---

type CreateClawReq struct {
	Name         string          `json:"name" vd:"len($)>0"`
	Description  string          `json:"description" vd:"len($)>0"`
	Capabilities json.RawMessage `json:"capabilities"`
	Tags         []string        `json:"tags"`
	Pricing      json.RawMessage `json:"pricing"`
}

func CreateClaw(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	var req CreateClawReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	caps := model.JSON(req.Capabilities)
	if len(req.Capabilities) == 0 {
		caps = model.JSON("[]")
	}

	var pricing model.JSON
	if len(req.Pricing) > 0 {
		pricing = model.JSON(req.Pricing)
	}

	claw := model.Claw{
		OwnerID:      userID,
		Name:         req.Name,
		Description:  req.Description,
		Capabilities: caps,
		Tags:         req.Tags,
		Pricing:      pricing,
		Status:       "offline",
	}

	if err := database.DB.Create(&claw).Error; err != nil {
		response.ErrInternal(ctx, c, "failed to create claw")
		return
	}

	response.Success(ctx, c, claw)
}

type UpdateClawReq struct {
	Name         *string          `json:"name"`
	Description  *string          `json:"description"`
	Capabilities *json.RawMessage `json:"capabilities"`
	Tags         *[]string        `json:"tags"`
	Pricing      *json.RawMessage `json:"pricing"`
	Status       *string          `json:"status"`
}

func UpdateClaw(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var claw model.Claw
	if err := database.DB.First(&claw, "id = ? AND owner_id = ?", id, userID).Error; err != nil {
		response.ErrNotFound(ctx, c, "claw not found")
		return
	}

	var req UpdateClawReq
	if err := c.BindAndValidate(&req); err != nil {
		response.ErrBadRequest(ctx, c, err.Error())
		return
	}

	updates := map[string]any{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Capabilities != nil {
		updates["capabilities"] = model.JSON(*req.Capabilities)
	}
	if req.Tags != nil {
		updates["tags"] = model.StringArray(*req.Tags)
	}
	if req.Pricing != nil {
		updates["pricing"] = model.JSON(*req.Pricing)
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if len(updates) > 0 {
		database.DB.Model(&claw).Updates(updates)
	}

	database.DB.First(&claw, "id = ?", id)
	response.Success(ctx, c, claw)
}

func GetClaw(ctx context.Context, c *app.RequestContext) {
	id := c.Param("id")

	var claw model.Claw
	if err := database.DB.First(&claw, "id = ?", id).Error; err != nil {
		response.ErrNotFound(ctx, c, "claw not found")
		return
	}

	response.Success(ctx, c, claw)
}

func DeleteClaw(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	result := database.DB.Where("id = ? AND owner_id = ?", id, userID).Delete(&model.Claw{})
	if result.RowsAffected == 0 {
		response.ErrNotFound(ctx, c, "claw not found")
		return
	}

	response.Success(ctx, c, nil)
}

func MyClaws(ctx context.Context, c *app.RequestContext) {
	userID, _ := middleware.GetUserID(c)

	var claws []model.Claw
	database.DB.Where("owner_id = ?", userID).Order("created_at DESC").Find(&claws)

	response.Success(ctx, c, claws)
}

// --- Search ---

func SearchClaws(ctx context.Context, c *app.RequestContext) {
	q := c.DefaultQuery("q", "")
	tags := c.DefaultQuery("tags", "")
	status := c.DefaultQuery("status", "")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	order := c.DefaultQuery("order", "desc")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Validate sort_by
	allowedSorts := map[string]bool{
		"created_at":  true,
		"rating_avg":  true,
		"total_calls": true,
	}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}
	if order != "asc" {
		order = "desc"
	}

	query := database.DB.Model(&model.Claw{})

	if q != "" {
		like := "%" + q + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", like, like)
	}

	if tags != "" {
		// tags=translation,nlp → WHERE tags && ARRAY['translation','nlp']
		query = query.Where("tags && ?::text[]", "{"+tags+"}")
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var claws []model.Claw
	query.Order(sortBy + " " + order).
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&claws)

	response.SuccessPage(ctx, c, claws, total, page, pageSize)
}

// FindClawByID is an internal helper for other modules.
func FindClawByID(id uuid.UUID) (*model.Claw, error) {
	var claw model.Claw
	if err := database.DB.First(&claw, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &claw, nil
}
