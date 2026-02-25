package routes

import (
	"fmt"

	"github.com/gofiber/fiber/v2"

	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
)

// CreateRSSFeed adds new RSS feed (admin only)
func CreateRSSFeed(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name" validate:"required"`
		URL      string `json:"url" validate:"required,url"`
		Sport    string `json:"sport" validate:"required"`
		Language string `json:"language"`
	}

	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	if err := utils.ValidateStruct(req); err != nil {
		return utils.ValidationErrorResponse(c, map[string]string{"validation": err.Error()})
	}

	feed := models.RSSFeed{
		Name:     req.Name,
		URL:      req.URL,
		Sport:    req.Sport,
		Language: req.Language,
		Active:   true,
	}

	if err := database.DB.Create(&feed).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to create feed", fiber.StatusInternalServerError)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "RSS feed created successfully",
		"data":    feed,
	})
}

// GetRSSFeeds lists all configured feeds
func GetRSSFeeds(c *fiber.Ctx) error {
	var feeds []models.RSSFeed
	if err := database.DB.Order("created_at DESC").Find(&feeds).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to fetch feeds", fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, fiber.Map{
		"feeds": feeds,
	})
}

// SyncRSSFeed manually triggers sync for a feed
func SyncRSSFeed(c *fiber.Ctx) error {
	feedID := c.Params("id")

	rssService := services.NewRSSService(database.DB)

	var id uint
	if _, err := fmt.Sscanf(feedID, "%d", &id); err != nil {
		return utils.ErrorResponse(c, "Invalid feed ID", fiber.StatusBadRequest)
	}

	if err := rssService.FetchAndStore(id); err != nil {
		return utils.ErrorResponse(c, fmt.Sprintf("Sync failed: %v", err), fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, fiber.Map{
		"message": "Feed synced successfully",
	})
}

// SyncAllFeeds triggers sync for all active feeds
func SyncAllFeeds(c *fiber.Ctx) error {
	rssService := services.NewRSSService(database.DB)

	if err := rssService.SyncAllFeeds(); err != nil {
		return utils.ErrorResponse(c, fmt.Sprintf("Sync failed: %v", err), fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, fiber.Map{
		"message": "All feeds synced successfully",
	})
}

// DeleteRSSFeed deletes a feed
func DeleteRSSFeed(c *fiber.Ctx) error {
	feedID := c.Params("id")

	if err := database.DB.Delete(&models.RSSFeed{}, feedID).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to delete feed", fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, fiber.Map{
		"message": "Feed deleted successfully",
	})
}
