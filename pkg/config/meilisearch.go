package config

import (
	"log"
	"os"

	"github.com/meilisearch/meilisearch-go"
)

var MeiliClient meilisearch.ServiceManager

func InitMeilisearch() {
	url := os.Getenv("MEILI_URL")
	port := os.Getenv("MEILI_PORT")
	apiKey := os.Getenv("MEILI_MASTER_KEY")

	if url == "" || port == "" || apiKey == "" {
		log.Fatal("Meilisearch configuration is missing. Please set MEILI_URL, MEILI_PORT, and MEILI_MASTER_KEY environment variables.")
	}

	host := url + ":" + port

	MeiliClient = meilisearch.New(host, meilisearch.WithAPIKey(apiKey))

	// Test the connection
	version, err := MeiliClient.Version()
	if err != nil {
		log.Printf("Failed to connect to Meilisearch: %v", err)
	} else {
		log.Printf("Connected to Meilisearch. Version: %s", version)
	}

	// Create indexes
	CreateIndexes()
}

// Creates the necessary indexes in Meilisearch for the application.
func CreateIndexes() {

	// Videos index
	videosIndex := MeiliClient.Index("videos")

	// Searchable fields
	videosIndex.UpdateSearchableAttributes(&[]string{
		"title",
		"description",
		"tags",
		"uploader",
	})

	// Filterable fields
	videosIndex.UpdateFilterableAttributes(&[]interface{}{
		"sport",
		"created_at",
		"views",
	})

	// Sortable fields
	videosIndex.UpdateSortableAttributes(&[]string{
		"created_at",
		"views",
		"likes",
	})

	// News index
	newsIndex := MeiliClient.Index("news")

	// Searchable fields
	newsIndex.UpdateSearchableAttributes(&[]string{
		"title",
		"description",
		"source",
	})

	// Filterable fields
	newsIndex.UpdateFilterableAttributes(&[]interface{}{
		"sport",
		"source",
		"published_at",
	})

	// Sortable fields
	newsIndex.UpdateSortableAttributes(&[]string{
		"published_at",
	})

	// Typo tolerance settings
	typoTolerence := &meilisearch.TypoTolerance{
		Enabled: true,
		MinWordSizeForTypos: meilisearch.MinWordSizeForTypos{
			OneTypo:  4,
			TwoTypos: 8,
		},
	}

	videosIndex.UpdateTypoTolerance(typoTolerence)
	newsIndex.UpdateTypoTolerance(typoTolerence)

	log.Println("✅ Meilisearch indexes with typo tolerance configured")
}
