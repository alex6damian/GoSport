package models

import (
	"time"
)

type Comment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	VideoID   uint      `gorm:"not null;index" json:"video_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Video Video `gorm:"foreignKey:VideoID" json:"video,omitempty"`
}
