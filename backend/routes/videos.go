package routes

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
)

// Allowed video formats
var allowedVideoFormats = map[string]bool{
	".mp4":  true,
	".mov":  true,
	".avi":  true,
	".mkv":  true,
	".webm": true,
}

// Max video size: 100 MB
const maxVideoSize = 100 * 1024 * 1024

// UploadVideo handles video file upload - POST /api/v1/videos
func UploadVideo(c *fiber.Ctx) error {
	// Get authenticated user
	userID := c.Locals("userID").(uint)

	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return utils.ErrorResponse(c, "Invalid form data", fiber.StatusBadRequest)
	}

	// Get video file
	files := form.File["video"]
	if len(files) == 0 {
		return utils.ErrorResponse(c, "Invalid form data", fiber.StatusBadRequest)
	}

	file := files[0]

	// Validate file size
	if file.Size > maxVideoSize {
		return utils.ErrorResponse(c, fmt.Sprintf("File too large. Max size: %d MB", maxVideoSize/(1024*1024)), fiber.StatusBadRequest)
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedVideoFormats[ext] {
		return utils.ErrorResponse(c, "Invalid file format. Allowed: mp4, mov, avi, mkv, webm", fiber.StatusBadRequest)
	}

	// Get metadata from form
	title := c.FormValue("title")
	description := c.FormValue("description")
	sport := c.FormValue("sport") // football, basketball, etc.

	// Validate required fields
	if title == "" {
		return utils.ErrorResponse(c, "Title is required", fiber.StatusBadRequest)
	}

	// Open file
	fileHeader, err := file.Open()
	if err != nil {
		return utils.ErrorResponse(c, "Failed to read file", fiber.StatusInternalServerError)
	}
	defer fileHeader.Close()

	// Upload to MinIO
	minioKey, err := services.UploadVideo(fileHeader, file.Filename, file.Size, file.Header.Get("Content-Type"))
	if err != nil {
		return utils.ErrorResponse(c, fmt.Sprintf("Failed to upload video: %v", err), fiber.StatusInternalServerError)
	}

	// Create video record in database
	video := models.Video{
		Title:       title,
		Description: description,
		Sport:       sport,
		UserID:      userID,
		MinioKey:    minioKey,
		FileName:    file.Filename,
		FileSize:    file.Size,
		MimeType:    file.Header.Get("Content-Type"),
		Status:      "pending", // "ready" for simplicity, in real app this would be "pending" and a background worker would process it
	}

	if err := database.DB.Create(&video).Error; err != nil {
		// Cleanup: delete from MinIO if DB insert fails
		services.DeleteVideo(minioKey)
		return utils.ErrorResponse(c, "Failed to save video", fiber.StatusInternalServerError)
	}

	// Create processing job
	processingJob := models.ProcessingJob{
		VideoID: video.ID,
		Status:  "queued",
	}

	if err := database.DB.Create(&processingJob).Error; err != nil {
		// Cleanup: delete video record and MinIO file if job creation fails
		database.DB.Delete(&video)
		services.DeleteVideo(minioKey)
		return utils.ErrorResponse(c, "Failed to create processing job", fiber.StatusInternalServerError)
	}

	// Load user info
	database.DB.Preload("User").First(&video, video.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Video uploaded successfully",
		"data":    video,
	})
}

