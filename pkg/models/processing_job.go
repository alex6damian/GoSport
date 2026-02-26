package models

import "time"

type ProcessingJob struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	VideoID   uint      `gorm:"not null;index" json:"video_id"`
	Status    string    `gorm:"default:pending" json:"status"` // pending, processing, completed, failed
	Logs      string    `gorm:"type:text" json:"logs"`         // Processing logs or error messages
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Video Video `gorm:"foreignKey:VideoID" json:"-"`
}
