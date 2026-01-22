package models

import (
	"time"

	"gorm.io/gorm"
)

type Subscription struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SubscriberID uint      `gorm:"not null;index" json:"subscriber_id"` // who subscribes
	CreatorID    uint      `gorm:"not null;index" json:"creator_id"`    // to whom
	CreatedAt    time.Time `json:"created_at"`

	// Relations
	Subscriber User `gorm:"foreignKey:SubscriberID" json:"subscriber,omitempty"`
	Creator    User `gorm:"foreignKey:CreatorID" json:"creator,omitempty"`

	// Unique constraint: a user can subscribe to a creator only once
	gorm.Model `gorm:"uniqueIndex: idx_subscriber_creator,composite:subscriber_id,creator_id"`
}
