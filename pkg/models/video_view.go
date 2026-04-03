package models

import "time"

type VideoView struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	UserID          *uint     `gorm:"index" json:"user_id"` // nullable
	VideoID         uint      `gorm:"not null;index" json:"video_id"`
	WatchedDuration int       `gorm:"default:0" json:"watched_duration"` // seconds
	Completed       bool      `gorm:"default:false" json:"completed"`
	IPAddress       string    `gorm:"size:45" json:"-"`
	UserAgent       string    `json:"-"`
	CreatedAt       time.Time `gorm:"autoCreateTime;index" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	User  *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Video Video `gorm:"foreignKey:VideoID" json:"video,omitempty"`
}

func (VideoView) TableName() string {
	return "video_views"
}
