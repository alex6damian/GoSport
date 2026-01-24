package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// Rate limiter middleware (protects API from spam and abuse)
func RateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,             // Maximum number of requests
		Expiration: 1 * time.Minute, // Per time window
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use client IP as the key to identify the requests
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Rate limit exceeded. Please try again later.",
			})
		},
		SkipFailedRequests:     false,
		SkipSuccessfulRequests: false,
		Storage:                nil, // Uses in-memory storage by default
	})
}

// Rate limiter for auth endpoints (preventing brute-force attacks)
func AuthRateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        5,               // Only 5 attempts
		Expiration: 5 * time.Minute, // Per 5 minutes
		KeyGenerator: func(c *fiber.Ctx) string {
			// Use client IP as the key to identify the requests
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Too many login attempts. Please try again in 5 minutes.",
			})
		},
	})
}
