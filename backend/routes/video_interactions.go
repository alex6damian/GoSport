package routes

import (
	"log"
	"strconv"

	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/models"
	"github.com/gofiber/fiber/v2"
)

func getVideoInteractionService() *services.VideoInteractionService {
	return services.NewVideoInteractionService()
}

// ToggleLike handles like/unlike
func ToggleLike(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	service := getVideoInteractionService()
	isLiked, err := service.ToggleLike(userID, uint(videoID))
	if err != nil {
		log.Printf("ToggleLike error: %v", err)
		return utils.ErrorResponse(c, "Failed to toggle like", fiber.StatusInternalServerError)
	}

	message := "Video liked"
	if !isLiked {
		message = "Video unliked"
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"message":  message,
		"is_liked": isLiked,
	})
}

// GetVideoLikes returns users who liked the video
func GetVideoLikes(c *fiber.Ctx) error {
	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset := (page - 1) * limit

	service := getVideoInteractionService()
	users, total, err := service.GetVideoLikes(uint(videoID), limit, offset)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to fetch likes", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    users,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

// CheckIfLiked returns if current user liked the video
func CheckIfLiked(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uint)
	if !ok {
		return c.JSON(fiber.Map{
			"success":  true,
			"is_liked": false,
		})
	}

	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	service := getVideoInteractionService()
	isLiked := service.IsLiked(userID, uint(videoID))

	return c.JSON(fiber.Map{
		"success":  true,
		"is_liked": isLiked,
	})
}

// TrackView records a video view
func TrackView(c *fiber.Ctx) error {
	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	// Get user ID if authenticated
	var userID *uint
	if uid, ok := c.Locals("userID").(uint); ok {
		userID = &uid
	}

	// Get IP and user agent
	ipAddress := c.IP()
	userAgent := c.Get("User-Agent")

	service := getVideoInteractionService()
	err = service.TrackView(userID, uint(videoID), ipAddress, userAgent)
	if err != nil {
		log.Printf("TrackView error: %v", err)
		return utils.ErrorResponse(c, "Failed to track view", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "View tracked",
	})
}

// UpdateWatchProgress updates watch duration
func UpdateWatchProgress(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	var body struct {
		Duration int `json:"duration"` // seconds watched
	}

	if err := c.BodyParser(&body); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	if body.Duration < 0 {
		return utils.ErrorResponse(c, "Invalid duration", fiber.StatusBadRequest)
	}

	service := getVideoInteractionService()
	err = service.UpdateWatchProgress(userID, uint(videoID), body.Duration)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to update progress", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Progress updated",
	})
}

// GetWatchHistory returns user's watch history
func GetWatchHistory(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset := (page - 1) * limit

	service := getVideoInteractionService()
	videos, err := service.GetWatchHistory(userID, limit, offset)
	if err != nil {
		log.Printf("GetWatchHistory error: %v", err)
		return utils.ErrorResponse(c, "Failed to fetch watch history", fiber.StatusInternalServerError)
	}

	if videos == nil {
		videos = []models.Video{}
	}

	log.Printf("✅ GetWatchHistory returning %d videos", len(videos))

	return c.JSON(fiber.Map{
		"success": true,
		"data":    videos,
		"page":    page,
		"limit":   limit,
	})
}

// ToggleFavorite adds/removes from favorites
func ToggleFavorite(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	service := getVideoInteractionService()
	isFavorited, err := service.ToggleFavorite(userID, uint(videoID))
	if err != nil {
		log.Printf("ToggleFavorite error: %v", err)
		return utils.ErrorResponse(c, "Failed to toggle favorite", fiber.StatusInternalServerError)
	}

	message := "Added to favorites"
	if !isFavorited {
		message = "Removed from favorites"
	}

	return c.JSON(fiber.Map{
		"success":      true,
		"message":      message,
		"is_favorited": isFavorited,
	})
}

// GetFavorites returns user's favorite videos
func GetFavorites(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset := (page - 1) * limit

	service := getVideoInteractionService()
	videos, err := service.GetFavorites(userID, limit, offset)
	if err != nil {
		log.Printf("GetFavorites error: %v", err)
		return utils.ErrorResponse(c, "Failed to fetch favorites", fiber.StatusInternalServerError)
	}

	if videos == nil {
		videos = []models.Video{}
	}

	log.Printf("✅ GetFavorites returning %d videos", len(videos))

	return c.JSON(fiber.Map{
		"success": true,
		"data":    videos,
		"page":    page,
		"limit":   limit,
	})
}

// CheckIfFavorited returns if video is in user's favorites
func CheckIfFavorited(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uint)
	if !ok {
		return c.JSON(fiber.Map{
			"success":      true,
			"is_favorited": false,
		})
	}

	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	service := getVideoInteractionService()
	isFavorited := service.IsFavorited(userID, uint(videoID))

	return c.JSON(fiber.Map{
		"success":      true,
		"is_favorited": isFavorited,
	})
}

// GetVideoStats returns video statistics
func GetVideoStats(c *fiber.Ctx) error {
	videoID, err := c.ParamsInt("id")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid video ID", fiber.StatusBadRequest)
	}

	service := getVideoInteractionService()
	stats, err := service.GetVideoStats(uint(videoID))
	if err != nil {
		return utils.ErrorResponse(c, "Failed to fetch stats", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}
