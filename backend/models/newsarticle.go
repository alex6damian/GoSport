package models

import (
	"time"
)

type NewsArticle struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Content     string    `gorm:"type:text" json:"content"`
	Summary     string    `gorm:"type:text" json:"summary"`
	Sport       string    `gorm:"index" json:"sport"`
	Source      string    `json:"source"` // BBC Sport, ESPN, etc.
	SourceURL   string    `json:"source_url"`
	ImageURL    string    `json:"image_url"`
	Author      string    `json:"author"`
	PublishedAt time.Time `gorm:"index" json:"published_at"`
	CreatedAt   time.Time `json:"created_at"`

	// For Meilisearch
	SearchID string `gorm:"-" json:"search_id"` // not in DB, only for search
}
