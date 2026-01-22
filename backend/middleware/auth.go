package middleware

import (
	"strings"

	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/gofiber/fiber/v2"
)

func AuthMiddleWare(c *fiber.Ctx) error {
	// Get Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Missing Authorization header",
		})
	}

	// Check format: "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid Authorization header format",
		})
	}

	// Extract token
	token := parts[1]

	// Validate token
	claims, err := utils.ValidateToken(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid or expired token",
		})
	}

	// Store user info in context for handlers
	c.Locals("userID", claims.UserID)
	c.Locals("userEmail", claims.Email)
	c.Locals("userRole", claims.Role)

	// Proceed to next handler
	return c.Next()
}

func RequireRole(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("userRole").(string)

		if userRole != role {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Insufficient permissions",
			})
		}

		// Proceed to next handler
		return c.Next()
	}
}