// ListVideos lists all videos with pagination and filters - GET /api/v1/videos
func ListVideos(c *fiber.Ctx) error {
	// Parse pagination
	pagination := utils.ParsePagination(c)

	// Parse filters
	filters := utils.ParseQueryFilters(c, "created_at")

	// Get sport filter
	sport := c.Query("sport")

	// Build query
	query := database.DB.Model(&models.Video{}).Where("status = ?", "ready")

	// Apply sport filter
	if sport != "" {
		query = query.Where("sport = ?", sport)
	}

	// Apply search filter
	if filters.Search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?",
			"%"+filters.Search+"%",
			"%"+filters.Search+"%")
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get videos
	var videos []models.Video
	allowedSortFields := []string{"created_at", "views", "likes", "title"}
	sortBy := utils.ValidateSortField(filters.SortBy, allowedSortFields)
	orderClause := utils.BuildOrderClause(sortBy, filters.Order)

	if err := query.
		Preload("User").
		Order(orderClause).
		Limit(pagination.Limit).
		Offset(pagination.Offset).
		Find(&videos).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to fetch videos", fiber.StatusInternalServerError)
	}

	// Create pagination metadata
	paginationMeta := utils.CreatePaginationMeta(pagination.Page, pagination.Limit, total)

	return utils.PaginatedResponse(c, fiber.Map{
		"videos": videos,
	}, paginationMeta)
}

// GetVideo retrieves video details with presigned URL - GET /api/v1/videos/:id
func GetVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")

	var video models.Video
	if err := database.DB.Preload("User").Preload("Comments").First(&video, videoID).Error; err != nil {
		return utils.ErrorResponse(c, "Video not found", fiber.StatusNotFound)
	}

	// Generate presigned URL (valid for 1 hour)
	videoURL, err := services.GetVideoURL(video.MinioKey, 1*time.Hour)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to generate video URL", fiber.StatusInternalServerError)
	}

	// Generate thumbnail URL if exists
	var thumbnailURL string
	if video.Thumbnail != "" {
		thumbnailURL, _ = services.GetVideoURL(video.Thumbnail, 1*time.Hour)
	}

	// Increment views
	database.DB.Model(&video).UpdateColumn("views", video.Views+1)

	return utils.SuccessResponse(c, fiber.Map{
		"video":         video,
		"video_url":     videoURL,
		"thumbnail_url": thumbnailURL,
	})
}

// DeleteVideo deletes video from MinIO and database - DELETE /api/v1/videos/:id
func DeleteVideo(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	videoID := c.Params("id")

	var video models.Video
	if err := database.DB.First(&video, videoID).Error; err != nil {
		return utils.ErrorResponse(c, "Video not found", fiber.StatusNotFound)
	}

	// Check ownership
	if video.UserID != userID {
		return utils.ErrorResponse(c, "You don't have permission to delete this video", fiber.StatusForbidden)
	}

	// Delete video file from MinIO
	if video.MinioKey != "" {
		if err := services.DeleteVideo(video.MinioKey); err != nil {
			return utils.ErrorResponse(c, "Failed to delete video file", fiber.StatusInternalServerError)
		}
	}

	// Delete thumbnail from MinIO if exists
	if video.Thumbnail != "" {
		services.DeleteVideo(video.Thumbnail) // Ignore error for thumbnail
	}

	// Delete from database (soft delete)
	if err := database.DB.Delete(&video).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to delete video record", fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, fiber.Map{
		"message": "Video deleted successfully",
	})
}

// UpdateVideo updates video metadata - PUT /api/v1/videos/:id
func UpdateVideo(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	videoID := c.Params("id")

	var video models.Video
	if err := database.DB.First(&video, videoID).Error; err != nil {
		return utils.ErrorResponse(c, "Video not found", fiber.StatusNotFound)
	}

	// Check ownership
	if video.UserID != userID {
		return utils.ErrorResponse(c, "You don't have permission to update this video", fiber.StatusForbidden)
	}

	// Parse request body
	var updates struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Sport       string `json:"sport"`
	}

	if err := c.BodyParser(&updates); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	// Update fields
	if updates.Title != "" {
		video.Title = updates.Title
	}
	if updates.Description != "" {
		video.Description = updates.Description
	}
	if updates.Sport != "" {
		video.Sport = updates.Sport
	}

	// Save updates
	if err := database.DB.Save(&video).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to update video", fiber.StatusInternalServerError)
	}

	// Load relations
	database.DB.Preload("User").First(&video, video.ID)

	return utils.SuccessResponse(c, fiber.Map{
		"message": "Video updated successfully",
		"video":   video,
	})
}
