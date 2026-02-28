package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"github.com/alex6damian/GoSport/backend/middleware"
	"github.com/alex6damian/GoSport/backend/routes"
	"github.com/alex6damian/GoSport/pkg/config"
	"github.com/alex6damian/GoSport/pkg/database"
)

func main() {
	// Initialize Database and run migrations
	database.InitDB()

	// Initialize MinIO client and bucket
	if err := config.InitMinio(); err != nil {
		log.Fatalf("⚠️  WARNING: Failed to initialize MinIO: %v", err)
	}

	// Initialize Meilisearch client and indexes
	config.InitMeilisearch()

	// Fiber setup
	app := fiber.New(fiber.Config{
		AppName:      "GoSport API v1",
		ErrorHandler: middleware.ErrorHandler,
		BodyLimit:    100 * 1024 * 1024, // 100 MB max upload
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
	log.Println("✅ Auth routes registered")

	// User routes
	users := api.Group("/users")                                     // /api/v1/users
	users.Get("/me", middleware.AuthMiddleware, routes.GetMyProfile) // Middleware acts first as authentication gate
	users.Put("/me", middleware.AuthMiddleware, routes.UpdateMyProfile)
	users.Get("/:username", routes.GetUserProfileByUsername)
	users.Get("/:username/videos", routes.GetUserVideos)
	log.Println("✅ User routes registered")

	// Video routes
	videos := api.Group("/videos")
	videos.Post("/upload", middleware.AuthMiddleware, routes.UploadVideo)
	videos.Get("/", routes.ListVideos)
	videos.Get("/:id", routes.GetVideo)
	videos.Put("/:id", middleware.AuthMiddleware, routes.UpdateVideo)
	videos.Delete("/:id", middleware.AuthMiddleware, routes.DeleteVideo)
	log.Println("✅ Video routes registered")

	// News routes
	news := api.Group("/news")
	news.Get("/", routes.GetNews)                    // List all news
	news.Get("/:id", routes.GetNewsArticle)          // Get single article
	news.Get("/sport/:sport", routes.GetNewsBySport) // Filter by sport
	log.Println("✅ News routes registered")

	// Admin routes (logs for debugging and verification)
	adminAuth := api.Group("/admin", middleware.AuthMiddleware, middleware.AdminOnly)
	adminAuth.Post("/feeds", routes.CreateRSSFeed)
	adminAuth.Get("/feeds", routes.GetRSSFeeds)
	adminAuth.Put("/feeds/:id", routes.UpdateRSSFeed)
	adminAuth.Delete("/feeds/:id", routes.DeleteRSSFeed)
	adminAuth.Post("/feeds/:id/sync", routes.SyncRSSFeed)
	adminAuth.Post("/feeds/sync-all", routes.SyncAllFeeds)
	log.Println("✅ Admin routes registered")

	// Meilisearch routes
	search := api.Group("/search")
	search.Get("/videos", routes.SearchVideos)
	search.Get("/news", routes.SearchNews)
	log.Println("✅ Search routes registered")

	// Subscription routes
	users.Post("/:userId/subscribe", middleware.AuthMiddleware, routes.Subscribe)
	users.Delete("/:userId/unsubscribe", middleware.AuthMiddleware, routes.Unsubscribe)
	users.Get("/:userId/subscription", middleware.AuthMiddleware, routes.CheckSubscription)
	users.Get("/subscriptions", middleware.AuthMiddleware, routes.GetSubscriptions)
	users.Get("/:userId/subscribers", middleware.AuthMiddleware, routes.GetSubscribers)
	log.Println("✅ Subscription routes registered")
}
