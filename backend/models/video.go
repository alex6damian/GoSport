package models

import (
	"time"
)

type Video struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	UserID      uint   `gorm:"not null;index" json:"user_id"` // creator
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"type:text" json:"description"`
	Sport       string `gorm:"index" json:"sport"` // football, basketball, etc.

	// Storage
	MinioKey  string `json:"minio_key"` // videos/uuid.mp4
	HLSPath   string `json:"hls_path"`  // videos/uuid/playlist.m3u8
	Thumbnail string `json:"thumbnail"` // thumbnails/uuid.jpg

	// Metadata
	Duration int    `json:"duration"`                       // seconds
	Status   string `gorm:"default: pending" json:"status"` // pending, processing, ready, failed

	// Stats
	Views int `gorm:"default:0" json:"views"`
	Likes int `gorm:"default:0" json:"likes"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User     User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Comments []Comment `gorm:"foreignKey:VideoID" json:"comments,omitempty"`
}
