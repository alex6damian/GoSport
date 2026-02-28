// backend/services/video_interaction_service.go
package services

import (
	"log"
	"time"

	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"gorm.io/gorm"
)

type VideoInteractionService struct {
	DB *gorm.DB
}

func NewVideoInteractionService() *VideoInteractionService {
	if database.DB == nil {
		log.Fatal("❌ Database not initialized")
	}
	return &VideoInteractionService{DB: database.DB}
}

// ToggleLike adds or removes a like
func (s *VideoInteractionService) ToggleLike(userID, videoID uint) (bool, error) {
	var like models.VideoLike

	// Check if already liked
	result := s.DB.Where("user_id = ? AND video_id = ?", userID, videoID).First(&like)

	if result.Error == gorm.ErrRecordNotFound {
		// Add like
		like = models.VideoLike{
			UserID:  userID,
			VideoID: videoID,
		}

		if err := s.DB.Create(&like).Error; err != nil {
			return false, err
		}

		// Increment count
		s.DB.Exec("UPDATE videos SET likes = likes + 1 WHERE id = ?", videoID)

		log.Printf("User %d liked video %d", userID, videoID)
		return true, nil
	}

	// Remove like
	s.DB.Delete(&like)
	s.DB.Exec("UPDATE videos SET likes = GREATEST(likes - 1, 0) WHERE id = ?", videoID)

	log.Printf("User %d unliked video %d", userID, videoID)
	return false, nil
}

// IsLiked checks if user liked video
func (s *VideoInteractionService) IsLiked(userID, videoID uint) bool {
	var count int64
	s.DB.Model(&models.VideoLike{}).
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Count(&count)
	return count > 0
}

// GetVideoLikes returns users who liked video
func (s *VideoInteractionService) GetVideoLikes(videoID uint, limit, offset int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	// Get total
	s.DB.Model(&models.VideoLike{}).Where("video_id = ?", videoID).Count(&total)

	// Get users
	err := s.DB.Table("video_likes").
		Select("users.*").
		Joins("JOIN users ON video_likes.user_id = users.id").
		Where("video_likes.video_id = ?", videoID).
		Limit(limit).
		Offset(offset).
		Scan(&users).Error

	return users, total, err
}

// TrackView records a video view
func (s *VideoInteractionService) TrackView(userID *uint, videoID uint, ipAddress, userAgent string) error {
	// Check if view already exists today
	var existingView models.VideoView
	today := time.Now().Truncate(24 * time.Hour)

	query := s.DB.Where("video_id = ? AND created_at >= ?", videoID, today)
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	} else {
		query = query.Where("ip_address = ?", ipAddress)
	}

	result := query.First(&existingView)

	if result.Error == gorm.ErrRecordNotFound {
		// New view
		view := models.VideoView{
			UserID:    userID,
			VideoID:   videoID,
			IPAddress: ipAddress,
			UserAgent: userAgent,
		}

		if err := s.DB.Create(&view).Error; err != nil {
			return err
		}

		// Increment video view count
		s.DB.Exec("UPDATE videos SET views = views + 1 WHERE id = ?", videoID)

		log.Printf("New view recorded for video %d", videoID)
	} else {
		// Update existing view timestamp
		s.DB.Model(&existingView).Update("updated_at", time.Now())
		log.Printf("View updated for video %d", videoID)
	}

	return nil
}

// UpdateWatchProgress updates watched duration
func (s *VideoInteractionService) UpdateWatchProgress(userID uint, videoID uint, duration int) error {
	var view models.VideoView

	result := s.DB.Where("user_id = ? AND video_id = ?", userID, videoID).
		Order("created_at DESC").
		First(&view)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new view with progress
		view = models.VideoView{
			UserID:          &userID,
			VideoID:         videoID,
			WatchedDuration: duration,
		}
		return s.DB.Create(&view).Error
	}

	// Update existing
	updates := map[string]interface{}{
		"watched_duration": duration,
		"updated_at":       time.Now(),
	}

	// Mark as completed if watched >80%
	var video models.Video
	if err := s.DB.First(&video, videoID).Error; err == nil {
		if duration > int(float64(video.Duration)*0.8) {
			updates["completed"] = true
		}
	}

	return s.DB.Model(&view).Updates(updates).Error
}

