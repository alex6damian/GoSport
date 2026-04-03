package models

import (
	"time"

	"gorm.io/gorm"
)

type Comment struct {
	ID              uint  `gorm:"primaryKey" json:"id"`
	UserID          uint  `gorm:"not null;index" json:"user_id"`
	VideoID         uint  `gorm:"not null;index" json:"video_id"`
	ParentCommentID *uint `gorm:"index" json:"parent_comment_id,omitempty"`

	Content      string `gorm:"type:text;not null" json:"content"`
	RepliesCount uint   `gorm:"default:0" json:"replies_count"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	User    User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Video   Video     `gorm:"foreignKey:VideoID" json:"-"`
	Replies []Comment `gorm:"foreignKey:ParentCommentID" json:"-"`
}
