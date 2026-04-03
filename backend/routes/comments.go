package routes

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/alex6damian/GoSport/pkg/models"
)

var ErrParentNotRoot = errors.New("parent comment is not a root comment")

func getCommentService() *services.CommentService {
	return services.NewCommentService()
}

type createCommentRequest struct {
	Content         string `json:"content" validate:"required,min=1"`
	ParentCommentID *uint  `json:"parent_comment_id"`
}

func AddComment(c *fiber.Ctx) error {
	// video id from path
	videoID64, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || videoID64 == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid video id",
		})
	}
	videoID := uint(videoID64)

	// user id from auth
	userIDAny := c.Locals("userID")
	userID, ok := userIDAny.(uint)
	if !ok || userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}

	// parse and validate
	var req createCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid request body",
		})
	}

	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Bad structure",
		})
	}

	service := getCommentService()

	comment, err := service.AddComment(userID, videoID, req.ParentCommentID, req.Content)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "not found",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    comment,
	})
}

type createReplyRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

func AddReply(c *fiber.Ctx) error {
	// parent comment id from path
	parentID64, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || parentID64 == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid comment id",
		})
	}
	parentID := uint(parentID64)

	// user id from auth
	userIDAny := c.Locals("userID")
	userID, ok := userIDAny.(uint)
	if !ok || userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}

	var req createReplyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid request body",
		})
	}
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "content is required",
		})
	}

	service := getCommentService()

	// load parent to get videoID
	var parent models.Comment
	if err := service.DB.First(&parent, parentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "not found",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	// enforce "reply only to root" early
	if parent.ParentCommentID != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "can only reply to a root comment",
		})
	}

	comment, err := service.AddComment(userID, parent.VideoID, &parentID, req.Content)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    comment,
	})
}

type updateCommentRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

func UpdateComment(c *fiber.Ctx) error {
	commentID64, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || commentID64 == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid comment id",
		})
	}
	commentID := uint(commentID64)

	userIDAny := c.Locals("userID")
	userID, ok := userIDAny.(uint)
	if !ok || userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}

	// parse and validate
	var req updateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid request body",
		})
	}

	if err := utils.ValidateStruct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Bad structure",
		})
	}
	service := getCommentService()
	updated, err := service.EditComment(userID, commentID, req.Content)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "comment not found",
			})
		}
		if err.Error() == "forbidden" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "forbidden",
			})
		}

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    updated,
	})
}

func DeleteComment(c *fiber.Ctx) error {
	commentID64, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || commentID64 == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid comment id",
		})
	}
	commentID := uint(commentID64)

	userIDAny := c.Locals("userID")
	userID, ok := userIDAny.(uint)
	if !ok || userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "unauthorized",
		})
	}

	service := getCommentService()
	if err := service.DeleteComment(userID, commentID); err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "comment not found",
			})
		}
		if err.Error() == "forbidden" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"message": "forbidden",
			})
		}

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "comment deleted",
	})
}

func ListVideoComments(c *fiber.Ctx) error {
	videoID64, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || videoID64 == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid video id",
		})
	}
	videoID := uint(videoID64)

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)

	service := getCommentService()
	comments, total, err := service.ListVideoComments(videoID, page, limit)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "not found",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"items": comments,
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func ListCommentReplies(c *fiber.Ctx) error {
	commentID64, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || commentID64 == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "invalid comment id",
		})
	}
	commentID := uint(commentID64)

	page := c.QueryInt("page", 1)
	limit := c.QueryInt("limit", 20)

	service := getCommentService()
	replies, total, err := service.ListCommentReplies(commentID, page, limit)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "not found",
			})
		}
		// if you return ErrParentNotRoot for replies
		if errors.Is(err, ErrParentNotRoot) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"message": "can only list replies for a root comment",
			})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"items": replies,
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}
