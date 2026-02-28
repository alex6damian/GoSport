package routes

import (
	"github.com/alex6damian/GoSport/backend/services"
	"github.com/alex6damian/GoSport/backend/utils"
	"github.com/gofiber/fiber/v2"
)

var subService = services.NewSubscriptionService()

// POST /api/v1/users/:userId/subscribe - Subscribes the authenticated user to the specified creator
func Subscribe(c *fiber.Ctx) error {
	subscriberID := c.Locals("userID").(uint)
	creatorID, err := c.ParamsInt("userId")

	if err != nil || creatorID <= 0 {
		return utils.ErrorResponse(c, "Invalid user ID", fiber.StatusBadRequest)
	}

	if uint(creatorID) == subscriberID {
		return utils.ErrorResponse(c, "Cannot subscribe to yourself", fiber.StatusBadRequest)
	}

	err = subService.Subscribe(subscriberID, uint(creatorID))
	if err != nil {
		return utils.ErrorResponse(c, err.Error(), fiber.StatusBadRequest)
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Subscribed successfully",
	})
}

// DELETE /api/v1/users/:userId/unsubscribe - Unsubscribes the authenticated user from the specified creator
func Unsubscribe(c *fiber.Ctx) error {
	subscriberID := c.Locals("userID").(uint)
	creatorID, err := c.ParamsInt("userId")

	if err != nil {
		return utils.ErrorResponse(c, "Invalid user ID", fiber.StatusBadRequest)
	}

	err = subService.Unsubscribe(subscriberID, uint(creatorID))
	if err != nil {
		return utils.ErrorResponse(c, err.Error(), fiber.StatusNotFound)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Unsubscribed successfully",
	})
}

// GET /api/v1/users/:userId/subscription - Checks if the authenticated user is subscribed to the specified creator
func CheckSubscription(c *fiber.Ctx) error {
	subscriberID := c.Locals("userID").(uint)
	creatorID, _ := c.ParamsInt("userId")

	isSubscribed := subService.IsSubscribed(subscriberID, uint(creatorID))

	return c.JSON(fiber.Map{
		"success":       true,
		"is_subscribed": isSubscribed,
	})
}

// GET /api/v1/users/subscriptions - Retrieves a list of creators the authenticated user is subscribed to
func GetSubscriptions(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	subscriptions, err := subService.GetSubscriptions(userID)
	if err != nil {
		return utils.ErrorResponse(c, "Failed to fetch subscriptions", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    subscriptions,
	})
}

// GET /api/v1/users/:userId/subscribers - Retrieves a list of subscribers for the specified creator
func GetSubscribers(c *fiber.Ctx) error {
	creatorID, err := c.ParamsInt("userId")
	if err != nil {
		return utils.ErrorResponse(c, "Invalid user ID", fiber.StatusBadRequest)
	}

	subscribers, err := subService.GetSubscribers(uint(creatorID))
	if err != nil {
		return utils.ErrorResponse(c, "Failed to fetch subscribers", fiber.StatusInternalServerError)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    subscribers,
	})
}
