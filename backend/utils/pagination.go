package utils

import (
	"math"

	"github.com/gofiber/fiber/v2"
)

// Pagination parameters structure
type PaginationParams struct {
	Page   int `json:"page"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

// Pagination metadata in response
type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

// Extracts and validates pagination parameters from query
func ParsePagination(c *fiber.Ctx) PaginationParams {
	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)

	// Validate page
	if page < 1 {
		page = 1
	}

	// Validate limit
	if limit < 1 {
		limit = 10
	} else if limit > 100 {
		limit = 100
	}

	offset := (page - 1) * limit

	return PaginationParams{
		Page:   page,
		Limit:  limit,
		Offset: offset,
	}
}

// Creates pagination metadata for response
func CreatePaginationMeta(page, limit int, total int64) PaginationMeta {
	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

// Creates a standardized paginated response
func PaginatedResponse(c *fiber.Ctx, data interface{}, pagination PaginationMeta) error {
	return c.JSON(fiber.Map{
		"success":    true,
		"data":       data,
		"pagination": pagination,
	})
}
