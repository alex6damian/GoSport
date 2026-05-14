package middleware

import (
	"log"
	"strings"

	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware validates JWT token and sets user context
func AuthMiddleware(c *fiber.Ctx) error {
	log.Printf("🔍 AuthMiddleware START - Method: %s, Path: %s\n", c.Method(), c.Path())

	authHeader := c.Get("Authorization")
	if authHeader == "" {
		log.Println("   ❌ Missing auth header")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Missing Authorization header",
		})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		log.Printf("   ❌ Invalid format")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid Authorization header format",
		})
	}

	token := parts[1]
	tokenPreview := token
	if len(token) > 20 {
		tokenPreview = token[:20] + "..."
	}
	log.Printf("   Token: %s\n", tokenPreview)

	claims, err := utils.ValidateToken(token)
	if err != nil {
		log.Printf("   ❌ Token validation failed: %v\n", err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid or expired token",
		})
	}

	log.Printf("   ✅ Token valid - UserID: %d, Role: %s\n", claims.UserID, claims.Role)

	c.Locals("userID", claims.UserID)
	c.Locals("userEmail", claims.Email)
	c.Locals("userRole", claims.Role)

	log.Printf("   ✅ Context set\n")
	return c.Next()
}

// OptionalAuthMiddleware reads the JWT token if present but never blocks the request.
// Sets userID/userEmail/userRole in locals only when the token is valid.
func OptionalAuthMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Next()
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Next()
	}

	claims, err := utils.ValidateToken(parts[1])
	if err != nil {
		return c.Next()
	}

	c.Locals("userID", claims.UserID)
	c.Locals("userEmail", claims.Email)
	c.Locals("userRole", claims.Role)

	return c.Next()
}

// AdminOnly checks if user has admin role
func AdminOnly(c *fiber.Ctx) error {
	log.Printf("🔍 AdminOnly START - Method: %s, Path: %s\n", c.Method(), c.Path())

	userRole := c.Locals("userRole")
	log.Printf("   userRole: %v\n", userRole)

	if userRole == nil {
		log.Println("   ❌ userRole is nil")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "User not authenticated",
		})
	}

	role, ok := userRole.(string)
	if !ok {
		log.Printf("   ❌ Invalid type: %T\n", userRole)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid role data type",
		})
	}

	if role != "admin" {
		log.Printf("   ❌ Not admin: %s\n", role)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "Admin access required",
		})
	}

	log.Println("   ✅ Admin verified")
	return c.Next()
}

// IsVerified checks if the user's email is verified.
// This middleware should be used AFTER AuthMiddleware.
func IsVerified(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(uint)
	if !ok {
		// This should not happen if AuthMiddleware is used before this
		return utils.ErrorResponse(c, "User ID not found in context", fiber.StatusInternalServerError)
	}

	// Fetch user from database to check the 'verified' status
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return utils.ErrorResponse(c, "User not found", fiber.StatusNotFound)
	}

	if !user.Verified {
		return utils.ErrorResponse(c, "Email not verified. Please check your email to verify your account.", fiber.StatusForbidden)
	}

	return c.Next()
}
