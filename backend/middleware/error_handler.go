package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// ErrorHandler is a custom error handling middleware for Fiber
func ErrorHandler(c *fiber.Ctx, err error) error {
	// Default to 500 Internal Server Error
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	// Check if it's a Fiber error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	// Log the error
	log.Printf("[ERROR] %s %s - Status: %d - Error: %v",
		c.Method(),
		c.Path(),
		code,
		err,
	)

	// Send JSON response
	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error":   message,
	})
}

// NotFoundHandler handles 404 errors
func NotFoundHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"success": false,
		"error":   "Route not found",
		"path":    c.Path(),
	})
}
