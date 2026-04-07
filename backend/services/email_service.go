package services

import (
	"os"
	"strconv"

	"gopkg.in/gomail.v2"
)

// SendVerificationEmail sends an email with the verification link.
func SendVerificationEmail(to, token string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	frontendURL := os.Getenv("FRONTEND_URL")

	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return err
	}

	m := gomail.NewMessage()
	m.SetHeader("From", smtpUser)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Verify your GoSport account")
	verificationLink := frontendURL + "/verify-email?token=" + token
	m.SetBody("text/html", "Please click the following link to verify your account: <a href=\""+verificationLink+"\">"+verificationLink+"</a>")

	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)

	return d.DialAndSend(m)
}

// SendPasswordResetEmail sends an email with the password reset link.
func SendPasswordResetEmail(to, token string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	frontendURL := os.Getenv("FRONTEND_URL")

	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return err
	}

	m := gomail.NewMessage()
	m.SetHeader("From", smtpUser)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Reset your GoSport password")
	resetLink := frontendURL + "/reset-password?token=" + token
	m.SetBody("text/html", "Click the following link to reset your password (valid for 1 hour): <a href=\""+resetLink+"\">"+resetLink+"</a>")

	d := gomail.NewDialer(smtpHost, smtpPort, smtpUser, smtpPass)

	return d.DialAndSend(m)
}
