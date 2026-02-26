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
	// Validate request body
	var req struct {
		Name     string `json:"name" validate:"required"`
		URL      string `json:"url" validate:"required,url"`
		Sport    string `json:"sport" validate:"required"`
		Language string `json:"language"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	// Validate struct
	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	// Set default language
	if req.Language == "" {
		req.Language = "en"
	}

	// Create feed
	feed := models.RSSFeed{
		Name:     req.Name,
		URL:      req.URL,
		Sport:    req.Sport,
		Language: req.Language,
		Active:   true,
	}

	if err := database.DB.Create(&feed).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to create feed: " + err.Error(),
		})
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to fetch feeds",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"feeds": feeds,
		},
	})
}

// SyncRSSFeed manually triggers sync for a feed
func SyncRSSFeed(c *fiber.Ctx) error {
	feedID := c.Params("id")

	rssService := services.NewRSSService(database.DB)

	var id uint
	if _, err := fmt.Sscanf(feedID, "%d", &id); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid feed ID",
		})
	}

	if err := rssService.FetchAndStore(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fmt.Sprintf("Sync failed: %v", err),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"message": "Feed synced successfully",
		},
	})
}

// SyncAllFeeds triggers sync for all active feeds
func SyncAllFeeds(c *fiber.Ctx) error {
	rssService := services.NewRSSService(database.DB)

	if err := rssService.SyncAllFeeds(); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fmt.Sprintf("Sync failed: %v", err),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"message": "All feeds synced successfully",
		},
	})
}

// DeleteRSSFeed deletes a feed
func DeleteRSSFeed(c *fiber.Ctx) error {
	feedID := c.Params("id")

	if err := database.DB.Delete(&models.RSSFeed{}, feedID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to delete feed",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"message": "Feed deleted successfully",
		},
	})
}

// UpdateRSSFeed updates feed configuration
func UpdateRSSFeed(c *fiber.Ctx) error {
	feedID := c.Params("id")

	var req struct {
		Name     string `json:"name"`
		URL      string `json:"url"`
		Sport    string `json:"sport"`
		Language string `json:"language"`
		Active   *bool  `json:"active"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	var feed models.RSSFeed
	if err := database.DB.First(&feed, feedID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "Feed not found",
		})
	}

	// Update fields if provided
	if req.Name != "" {
		feed.Name = req.Name
	}
	if req.URL != "" {
		feed.URL = req.URL
	}
	if req.Sport != "" {
		feed.Sport = req.Sport
	}
	if req.Language != "" {
		feed.Language = req.Language
	}
	if req.Active != nil {
		feed.Active = *req.Active
	}

	if err := database.DB.Save(&feed).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to update feed",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"message": "Feed updated successfully",
			"feed":    feed,
		},
	})
}
