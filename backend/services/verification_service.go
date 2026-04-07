package services

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"gorm.io/gorm"
)

// GenerateVerificationToken creates a new random token for email verification.
func GenerateVerificationToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// SaveVerificationToken saves the token and its expiration date to the user.
func SaveVerificationToken(user *models.User, token string) error {
	db := database.DB
	user.VerificationToken = token
	user.VerificationTokenExpiresAt = time.Now().Add(24 * time.Hour) // Token valid for 24 hours
	return db.Save(user).Error
}

// VerifyToken checks if the token is valid and not expired.
func VerifyToken(token string) (*models.User, error) {
	db := database.DB
	var user models.User
	if err := db.Where("verification_token = ?", token).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}

	if time.Now().After(user.VerificationTokenExpiresAt) {
		return nil, gorm.ErrInvalidData // Or a custom error for expired token
	}

	user.Verified = true
	user.VerificationToken = "" // Clear the token after verification
	if err := db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// SavePasswordResetToken saves the reset token and its expiration date to the user.
func SavePasswordResetToken(user *models.User, token string) error {
	db := database.DB
	user.ResetToken = token
	user.ResetTokenExpiresAt = time.Now().Add(1 * time.Hour) // Token valid for 1 hour
	return db.Save(user).Error
}

// VerifyPasswordResetToken checks if the reset token is valid and not expired.
func VerifyPasswordResetToken(token string) (*models.User, error) {
	db := database.DB
	var user models.User
	if err := db.Where("reset_token = ?", token).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}

	if time.Now().After(user.ResetTokenExpiresAt) {
		return nil, gorm.ErrInvalidData // Token expired
	}

	return &user, nil
}

// ClearPasswordResetToken clears the reset token after password has been updated.
func ClearPasswordResetToken(user *models.User) error {
	db := database.DB
	user.ResetToken = ""
	user.ResetTokenExpiresAt = time.Time{}
	return db.Save(user).Error
}
