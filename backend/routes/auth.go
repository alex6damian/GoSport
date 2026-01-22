package routes

import (
	"github.com/alex6damian/GoSport/backend/database"
	"github.com/alex6damian/GoSport/backend/models"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// RegisterRequest represents the expected payload for user registration
type RegisterRequest struct {
	Username string `json:"username" validate:"required,alphanum,min=3,max=30"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Role     string `json:"role" validate:"required,oneof=viewer creator"`
}

// LoginRequest represents the expected payload for user login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// AuthResponse represents the response containing the JWT token
type AuthResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token"`
}

// UserResponse represents the user data returned in responses
type UserResponse struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Avatar    string `json:"avatar,omitempty"`
	CreatedAt string `json:"created_at"`
}

// Register handler - POST /api/v1/auth/register
func Register(c *fiber.Ctx) error {
	var req RegisterRequest

	// Parse and validate request
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	if err := utils.ValidateStruct(req); err != nil {
		// convert validation error to a map[string]string expected by ValidationErrorResponse
		return utils.ValidationErrorResponse(c, map[string]string{"error": err.Error()})
	}

	// Custom validations
	if !utils.IsValidEmail(req.Email) {
		return utils.ErrorResponse(c, "Invalid email format", fiber.StatusBadRequest)
	}

	if !utils.IsStrongPassword(req.Password) {
		return utils.ErrorResponse(c, "Password must be at least 8 characters long, contain an uppercase letter and a number", fiber.StatusBadRequest)
	}

	// Set default role
	if req.Role == "" {
		req.Role = "viewer"
	}

	// Check if exists
	var existingUser models.User
	if err := database.DB.Where("email=?", req.Email).Or("username=?", req.Username).First(&existingUser).Error; err == nil {
		return utils.ErrorResponse(c, "User with given email or username already exists", fiber.StatusConflict)
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to hash password", fiber.StatusInternalServerError)
	}

	// Create user
	user := models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     req.Role,
	}

	// Insert user to DB
	if err := database.DB.Create(&user).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to create user", fiber.StatusInternalServerError)
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to generate token", fiber.StatusInternalServerError)
	}

	// Response
	response := AuthResponse{
		User: UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      user.Role,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		},
		Token: token,
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    response,
	})
}

// Login handler - POST /api/v1/auth/login
func Login(c *fiber.Ctx) error {
	var req LoginRequest

	// Parse and validate request
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	if err := utils.ValidateStruct(req); err != nil {
		// convert validation error to a map[string]string expected by ValidationErrorResponse
		return utils.ValidationErrorResponse(c, map[string]string{"error": err.Error()})
	}

	// Find user by email
	var user models.User
	if err := database.DB.Where("email=?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, "Invalid credentials", fiber.StatusUnauthorized)
		}
		return utils.ErrorResponse(c, "Database error", fiber.StatusInternalServerError)
	}

	// Check password
	if !utils.CheckPassword(user.Password, req.Password) {
		return utils.ErrorResponse(c, "Invalid credentials", fiber.StatusUnauthorized)
	}

	// Generate JWT token
	token, err := utils.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to generate token", fiber.StatusInternalServerError)
	}

	// Response
	response := AuthResponse{
		User: UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      user.Role,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		},
		Token: token,
	}

	return utils.SuccessResponse(c, response)
}
