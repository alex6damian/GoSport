package services

import (
	"fmt"

	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"gorm.io/gorm"
)

type SubscriptionService struct {
	DB *gorm.DB
}

func NewSubscriptionService() *SubscriptionService {
	return &SubscriptionService{DB: database.DB}
}

// Subscribe creates a new subscription
func (s *SubscriptionService) Subscribe(subscriberID, creatorID uint) error {
	// Check if already subscribed
	if s.IsSubscribed(subscriberID, creatorID) {
		return fmt.Errorf("already subscribed")
	}

	// Check if creator exists
	var creator models.User
	if err := s.DB.First(&creator, creatorID).Error; err != nil {
		return fmt.Errorf("creator not found")
	}

	// Create subscription
	subscription := models.Subscription{
		SubscriberID: subscriberID,
		CreatorID:    creatorID,
	}

	if err := s.DB.Create(&subscription).Error; err != nil {
		return err
	}

	// Update counts
	s.DB.Model(&models.User{}).Where("id = ?", creatorID).
		UpdateColumn("subscribers_count", gorm.Expr("subscribers_count + 1"))

	return nil
}

// Unsubscribe removes a subscription
func (s *SubscriptionService) Unsubscribe(subscriberID, creatorID uint) error {
	result := s.DB.Where("subscriber_id = ? AND creator_id = ?", subscriberID, creatorID).
		Delete(&models.Subscription{})

	if result.RowsAffected == 0 {
		return fmt.Errorf("not subscribed")
	}

	// Update counts
	s.DB.Model(&models.User{}).Where("id = ?", creatorID).
		UpdateColumn("subscribers_count", gorm.Expr("subscribers_count - 1"))

	return nil
}

// IsSubscribed checks if a subscription exists
func (s *SubscriptionService) IsSubscribed(subscriberID, creatorID uint) bool {
	var count int64
	s.DB.Model(&models.Subscription{}).
		Where("subscriber_id = ? AND creator_id = ?", subscriberID, creatorID).
		Count(&count)
	return count > 0
}

// GetSubscriberCount returns subscriber count for a creator
func (s *SubscriptionService) GetSubscriberCount(creatorID uint) int64 {
	var count int64
	s.DB.Model(&models.Subscription{}).
		Where("creator_id = ?", creatorID).
		Count(&count)
	return count
}

// GetSubscriptions returns all subscriptions for a user
func (s *SubscriptionService) GetSubscriptions(subscriberID uint) ([]models.Subscription, error) {
	var subscriptions []models.Subscription
	err := s.DB.Where("subscriber_id = ?", subscriberID).
		Preload("Creator").
		Order("created_at DESC").
		Find(&subscriptions).Error
	return subscriptions, err
}

// GetSubscribers returns all subscribers for a creator
func (s *SubscriptionService) GetSubscribers(creatorID uint) ([]models.Subscription, error) {
	var subscribers []models.Subscription
	err := s.DB.Where("creator_id = ?", creatorID).
		Preload("Subscriber").
		Order("created_at DESC").
		Find(&subscribers).Error
	return subscribers, err
}
