package models

import (
	"errors"
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
}

func (Subscription) TableName() string {
	return "subscriptions"
}

// Validation hook to ensure a user cannot subscribe to themselves
func (s *Subscription) BeforeCreate(tx *gorm.DB) error {
	if s.SubscriberID == s.CreatorID {
		return errors.New("a user cannot subscribe to themselves")
	}
	return nil
}
