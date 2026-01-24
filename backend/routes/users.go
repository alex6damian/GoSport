package routes

import (
	"github.com/alex6damian/GoSport/backend/database"
	"github.com/alex6damian/GoSport/backend/models"
	"github.com/alex6damian/GoSport/backend/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Profile update structure
type UpdateProfileRequest struct {
	Username string `json:"username" validate:"omitempty,username_pattern,min=3,max=30"`
	Avatar   string `json:"avatar" validate:"omitempty,url"`
}

// Complete user profile response structure
type UserProfileResponse struct {
	ID               uint   `json:"id"`
	Username         string `json:"username"`
	Email            string `json:"email"`
	Role             string `json:"role"`
	Avatar           string `json:"avatar,omitempty"`
	VideosCount      int64  `json:"videos_count,omitempty"`
	SubscribersCount int64  `json:"subscribers_count,omitempty"`
	CreatedAt        string `json:"created_at"`
}

// GET /api/v1/users/me -> Get authenticated user's profile
func GetMyProfile(c *fiber.Ctx) error {
	// Get user ID from auth middleware
	userID := c.Locals("userID").(uint)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, "User not found", fiber.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Database error", fiber.StatusInternalServerError)
	}

	// Count uploaded videos
	var videosCount int64
	database.DB.Model(&models.Video{}).Where("user_id = ?", user.ID).Count(&videosCount)

	// Count subscribers
	var subscribersCount int64
	database.DB.Model(&models.Subscription{}).Where("creator_id = ?", user.ID).Count(&subscribersCount)

	response := UserProfileResponse{
		ID:               user.ID,
		Username:         user.Username,
		Email:            user.Email,
		Role:             user.Role,
		Avatar:           user.Avatar,
		VideosCount:      videosCount,
		SubscribersCount: subscribersCount,
		CreatedAt:        user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	return utils.SuccessResponse(c, response)
}

// PUT /api/v1/users/me -> Update authenticated user's profile
func UpdateMyProfile(c *fiber.Ctx) error {
	// Get user ID from auth middleware
	userID := c.Locals("userID").(uint)

	var req UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return utils.ValidationErrorResponse(c, map[string]string{"body": "Invalid request body"})
	}

	// Validate input
	if err := utils.ValidateStruct(req); err != nil {
		return utils.ValidationErrorResponse(c, map[string]string{"validation": err.Error()})
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return utils.ErrorResponse(c, "User not found", fiber.StatusNotFound)
	}

	// Update fields if provided
	if req.Username != "" {
		// Check if username is taken
		var existingUser models.User
		if err := database.DB.Where("username = ? AND id != ?", req.Username, userID).First(&existingUser).Error; err == nil {
			return utils.ErrorResponse(c, "Username already taken", fiber.StatusBadRequest)
		}
		user.Username = req.Username
	}

	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	// Save changes
	if err := database.DB.Save(&user).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to update profile", fiber.StatusInternalServerError)
	}

	// Return updated profile
	var videosCount, subscribersCount int64
	database.DB.Model(&models.Video{}).Where("user_id = ?", user.ID).Count(&videosCount)
	database.DB.Model(&models.Subscription{}).Where("creator_id = ?", user.ID).Count(&subscribersCount)

	response := UserProfileResponse{
		ID:               user.ID,
		Username:         user.Username,
		Email:            user.Email,
		Role:             user.Role,
		Avatar:           user.Avatar,
		VideosCount:      videosCount,
		SubscribersCount: subscribersCount,
		CreatedAt:        user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	return utils.SuccessResponse(c, response)
}

// GET /api/v1/users/:username -> Get user profile by username
func GetUserProfileByUsername(c *fiber.Ctx) error {
	username := c.Params("username")

	if username == "" {
		return utils.ErrorResponse(c, "Username is required", fiber.StatusBadRequest)
	}

	var user models.User
	var err error

	if err = database.DB.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, "User not found", fiber.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Database error", fiber.StatusInternalServerError)
	}

	// Count videos and subscribers
	var videosCount, subscribersCount int64
	database.DB.Model(&models.Video{}).Where("user_id = ?", user.ID).Count(&videosCount)
	database.DB.Model(&models.Subscription{}).Where("creator_id = ?", user.ID).Count(&subscribersCount)

	// Public profile
	response := UserProfileResponse{
		Username:         user.Username,
		Avatar:           user.Avatar,
		VideosCount:      videosCount,
		SubscribersCount: subscribersCount,
		CreatedAt:        user.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	return utils.SuccessResponse(c, response)
}

// GET /api/v1/users/:username/videos -> Get videos uploaded by a user
func GetUserVideosByUsername(c *fiber.Ctx) error {
	username := c.Params("username")

	if username == "" {
		return utils.ErrorResponse(c, "Username is required", fiber.StatusBadRequest)
	}

	// Find user by username
	var user models.User
	if err := database.DB.Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, "User not found", fiber.StatusNotFound)
		}
		return utils.ErrorResponse(c, "Database error", fiber.StatusInternalServerError)
	}

	// Parse pagination
	pagination := utils.ParsePagination(c)

	// Parse query filters
	filters := utils.ParseQueryFilters(c, "created_at")

	// Validate sort field
	allowedSortFields := []string{"created_at", "views", "title"}
	sortBy := utils.ValidateSortField(filters.SortBy, allowedSortFields)

	// Get videos count
	var videosCount int64
	database.DB.Model(&models.Video{}).Where("user_id = ?", user.ID).Count(&videosCount)

	// Get videos
	var videos []models.Video
	orderClause := utils.BuildOrderClause(sortBy, filters.Order)

	if err := database.DB.
		Where("user_id = ? AND status = ?", user.ID, "ready").
		Order(orderClause).
		Limit(pagination.Limit).
		Offset(pagination.Offset).
		Find(&videos).Error; err != nil {
		return utils.ErrorResponse(c, "Database error", fiber.StatusInternalServerError)
	}

	// Create pagination metadata
	paginationMeta := utils.CreatePaginationMeta(pagination.Page, pagination.Limit, videosCount)

	// Return response
	return utils.PaginatedResponse(c, fiber.Map{
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"avatar":   user.Avatar,
		},
		"videos": videos,
	}, paginationMeta)
}