// GetWatchHistory returns user's watch history
func (s *VideoInteractionService) GetWatchHistory(userID uint, limit, offset int) ([]models.Video, error) {
	// Get ordered video IDs
	var videoIDs []uint
	err := s.DB.Table("video_views").
		Select("video_id").
		Where("user_id = ?", userID).
		Group("video_id").
		Order("MAX(created_at) DESC").
		Limit(limit).
		Offset(offset).
		Pluck("video_id", &videoIDs).Error

	if err != nil || len(videoIDs) == 0 {
		return []models.Video{}, err
	}

	// Get videos maintaining order
	var videos []models.Video
	err = s.DB.
		Where("id IN ?", videoIDs).
		Preload("User").
		Find(&videos).Error

	if err != nil {
		return []models.Video{}, err
	}

	// Reorder to match watch history order
	videoMap := make(map[uint]models.Video)
	for _, v := range videos {
		videoMap[v.ID] = v
	}

	orderedVideos := make([]models.Video, 0, len(videoIDs))
	for _, id := range videoIDs {
		if video, ok := videoMap[id]; ok {
			orderedVideos = append(orderedVideos, video)
		}
	}

	log.Printf("Returning %d videos", len(orderedVideos))
	return orderedVideos, nil
}

// ToggleFavorite adds or removes from favorites
func (s *VideoInteractionService) ToggleFavorite(userID, videoID uint) (bool, error) {
	var favorite models.Favorite

	result := s.DB.Where("user_id = ? AND video_id = ?", userID, videoID).First(&favorite)

	if result.Error == gorm.ErrRecordNotFound {
		// Add to favorites
		favorite = models.Favorite{
			UserID:  userID,
			VideoID: videoID,
		}

		if err := s.DB.Create(&favorite).Error; err != nil {
			return false, err
		}

		s.DB.Exec("UPDATE videos SET favorites = favorites + 1 WHERE id = ?", videoID)

		log.Printf("User %d favorited video %d", userID, videoID)
		return true, nil
	}

	// Remove from favorites
	s.DB.Delete(&favorite)
	s.DB.Exec("UPDATE videos SET favorites = GREATEST(favorites - 1, 0) WHERE id = ?", videoID)

	log.Printf("User %d unfavorited video %d", userID, videoID)
	return false, nil
}

// IsFavorited checks if video is in user's favorites
func (s *VideoInteractionService) IsFavorited(userID, videoID uint) bool {
	var count int64
	s.DB.Model(&models.Favorite{}).
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Count(&count)
	return count > 0
}

// GetFavorites returns user's favorite videos
func (s *VideoInteractionService) GetFavorites(userID uint, limit, offset int) ([]models.Video, error) {
	// Get ordered video IDs
	var videoIDs []uint
	err := s.DB.Table("favorites").
		Select("video_id").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Pluck("video_id", &videoIDs).Error

	if err != nil || len(videoIDs) == 0 {
		return []models.Video{}, err
	}

	// Get videos maintaining order
	var videos []models.Video
	err = s.DB.
		Where("id IN ?", videoIDs).
		Preload("User").
		Find(&videos).Error

	if err != nil {
		return []models.Video{}, err
	}

	// Reorder to match favorites order
	videoMap := make(map[uint]models.Video)
	for _, v := range videos {
		videoMap[v.ID] = v
	}

	orderedVideos := make([]models.Video, 0, len(videoIDs))
	for _, id := range videoIDs {
		if video, ok := videoMap[id]; ok {
			orderedVideos = append(orderedVideos, video)
		}
	}

	log.Printf("✅ Returning %d videos", len(orderedVideos))
	return orderedVideos, nil
}

// GetVideoStats returns aggregated stats for a video
func (s *VideoInteractionService) GetVideoStats(videoID uint) (map[string]interface{}, error) {
	var video models.Video
	if err := s.DB.First(&video, videoID).Error; err != nil {
		return nil, err
	}

	// Get unique viewers
	var uniqueViewers int64
	s.DB.Model(&models.VideoView{}).
		Where("video_id = ?", videoID).
		Distinct("COALESCE(user_id, ip_address)").
		Count(&uniqueViewers)

	// Get completion rate
	var completedViews int64
	s.DB.Model(&models.VideoView{}).
		Where("video_id = ? AND completed = ?", videoID, true).
		Count(&completedViews)

	completionRate := 0.0
	if uniqueViewers > 0 {
		completionRate = float64(completedViews) / float64(uniqueViewers) * 100
	}

	return map[string]interface{}{
		"likes_count":     video.Likes,
		"views_count":     video.Views,
		"favorites_count": video.Favorites,
		"unique_viewers":  uniqueViewers,
		"completed_views": completedViews,
		"completion_rate": completionRate,
	}, nil
}
