package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"github.com/alex6damian/GoSport/backend/database"
	"github.com/alex6damian/GoSport/backend/middleware"
	"github.com/alex6damian/GoSport/backend/routes"
)

func main() {
	// Initialize Database and run migrations
	database.InitDB()

	// Fiber setup
	app := fiber.New(fiber.Config{
		AppName: "GoSport API v1",
	})

	// Global middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Domain in the future
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "ok",
			"database": "connected",
		})
	})

	// Setup routes
	setupRoutes(app)

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8080"
		fmt.Println("BACKEND_PORT not set, defaulting to 8080")
	}

	// Start server
	log.Println("🚀 Server started on :" + port)
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	// API group
	api := app.Group("/api/v1")

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", routes.Register)
	auth.Post("/login", routes.Login)

	// Protected route example
	api.Get("/profile", middleware.AuthMiddleWare, func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(uint)
		userEmail := c.Locals("userEmail").(string)

		return c.JSON(fiber.Map{
			"user_id":    userID,
			"user_email": userEmail,
		})
	})

	// Creator-only route example
	api.Post("/videos/upload",
		middleware.AuthMiddleWare, middleware.RequireRole("creator"),
		func(c *fiber.Ctx) error {
			return c.SendString("Upload video (creator only)")
		},
	)
}
