package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"unique;not null" json:"username"`
	Email     string         `gorm:"unique;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`              // hashed password, exclude from JSON responses
	Verified  bool           `gorm:"default: false" json:"verified"` // email verified
	Role      string         `gorm:"default: user" json:"role"`      // viewer, creator
	Avatar    string         `json:"avatar"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"` // soft delete

	// Relations
	Videos        []Video        `gorm:"foreignKey:UserID" json:"videos,omitempty"`
	Subscriptions []Subscription `gorm:"foreignKey: SubscriberID" json:"subscriptions,omitempty"`
}
