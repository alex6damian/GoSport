package models

import "time"

type Favorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_user_video_favorite" json:"user_id"`
	VideoID   uint      `gorm:"not null;uniqueIndex:idx_user_video_favorite" json:"video_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	User  User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Video Video `gorm:"foreignKey:VideoID" json:"video,omitempty"`
}

func (Favorite) TableName() string {
	return "favorites"
}
