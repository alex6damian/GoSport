package routes

import (
	"github.com/gofiber/fiber/v2"

	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
)

// Lists all news with pagination and filters
func GetNews(c *fiber.Ctx) error {
	pagination := utils.ParsePagination(c)
	filters := utils.ParseQueryFilters(c, "published_at")

	// Get sport filter
	sport := c.Query("sport")
	source := c.Query("source")

	// Build query
	query := database.DB.Model(&models.NewsArticle{})

	// Apply filters
	if sport != "" {
		query = query.Where("sport = ?", sport)
	}
	if source != "" {
		query = query.Where("source = ?", source)
	}
	if filters.Search != "" {
		query = query.Where("title ILIKE ? OR summary ILIKE ?",
			"%"+filters.Search+"%",
			"%"+filters.Search+"%")
	}

	var total int64
	query.Count(&total)

	// Get articles
	var articles []models.NewsArticle
	allowedSortFields := []string{"published_at", "created_at", "title"}
	sortBy := utils.ValidateSortField(filters.SortBy, allowedSortFields)
	orderClause := utils.BuildOrderClause(sortBy, filters.Order)

	if err := query.
		Order(orderClause).
		Limit(pagination.Limit).
		Offset(pagination.Offset).
		Find(&articles).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to fetch news", fiber.StatusInternalServerError)
	}

	paginationMeta := utils.CreatePaginationMeta(pagination.Page, pagination.Limit, total)

	return utils.PaginatedResponse(c, fiber.Map{
		"articles": articles,
	}, paginationMeta)
}

// Gets news filtered by sport
func GetNewsBySport(c *fiber.Ctx) error {
	sport := c.Params("sport")
	pagination := utils.ParsePagination(c)

	var total int64
	database.DB.Model(&models.NewsArticle{}).Where("sport = ?", sport).Count(&total)

	var articles []models.NewsArticle
	if err := database.DB.
		Where("sport = ?", sport).
		Order("published_at DESC").
		Limit(pagination.Limit).
		Offset(pagination.Offset).
		Find(&articles).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to fetch news", fiber.StatusInternalServerError)
	}

	paginationMeta := utils.CreatePaginationMeta(pagination.Page, pagination.Limit, total)

	return utils.PaginatedResponse(c, fiber.Map{
		"articles": articles,
		"sport":    sport,
	}, paginationMeta)
}
