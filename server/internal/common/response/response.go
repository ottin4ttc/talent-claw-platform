package response

import (
	"context"
	"reflect"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
)

type Response struct {
	Code    int         `json:"code"`
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
}

type PageData struct {
	Items    interface{} `json:"items"`
	Total    int64       `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

func Success(ctx context.Context, c *app.RequestContext, data interface{}) {
	c.JSON(consts.StatusOK, Response{
		Code:    0,
		Data:    data,
		Message: "ok",
	})
}

func SuccessPage(ctx context.Context, c *app.RequestContext, items interface{}, total int64, page, pageSize int) {
	// Ensure items is never null in JSON — Go nil slices marshal as null, but frontend expects []
	if items == nil || (reflect.TypeOf(items).Kind() == reflect.Slice && reflect.ValueOf(items).IsNil()) {
		items = []struct{}{}
	}
	c.JSON(consts.StatusOK, Response{
		Code: 0,
		Data: PageData{
			Items:    items,
			Total:    total,
			Page:     page,
			PageSize: pageSize,
		},
		Message: "ok",
	})
}

func Error(ctx context.Context, c *app.RequestContext, httpStatus int, code int, message string) {
	c.JSON(httpStatus, Response{
		Code:    code,
		Data:    nil,
		Message: message,
	})
}

// Common error helpers

func ErrUnauthorized(ctx context.Context, c *app.RequestContext, message string) {
	Error(ctx, c, consts.StatusUnauthorized, 40001, message)
}

func ErrForbidden(ctx context.Context, c *app.RequestContext, message string) {
	Error(ctx, c, consts.StatusForbidden, 40101, message)
}

func ErrNotFound(ctx context.Context, c *app.RequestContext, message string) {
	Error(ctx, c, consts.StatusNotFound, 40401, message)
}

func ErrBadRequest(ctx context.Context, c *app.RequestContext, message string) {
	Error(ctx, c, consts.StatusBadRequest, 42201, message)
}

func ErrConflict(ctx context.Context, c *app.RequestContext, code int, message string) {
	Error(ctx, c, consts.StatusConflict, code, message)
}

func ErrInternal(ctx context.Context, c *app.RequestContext, message string) {
	Error(ctx, c, consts.StatusInternalServerError, 50001, message)
}
