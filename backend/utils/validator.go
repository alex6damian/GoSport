package utils

import (
	"fmt"
	"regexp"

	"github.com/go-playground/validator/v10"
)

// Global validator instance
var validate *validator.Validate

// init runs once when package is imported
func init() {
	validate = validator.New()

	// Register custom validators
	validate.RegisterValidation("username_pattern", ValidateUsername)
	validate.RegisterValidation("strong_password", ValidateStrongPassword)
}

// ValidateStruct validates a struct using validator tags
func ValidateStruct(data interface{}) error {
	if err := validate.Struct(data); err != nil {
		if validationErrors, ok := err.(validator.ValidationErrors); ok {
			for _, e := range validationErrors {
				return formatValidationError(e)
			}
		}
		return err
	}
	return nil
}

// formatValidationError converts validator.FieldError to user-friendly message
func formatValidationError(e validator.FieldError) error {
	field := e.Field()

	switch e.Tag() {
	case "required":
		return fmt.Errorf("%s is required", field)
	case "email":
		return fmt.Errorf("%s must be a valid email address", field)
	case "min":
		return fmt.Errorf("%s must be at least %s characters", field, e.Param())
	case "max":
		return fmt.Errorf("%s must be at most %s characters", field, e.Param())
	case "username_pattern":
		return fmt.Errorf("%s must start with a letter and can only contain letters, numbers, underscores and dashes", field)
	case "strong_password":
		return fmt.Errorf("%s must be at least 8 characters with at least one uppercase letter and one number", field)
	case "oneof":
		return fmt.Errorf("%s must be one of: %s", field, e.Param())
	case "url":
		return fmt.Errorf("%s must be a valid URL", field)
	default:
		return fmt.Errorf("%s is invalid", field)
	}
}

// ValidateUsername validates username pattern ("username_pattern" tag)
func ValidateUsername(fl validator.FieldLevel) bool {
	username := fl.Field().String()
	matched, _ := regexp.MatchString(`^[a-zA-Z][a-zA-Z0-9_-]*$`, username)
	return matched
}

// ValidateStrongPassword validates password strength ("strong_password" tag)
func ValidateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	if len(password) < 8 {
		return false
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)

	return hasUpper && hasNumber
}
