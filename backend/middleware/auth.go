package middleware

import (
	"log"
	"strings"

	"github.com/alex6damian/GoSport/backend/utils"
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
	log.Printf("   Token: %s...\n", token[:20])

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
