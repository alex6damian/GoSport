package utils

import (
	"os"
	"time"

	jwt "github.com/golang-jwt/jwt/v4"
)

// Structure for JWT payload
type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Generate JWT token
func GenerateToken(userID uint, email, role string) (string, error) {
	// JWT from environment
	jwtSecret := os.Getenv("JWT_SECRET")

	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 24 hours expiration
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "gosport-api",
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	signedToken, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

func ValidateToken(signedToken string) (*Claims, error) {
	// JWT from environment
	jwtSecret := os.Getenv("JWT_SECRET")

	// Parse token
	token, err := jwt.ParseWithClaims(signedToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Check claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrSignatureInvalid
}
