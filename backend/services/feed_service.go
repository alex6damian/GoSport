package services

import (
	"log"
	"time"

	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
)

func GetFeed(pagination utils.PaginationParams) ([]models.Video, int64, error) {
	var videos []models.Video
	var total int64

	db := database.DB

	// Get total count
	if err := db.Model(&models.Video{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated videos
	if err := db.Order("created_at desc").Offset(pagination.Offset).Limit(pagination.Limit).Find(&videos).Error; err != nil {
		return nil, 0, err
	}

	// Replace MinIO thumbnail keys with presigned URLs
	for i := range videos {
		if videos[i].Thumbnail != "" {
			url, err := GetVideoURL(videos[i].Thumbnail, 1*time.Hour)
			if err != nil {
				log.Printf("Failed to generate thumbnail URL for video %d: %v", videos[i].ID, err)
				videos[i].Thumbnail = ""
			} else {
				videos[i].Thumbnail = url
			}
		}
	}

	return videos, total, nil
}
