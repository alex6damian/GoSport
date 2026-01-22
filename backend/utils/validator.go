package utils

import (
	"regexp"

	validator "github.com/go-playground/validator/v10"
)

// Custom validation function to check for alphanumeric strings
var validate = validator.New()

// ValidateStruct validates a struct
func ValidateStruct(data interface{}) error {
	return validate.Struct(data)
}

// IsValidEmail checks if the provided email is valid
func IsValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// Min 8 characters, one upper and a digit
func IsStrongPassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)

	return hasUpper && hasNumber
}
