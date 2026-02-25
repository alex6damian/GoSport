package models

import (
	"time"
)

type RSSFeed struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"not null" json:"name"`         // "ESPN Football"
	URL          string    `gorm:"not null;unique" json:"url"`   // Feed URL
	Sport        string    `gorm:"index" json:"sport"`           // football, basketball
	Language     string    `gorm:"default:'en'" json:"language"` // en, ro, etc.
	Active       bool      `gorm:"default:true" json:"active"`
	LastSync     time.Time `json:"last_sync"`
	LastError    string    `gorm:"type:text" json:"last_error,omitempty"`
	ArticleCount int       `gorm:"default:0" json:"article_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
