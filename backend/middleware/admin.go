package middleware

import (
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/gofiber/fiber/v2"
)

// AdminOnly middleware checks if user has admin role
func AdminOnly(c *fiber.Ctx) error {
	role := c.Locals("role").(string)

	if role != "admin" {
		return utils.ErrorResponse(c, "Admin access required", fiber.StatusForbidden)
	}

	return c.Next()
}
