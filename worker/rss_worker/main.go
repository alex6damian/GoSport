package main

import (
	"log"
	"os"

	"github.com/robfig/cron/v3"

	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/pkg/database"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Connect to the database (migrations should already be done by the API service)
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	database.DB = db // Set global DB variable

	// Initialize RSS service
	rssService := services.NewRSSService(database.DB)

	// Run initial sync on startup
	log.Println("📰 Running initial RSS sync...")
	if err := rssService.SyncAllFeeds(); err != nil {
		log.Printf("⚠️  Initial sync failed: %v", err)
	} else {
		log.Println("✅ Initial sync completed")
	}

	// Create cron scheduler
	c := cron.New(cron.WithLogger(cron.VerbosePrintfLogger(log.New(os.Stdout, "CRON: ", log.LstdFlags))))

	// Sync every 30 minutes
	_, err = c.AddFunc("*/30 * * * *", func() {
		log.Println("⏰ Starting scheduled RSS sync...")
		if err := rssService.SyncAllFeeds(); err != nil {
			log.Printf("❌ RSS sync error: %v", err)
		} else {
			log.Println("✅ Scheduled sync completed")
		}
	})
	if err != nil {
		log.Fatal("❌ Failed to add cron job:", err)
	}

	log.Println("⏰ RSS Worker ready - syncing every 30 minutes")
	c.Start()

	// Keep running
	select {}
}
