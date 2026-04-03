package models

import "time"

type VideoLike struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_user_video_like" json:"user_id"`
	VideoID   uint      `gorm:"not null;uniqueIndex:idx_user_video_like" json:"video_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Video Video `gorm:"foreignKey:VideoID" json:"video,omitempty"`
}

func (VideoLike) TableName() string {
	return "video_likes"
}
