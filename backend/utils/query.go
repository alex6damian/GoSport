package utils

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// Common query filters
type QueryFilters struct {
	Search string
	SortBy string
	Order  string
}

// Sort direction
type SortOrder string

const (
	SortOrderAsc  SortOrder = "asc"
	SortOrderDesc SortOrder = "desc"
)

// Extracts common query filters from the request
func ParseQueryFilters(c *fiber.Ctx, defaultSortBy string) QueryFilters {
	search := strings.TrimSpace(c.Query("search", ""))
	sortBy := c.Query("sort_by", defaultSortBy)
	order := strings.ToLower(c.Query("order", "desc"))

	// Validate order
	if order != "asc" && order != "desc" {
		order = "desc"
	}

	return QueryFilters{
		Search: search,
		SortBy: sortBy,
		Order:  order,
	}
}

// Checks if sort field is allowed
func ValidateSortField(field string, allowedFields []string) string {
	for _, allowed := range allowedFields {
		if field == allowed {
			return field
		}
	}

	// Return first allowed field as default
	if len(allowedFields) > 0 {
		return allowedFields[0]
	}
	return "created_at"
}

// Builds SQL ORDER BY clause
func BuildOrderClause(sortBy, order string) string {
	return sortBy + " " + strings.ToUpper(order)
}

// Parses boolean query parameter
func ParseBoolQuery(c *fiber.Ctx, key string, defaultValue bool) bool {
	value := c.Query(key)
	if value == "" {
		return defaultValue
	}
	return value == "true" || value == "1"
}

// Parses comma-separated string into query
func ParseStringArray(c *fiber.Ctx, key string) []string {
	value := c.Query(key)
	if value == "" {
		return []string{}
	}

	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))

	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}

	return result
}
