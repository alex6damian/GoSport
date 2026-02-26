package config

import (
	"log"
	"os"

	"github.com/meilisearch/meilisearch-go"
)

var MeiliClient *meilisearch.Client

func InitMeilisearch() {
	url := os.Getenv("MEILI_URL")
	port := os.Getenv("MEILI_PORT")
	apiKey := os.Getenv("MEILI_MASTER_KEY")

	if url == "" || port == "" || apiKey == "" {
		log.Fatal("Meilisearch configuration is missing. Please set MEILI_URL, MEILI_PORT, and MEILI_MASTER_KEY environment variables.")
	}

	MeiliClient = meilisearch.NewClient(meilisearch.ClientConfig{
		Host:   url + ":" + port,
		APIKey: apiKey,
	})

	// Test the connection
	version, err := MeiliClient.GetVersion()
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
	MeiliClient.CreateIndex(&meilisearch.IndexConfig{
		Uid:        "videos",
		PrimaryKey: "id",
	})

	// Searchable fields
	MeiliClient.Index("videos").UpdateSearchableAttributes(&[]string{
		"title",
		"description",
		"tags",
		"uploader",
	})

	// Filterable fields
	MeiliClient.Index("videos").UpdateFilterableAttributes(&[]string{
		"sport",
		"duration",
		"views",
	})

	// Sortable fields
	MeiliClient.Index("videos").UpdateSortableAttributes(&[]string{
		"created_at",
		"views",
		"likes",
	})

	// News index
	MeiliClient.CreateIndex(&meilisearch.IndexConfig{
		Uid:        "news",
		PrimaryKey: "id",
	})

	// Searchable fields
	MeiliClient.Index("news").UpdateSearchableAttributes(&[]string{
		"title",
		"description",
		"source",
	})

	// Filterable fields
	MeiliClient.Index("news").UpdateFilterableAttributes(&[]string{
		"sport",
		"source",
		"published_at",
	})

	// Sortable fields
	MeiliClient.Index("news").UpdateSortableAttributes(&[]string{
		"published_at",
	})

	log.Println("✅ Meilisearch indexes configured")
}
