package routes

import (
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/config"
	"github.com/gofiber/fiber/v2"
	"github.com/meilisearch/meilisearch-go"
)

// Search videos - GET /api/v1/search/videos?q=messi&sport=football
func SearchVideos(c *fiber.Ctx) error {
	query := c.Query("q")
	if query == "" {
		return utils.ErrorResponse(c, "Search query required", fiber.StatusBadRequest)
	}

	sport := c.Query("sport")
	sortBy := c.Query("sort", "created_at:desc") // Default sort
	limit := c.QueryInt("limit", 20)

	// Build filter
	var filter string
	if sport != "" {
		filter = "sport = " + sport
	}

	// Search
	searchRes, err := config.MeiliClient.Index("videos").Search(query, &meilisearch.SearchRequest{
		Limit:  int64(limit),
		Filter: filter,
		Sort:   []string{sortBy},
	})

	if err != nil {
		return utils.ErrorResponse(c, "Search failed", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"query":           query,
			"hits":            searchRes.Hits,
			"processing_time": searchRes.ProcessingTimeMs,
			"total":           searchRes.EstimatedTotalHits,
		},
	})
}

// Search news - GET /api/v1/search/news?q=champions+league
func SearchNews(c *fiber.Ctx) error {
	query := c.Query("q")
	if query == "" {
		return utils.ErrorResponse(c, "Search query required", fiber.StatusBadRequest)
	}

	sport := c.Query("sport")
	source := c.Query("source")
	limit := c.QueryInt("limit", 20)

	// Build filters
	filters := []string{}
	if sport != "" {
		filters = append(filters, "sport = "+sport)
	}
	if source != "" {
		filters = append(filters, "source = "+source)
	}

	var filter string
	if len(filters) > 0 {
		filter = filters[0]
		for i := 1; i < len(filters); i++ {
			filter += " AND " + filters[i]
		}
	}

	searchRes, err := config.MeiliClient.Index("news").Search(query, &meilisearch.SearchRequest{
		Limit:  int64(limit),
		Filter: filter,
		Sort:   []string{"published_at:desc"},
	})

	if err != nil {
		return utils.ErrorResponse(c, "Search failed", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"query":           query,
			"hits":            searchRes.Hits,
			"processing_time": searchRes.ProcessingTimeMs,
			"total":           searchRes.EstimatedTotalHits,
		},
	})
}
