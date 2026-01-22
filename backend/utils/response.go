package utils

import "github.com/gofiber/fiber/v2"

// SuccessResponse sends a standardized success JSON response
func SuccessResponse(c *fiber.Ctx, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

// ErrorResponse sends a standardized error JSON response
func ErrorResponse(c *fiber.Ctx, message string, statusCode int) error {
	return c.Status(statusCode).JSON(fiber.Map{
		"success": false,
		"error":   message,
	})
}

// ValidationErrorResponse for validation errors
func ValidationErrorResponse(c *fiber.Ctx, errors map[string]string) error {
	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		"success": false,
		"errors":  "Validation failed",
		"details": errors,
	})
}
