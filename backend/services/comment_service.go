package services

import (
	"errors"
	"log"
	"strings"
	"time"

	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"gorm.io/gorm"
)

var (
	ErrInvalidContent        = errors.New("invalid content")
	ErrVideoNotFound         = errors.New("video not found")
	ErrParentCommentNotFound = errors.New("parent comment not found")
	ErrParentNotRoot         = errors.New("parent comment is not a root comment")
	ErrParentDifferentVideo  = errors.New("parent comment belongs to a different video")
	ErrParentDeleted         = errors.New("cannot reply to a deleted comment")
)

type CommentService struct {
	DB *gorm.DB
}

func NewCommentService() *CommentService {
	if database.DB == nil {
		log.Fatal("❌ Database not initialized")
	}
	return &CommentService{DB: database.DB}
}

// Add comment
func (s *CommentService) AddComment(userID, videoID uint, parentCommentID *uint, content string) (*models.Comment, error) {
	var comment models.Comment
	var video models.Video
	content = strings.TrimSpace(content)

	if err := s.DB.First(&video, videoID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		// If reply: validate parent
		if parentCommentID != nil {
			var parent models.Comment
			// Unscoped to find deleted ones too
			if err := tx.Unscoped().First(&parent, *parentCommentID).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return ErrParentCommentNotFound
				}
				return err
			}

			// Reply only to root
			if parent.ParentCommentID != nil {
				return ErrParentNotRoot
			}
			if parent.VideoID != videoID {
				return ErrParentDifferentVideo
			}
			// Do not allow replies on deleted ones
			if parent.DeletedAt.Valid {
				return ErrParentDeleted
			}

			// Increment replies_count
			if err := tx.Model(&models.Comment{}).
				Where("id = ?", parent.ID).
				UpdateColumn("replies_count", gorm.Expr("replies_count + 1")).
				Error; err != nil {
				return err
			}
		}

		comment = models.Comment{
			UserID:          userID,
			VideoID:         videoID,
			ParentCommentID: parentCommentID,
			Content:         content,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		if err := tx.Create(&comment).Error; err != nil {
			return err
		}

		// Load author for response
		if err := tx.Preload("User").First(&comment, comment.ID).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &comment, nil
}

// Edit comment
func (s *CommentService) EditComment(userID, commentID uint, newContent string) (*models.Comment, error) {
	newContent = strings.TrimSpace(newContent)

	// Only available comments(without deleted)
	var comment models.Comment
	if err := s.DB.First(&comment, commentID).Error; err != nil {
		return nil, err
	}

	// Check if user owns the comment
	if comment.UserID != userID {
		return nil, errors.New("Comment ownership error")
	}

	// Update comment
	if err := s.DB.Model(&models.Comment{}).
		Where("id = ?", commentID).
		Updates(map[string]any{"content": newContent}).Error; err != nil {
		return nil, err
	}

	// Reload for response
	if err := s.DB.Preload("User").First(&comment, commentID).Error; err != nil {
		return nil, err
	}

	return &comment, nil
}

func (s *CommentService) DeleteComment(userID, commentID uint) error {
	var comment models.Comment
	if err := s.DB.First(&comment, commentID).Error; err != nil {
		return gorm.ErrRecordNotFound // 404
	}

	// Allow comment owner OR video owner to delete
	if comment.UserID != userID {
		var video models.Video
		if err := s.DB.Select("user_id").First(&video, comment.VideoID).Error; err != nil || video.UserID != userID {
			return errors.New("Forbidden access")
		}
	}

	// transaction: set content, soft delete, and decrement parent replies_count
	return s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Comment{}).
			Where("id=?", commentID).
			Update("content", "[deleted]").Error; err != nil {
			return err
		}

		if err := tx.Delete(&models.Comment{}, commentID).Error; err != nil {
			return err
		}

		// Decrement replies_count on parent if this is a reply
		if comment.ParentCommentID != nil {
			tx.Model(&models.Comment{}).
				Where("id = ?", *comment.ParentCommentID).
				UpdateColumn("replies_count", gorm.Expr("GREATEST(replies_count - 1, 0)"))
		}

		return nil
	})
}

func (s *CommentService) ListVideoComments(videoID uint, page, limit int) ([]models.Comment, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// Ensure video exists (so empty list vs 404 is explicit)
	var video models.Video
	if err := s.DB.First(&video, videoID).Error; err != nil {
		return nil, 0, err
	}

	q := s.DB.Model(&models.Comment{}).
		Where("video_id = ? AND parent_comment_id IS NULL", videoID)

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var comments []models.Comment
	if err := q.
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset((page - 1) * limit).
		Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (s *CommentService) ListCommentReplies(commentID uint, page, limit int) ([]models.Comment, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// ensure parent exists + enforce "reply only to root" contract
	var parent models.Comment
	if err := s.DB.First(&parent, commentID).Error; err != nil {
		return nil, 0, err
	}
	if parent.ParentCommentID != nil {
		// parent is itself a reply
		return nil, 0, ErrParentNotRoot
	}

	q := s.DB.Model(&models.Comment{}).
		Where("parent_comment_id = ?", commentID)

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var replies []models.Comment
	if err := q.
		Preload("User").
		Order("created_at ASC").
		Limit(limit).
		Offset((page - 1) * limit).
		Find(&replies).Error; err != nil {
		return nil, 0, err
	}

	return replies, total, nil
}
