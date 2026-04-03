package routes

import (
	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/gofiber/fiber/v2"
)

func GetFeed(c *fiber.Ctx) error {
	pagination := utils.ParsePagination(c)

	videos, total, err := services.GetFeed(pagination)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to fetch feed", fiber.StatusInternalServerError)
	}

	meta := utils.CreatePaginationMeta(pagination.Page, pagination.Limit, total)
	return utils.PaginatedResponse(c, videos, meta)
}
