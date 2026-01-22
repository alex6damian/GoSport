package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/alex6damian/GoSport/backend/models"
)

var DB *gorm.DB

func InitDB() {
	DATABASE_URL := os.Getenv("DATABASE_URL")
	if DATABASE_URL == "" {
		log.Fatal("DATABASE_URL not set in environment")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(DATABASE_URL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Connected to PostgreSQL")

	// Run migrations
	RunMigrations()
}

func RunMigrations() {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Video{},
		&models.NewsArticle{},
		&models.Subscription{},
		&models.Comment{},
	)

	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Migrations completed successfully")
}
