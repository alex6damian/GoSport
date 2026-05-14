package routes

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/config"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
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

	// Replace raw MinIO thumbnail keys with presigned URLs
	for _, hit := range searchRes.Hits {
		if raw, ok := hit["thumbnail"]; ok {
			var thumbKey string
			if err := json.Unmarshal(raw, &thumbKey); err == nil && thumbKey != "" {
				if url, err := services.GetVideoURL(thumbKey, 1*time.Hour); err == nil {
					if encoded, err := json.Marshal(url); err == nil {
						hit["thumbnail"] = encoded
					}
				}
			}
		}
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

// ReindexAll - POST /api/v1/admin/reindex
func ReindexAll(c *fiber.Ctx) error {
	var videos []models.Video
	if err := database.DB.Preload("User").Find(&videos).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to fetch videos", fiber.StatusInternalServerError)
	}

	videoDocs := make([]map[string]interface{}, 0, len(videos))
	for _, v := range videos {
		videoDocs = append(videoDocs, map[string]interface{}{
			"id":          v.ID,
			"title":       v.Title,
			"description": v.Description,
			"sport":       v.Sport,
			"uploader":    v.User.Username,
			"created_at":  v.CreatedAt.Unix(),
			"views":       v.Views,
			"likes":       v.Likes,
			"tags":        v.Tags,
			"thumbnail":   v.Thumbnail,
			"duration":    v.Duration,
		})
	}
	if len(videoDocs) > 0 {
		if _, err := config.MeiliClient.Index("videos").AddDocuments(videoDocs, nil); err != nil {
			log.Printf("Failed to reindex videos: %v", err)
			return utils.ErrorResponse(c, "Failed to index videos", fiber.StatusInternalServerError)
		}
	}

	var articles []models.NewsArticle
	if err := database.DB.Find(&articles).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to fetch news", fiber.StatusInternalServerError)
	}

	newsDocs := make([]map[string]interface{}, 0, len(articles))
	for _, a := range articles {
		newsDocs = append(newsDocs, map[string]interface{}{
			"id":           a.ID,
			"title":        a.Title,
			"summary":      a.Summary,
			"content":      a.Content,
			"sport":        a.Sport,
			"source":       a.Source,
			"image_url":    a.ImageURL,
			"published_at": a.PublishedAt.Unix(),
		})
	}
	if len(newsDocs) > 0 {
		if _, err := config.MeiliClient.Index("news").AddDocuments(newsDocs, nil); err != nil {
			log.Printf("Failed to reindex news: %v", err)
			return utils.ErrorResponse(c, "Failed to index news", fiber.StatusInternalServerError)
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": fmt.Sprintf("Queued %d videos and %d news articles for indexing", len(videoDocs), len(newsDocs)),
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
