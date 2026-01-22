package main

import (
	"log"

	"github.com/alex6damian/GoSport/backend/database"
	"github.com/gofiber/fiber/v2"
)

func main() {
	// Initialize Database and run migrations
	database.InitDB()

	// Fiber setup
	app := fiber.New()

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "ok",
			"database": "connected",
		})
	})

	log.Println("🚀 Server started on :8080")
	log.Fatal(app.Listen(":8080"))
}
