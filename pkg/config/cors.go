// CORS = Cross-Origin Resource Sharing

package config

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2/middleware/cors"
)

// Enhanced CORS configuration
func CORSConfig() cors.Config {
	// Get allowed origins from environment or use defaults
	allowedOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
	}

	return cors.Config{
		AllowOrigins: allowedOrigins, // Origins allowed to access the API
		AllowMethods: strings.Join([]string{ // HTTP methods allowed
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"PATCH",
			"OPTIONS",
		}, ","),
		AllowHeaders: strings.Join([]string{ // Headers allowed in requests
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
		}, ","),
		AllowCredentials: true, // Allow cookies and credentials
		ExposeHeaders: strings.Join([]string{ // Headers exposed to the client
			"Content-Length",
			"Content-Type",
		}, ","),
		MaxAge: 3600, // 1 hour
	}
}
