package routes

import (
	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// RegisterRequest represents the expected payload for user registration
type RegisterRequest struct {
	Username string `json:"username" validate:"required,username_pattern"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,strong_password"`
	Role     string `json:"role" validate:"omitempty,oneof=user admin"`
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
	Verified  bool   `json:"verified"`
	Role      string `json:"role"`
	Avatar    string `json:"avatar,omitempty"`
	CreatedAt string `json:"created_at"`
}

// ForgotPasswordRequest represents the payload for requesting a password reset
type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// ResetPasswordRequest represents the payload for resetting password with token
type ResetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,strong_password"`
}

// Register handler - POST /api/v1/auth/register
func Register(c *fiber.Ctx) error {
	var req RegisterRequest

	// Parse and validate request
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	// All validation in one call
	if err := utils.ValidateStruct(req); err != nil {
		return utils.ErrorResponse(c, err.Error(), fiber.StatusBadRequest)
	}

	// Set default role
	if req.Role == "" {
		req.Role = "user"
	}

	// Prevent creating admin users through registration
	if req.Role == "admin" {
		return utils.ErrorResponse(c, "Cannot create admin users through registration", fiber.StatusForbidden)
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

	// Generate validation token
	valToken, err := services.GenerateVerificationToken()
	if err != nil {
		return utils.ErrorResponse(c, "Failed to generate verification token", fiber.StatusInternalServerError)
	}

	// Save for 24h
	err = services.SaveVerificationToken(&user, valToken)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to save verification token", fiber.StatusInternalServerError)
	}

	// Send verification email
	go func() {
		err := services.SendVerificationEmail(user.Email, valToken)
		if err != nil {
			println("Failed to send verification email:", err.Error())
		}
	}()

	// Generate JWT token for immediate login
	jwtToken, err := utils.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to generate token", fiber.StatusInternalServerError)
	}

	// Response with user data and token
	response := AuthResponse{
		User: UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Verified:  user.Verified,
			Role:      user.Role,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		},
		Token: jwtToken,
	}

	return utils.SuccessResponse(c, response)
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
		return utils.ErrorResponse(c, err.Error(), fiber.StatusBadRequest)
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
			Verified:  user.Verified,
			Role:      user.Role,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		},
		Token: token,
	}

	return utils.SuccessResponse(c, response)
}

// ForgotPassword handler - POST /api/v1/auth/forgot-password
func ForgotPassword(c *fiber.Ctx) error {
	var req ForgotPasswordRequest

	// Parse and validate request
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	if err := utils.ValidateStruct(req); err != nil {
		return utils.ErrorResponse(c, err.Error(), fiber.StatusBadRequest)
	}

	// Find user by email
	var user models.User
	if err := database.DB.Where("email=?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// For security, don't reveal if email exists or not
			return utils.SuccessResponse(c, "If the email exists, a password reset link has been sent")
		}
		return utils.ErrorResponse(c, "Database error", fiber.StatusInternalServerError)
	}

	// Generate reset token
	resetToken, err := services.GenerateVerificationToken()
	if err != nil {
		return utils.ErrorResponse(c, "Failed to generate reset token", fiber.StatusInternalServerError)
	}

	// Save reset token (valid for 1 hour)
	err = services.SavePasswordResetToken(&user, resetToken)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to save reset token", fiber.StatusInternalServerError)
	}

	// Send password reset email
	go func() {
		err := services.SendPasswordResetEmail(user.Email, resetToken)
		if err != nil {
			println("Failed to send password reset email:", err.Error())
		}
	}()

	return utils.SuccessResponse(c, "If the email exists, a password reset link has been sent")
}

// ResetPassword handler - POST /api/v1/auth/reset-password
func ResetPassword(c *fiber.Ctx) error {
	var req ResetPasswordRequest

	// Parse and validate request
	if err := c.BodyParser(&req); err != nil {
		return utils.ErrorResponse(c, "Invalid request body", fiber.StatusBadRequest)
	}

	if err := utils.ValidateStruct(req); err != nil {
		return utils.ErrorResponse(c, err.Error(), fiber.StatusBadRequest)
	}

	// Verify reset token
	user, err := services.VerifyPasswordResetToken(req.Token)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, "Invalid reset token", fiber.StatusBadRequest)
		}
		if err == gorm.ErrInvalidData {
			return utils.ErrorResponse(c, "Reset token has expired", fiber.StatusBadRequest)
		}
		return utils.ErrorResponse(c, "Failed to verify token", fiber.StatusInternalServerError)
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to hash password", fiber.StatusInternalServerError)
	}

	// Update password and clear reset token
	user.Password = hashedPassword
	err = services.ClearPasswordResetToken(user)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to update password", fiber.StatusInternalServerError)
	}

	// Also update the password in database
	if err := database.DB.Model(user).Update("password", hashedPassword).Error; err != nil {
		return utils.ErrorResponse(c, "Failed to update password", fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, "Password reset successfully")
}

func VerifyEmail(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return utils.ErrorResponse(c, "Verification token is required", fiber.StatusBadRequest)
	}

	_, err := services.VerifyToken(token)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return utils.ErrorResponse(c, "Invalid verification token", fiber.StatusBadRequest)
		}
		if err == gorm.ErrInvalidData {
			return utils.ErrorResponse(c, "Verification token has expired", fiber.StatusBadRequest)
		}
		return utils.ErrorResponse(c, "Failed to verify token", fiber.StatusInternalServerError)
	}

	return utils.SuccessResponse(c, "Email verified successfully")
}
