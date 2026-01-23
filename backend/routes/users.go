package routes

// Profile update structure
type UpdateProfileRequest struct {
	Username string `json:"username" validate:"omitempty,alphanum,min=3,max=30"`
	Email    string `json:"email" validate:"omitempty,email"`
	Avatar   string `json:"avatar" validate:"omitempty,url"`
}
