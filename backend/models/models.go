package models

import (
	"time"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"unique;not null" json:"email"`
	Username  string    `gorm:"unique;not null" json:"username"`
	Password  string    `gorm:"not null" json: "-"`
	Role      string    `gorm:"default:viewer" json:"role"` // viewer, creator
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Video struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"` // pending, processing, ready
	MinioKey    string    `json:"minio_key"`
	HLSPath     string    `json:"hls_path"`
	Thumbnail   string    `json:"thumbnail"`
	Duration    int       `json:"duration"`
	Likes       int       `json:"likes"`
	CreatedAt   time.Time `json:"created_at"`
	User        User      `gorm:"foreignKey:UserID"`
}

type NewsArticle struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Source      string    `json:"source"`
	ImageURL    string    `json:"image_url"`
	Sport       string    `json:"sport"` // football, basketball, etc.
	PublishedAt time.Time `json:"published_at"`
}
