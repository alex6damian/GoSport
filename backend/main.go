package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/alex6damian/GoSport/backend/config"
	"github.com/alex6damian/GoSport/backend/database"
	"github.com/alex6damian/GoSport/backend/middleware"
	"github.com/alex6damian/GoSport/backend/routes"
)

func main() {
	// Initialize Database and run migrations
	database.InitDB()

	// Fiber setup
	app := fiber.New(fiber.Config{
		AppName:      "GoSport API v1",
		ErrorHandler: middleware.ErrorHandler,
	})

	// Recovery middleware to catch panics
	app.Use(recover.New())

	// Request logging
	app.Use(logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${latency} ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Local",
	}))

	// CORS
	app.Use(cors.New(config.CORSConfig()))

	// Global rate limiter (100 req/min)
	app.Use(middleware.RateLimiter())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "ok",
			"database": "connected",
			"service":  "gosport-api",
			"version":  "1.0.0",
		})
	})

	// Setup routes
	setupRoutes(app)

	// 404 Handler
	app.Use(middleware.NotFoundHandler)

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
	auth := api.Group("/auth", middleware.AuthRateLimiter()) // /api/v1/auth
	auth.Post("/register", routes.Register)
	auth.Post("/login", routes.Login)

	// User routes
	users := api.Group("/users") // /api/v1/users
	users.Get("/me", middleware.AuthMiddleWare, routes.GetMyProfile)
	users.Put("/me", middleware.AuthMiddleWare, routes.UpdateMyProfile)
	users.Get("/:username", routes.GetUserProfileByUsername)
	users.Get("/:username/videos", routes.GetUserVideosByUsername)

}
