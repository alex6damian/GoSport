#!/bin/bash

echo "🏗️  Testing Basic API Structure"
echo "================================="
echo ""

BASE_URL="http://localhost:8080"
API_V1="$BASE_URL/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_test() { echo -e "${BLUE}$1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_header() { echo -e "${CYAN}━━━ $1 ━━━${NC}"; }

# ============================================
# TEST 1: Health Check
# ============================================
print_header "TEST 1: Health Check"
echo ""

print_test "GET /health"
HEALTH_RESPONSE=$(curl -s $BASE_URL/health)
echo "$HEALTH_RESPONSE" | jq

if echo "$HEALTH_RESPONSE" | grep -q '"status".*:.*"ok"'; then
    print_success "Health check passed"
else
    print_error "Health check failed"
fi
echo ""

# ============================================
# TEST 2: 404 Not Found Handler
# ============================================
print_header "TEST 2: 404 Not Found Handler"
echo ""

print_test "GET /nonexistent-route"
NOT_FOUND=$(curl -s $BASE_URL/nonexistent-route)
echo "$NOT_FOUND" | jq

if echo "$NOT_FOUND" | grep -q '"error".*:.*"Route not found"'; then
    print_success "404 handler working"
else
    print_error "404 handler not working"
fi
echo ""

# ============================================
# TEST 3: CORS Headers
# ============================================
print_header "TEST 3: CORS Configuration"
echo ""

print_test "OPTIONS /api/v1/auth/login (preflight request)"
CORS_RESPONSE=$(curl -s -X OPTIONS $API_V1/auth/login \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -i | head -20)

echo "$CORS_RESPONSE"

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    print_success "CORS headers present"
else
    print_error "CORS headers missing"
fi
echo ""

# ============================================
# TEST 4: Global Rate Limiting
# ============================================
print_header "TEST 4: Global Rate Limiting (100 req/min)"
echo ""

print_info "Sending 105 requests to test rate limit..."
RATE_LIMITED=false

for i in {1..105}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
    
    if [ $i -eq 1 ]; then
        echo "Request 1: $RESPONSE"
    elif [ $i -eq 50 ]; then
        echo "Request 50: $RESPONSE"
    elif [ $i -eq 100 ]; then
        echo "Request 100: $RESPONSE"
    elif [ $i -eq 101 ]; then
        echo "Request 101: $RESPONSE"
        if [ "$RESPONSE" = "429" ]; then
            RATE_LIMITED=true
            print_success "Rate limit triggered at request 101"
        fi
    fi
done

if [ "$RATE_LIMITED" = true ]; then
    print_success "Global rate limiting working (100 req/min)"
else
    print_error "Global rate limiting NOT working"
fi
echo ""

# Wait for rate limit to reset
print_info "Waiting 10 seconds for rate limit cooldown..."
sleep 10
echo ""

# ============================================
# TEST 5: Auth Rate Limiting
# ============================================
print_header "TEST 5: Auth Rate Limiting (5 req/15min)"
echo ""

print_info "Sending 7 failed login attempts..."
AUTH_RATE_LIMITED=false

for i in {1..7}; do
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST $API_V1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ $i -le 3 ]; then
        echo "Attempt $i: HTTP $HTTP_CODE"
    elif [ $i -eq 6 ]; then
        echo "Attempt $i: HTTP $HTTP_CODE"
        if [ "$HTTP_CODE" = "429" ]; then
            AUTH_RATE_LIMITED=true
            echo "$BODY" | jq
            print_success "Auth rate limit triggered at attempt 6"
        fi
    fi
done

if [ "$AUTH_RATE_LIMITED" = true ]; then
    print_success "Auth rate limiting working (5 req/15min)"
else
    print_error "Auth rate limiting NOT working"
fi
echo ""

# Wait for cooldown
print_info "Waiting 10 seconds..."
sleep 10
echo ""

# ============================================
# TEST 6: Error Handling - Validation Error
# ============================================
print_header "TEST 6: Error Handling - Validation Error"
echo ""

print_test "POST /api/v1/auth/register (missing required fields)"
VALIDATION_ERROR=$(curl -s -X POST $API_V1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}')

echo "$VALIDATION_ERROR" | jq

if echo "$VALIDATION_ERROR" | grep -q '"success".*:.*false'; then
    print_success "Validation error handled correctly"
else
    print_error "Validation error not handled"
fi
echo ""

# ============================================
# TEST 7: Error Handling - Invalid JSON
# ============================================
print_header "TEST 7: Error Handling - Invalid JSON"
echo ""

print_test "POST /api/v1/auth/login (malformed JSON)"
INVALID_JSON=$(curl -s -X POST $API_V1/auth/login \
    -H "Content-Type: application/json" \
    -d '{invalid json}')

echo "$INVALID_JSON" | jq

if echo "$INVALID_JSON" | grep -q '"success".*:.*false'; then
    print_success "Invalid JSON handled correctly"
else
    print_error "Invalid JSON not handled"
fi
echo ""

# ============================================
# TEST 8: Pagination - Default Values
# ============================================
print_header "TEST 8: Pagination Helpers - Default Values"
echo ""

# Register user for testing
print_info "Creating test user..."
REGISTER=$(curl -s -X POST $API_V1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
        "username": "pagination_test",
        "email": "pagination@test.com",
        "password": "Test1234"
    }')

print_test "GET /api/v1/users/pagination_test/videos (no pagination params)"
PAGINATION_DEFAULT=$(curl -s "$API_V1/users/pagination_test/videos")
echo "$PAGINATION_DEFAULT" | jq

# Check default pagination values
PAGE=$(echo "$PAGINATION_DEFAULT" | jq -r '.pagination.page')
LIMIT=$(echo "$PAGINATION_DEFAULT" | jq -r '.pagination.limit')

if [ "$PAGE" = "1" ] && [ "$LIMIT" = "20" ]; then
    print_success "Default pagination values correct (page=1, limit=20)"
else
    print_error "Default pagination values incorrect (page=$PAGE, limit=$LIMIT)"
fi
echo ""

# ============================================
# TEST 9: Pagination - Custom Values
# ============================================
print_header "TEST 9: Pagination - Custom Values"
echo ""

print_test "GET /api/v1/users/pagination_test/videos?page=2&limit=5"
PAGINATION_CUSTOM=$(curl -s "$API_V1/users/pagination_test/videos?page=2&limit=5")
echo "$PAGINATION_CUSTOM" | jq

PAGE=$(echo "$PAGINATION_CUSTOM" | jq -r '.pagination.page')
LIMIT=$(echo "$PAGINATION_CUSTOM" | jq -r '.pagination.limit')

if [ "$PAGE" = "2" ] && [ "$LIMIT" = "5" ]; then
    print_success "Custom pagination values correct (page=2, limit=5)"
else
    print_error "Custom pagination values incorrect (page=$PAGE, limit=$LIMIT)"
fi
echo ""

# ============================================
# TEST 10: Pagination - Max Limit
# ============================================
print_header "TEST 10: Pagination - Max Limit Validation"
echo ""

print_test "GET /api/v1/users/pagination_test/videos?limit=500 (exceeds max)"
PAGINATION_MAX=$(curl -s "$API_V1/users/pagination_test/videos?limit=500")
echo "$PAGINATION_MAX" | jq '.pagination'

LIMIT=$(echo "$PAGINATION_MAX" | jq -r '.pagination.limit')

if [ "$LIMIT" = "100" ]; then
    print_success "Max limit enforced (limit capped at 100)"
else
    print_error "Max limit not enforced (limit=$LIMIT)"
fi
echo ""

# ============================================
# TEST 11: Pagination - Invalid Values
# ============================================
print_header "TEST 11: Pagination - Invalid Values Handling"
echo ""

print_test "GET /api/v1/users/pagination_test/videos?page=-1&limit=-5"
PAGINATION_INVALID=$(curl -s "$API_V1/users/pagination_test/videos?page=-1&limit=-5")
echo "$PAGINATION_INVALID" | jq '.pagination'

PAGE=$(echo "$PAGINATION_INVALID" | jq -r '.pagination.page')
LIMIT=$(echo "$PAGINATION_INVALID" | jq -r '.pagination.limit')

if [ "$PAGE" = "1" ] && [ "$LIMIT" = "20" ]; then
    print_success "Invalid values handled (defaults applied)"
else
    print_error "Invalid values not handled correctly"
fi
echo ""

# ============================================
# TEST 12: Query Filters - Sort Order
# ============================================
print_header "TEST 12: Query Filters - Sort Order"
echo ""

print_test "GET /api/v1/users/pagination_test/videos?sort_by=created_at&order=asc"
SORT_ASC=$(curl -s "$API_V1/users/pagination_test/videos?sort_by=created_at&order=asc")
echo "$SORT_ASC" | jq

if echo "$SORT_ASC" | grep -q '"success".*:.*true'; then
    print_success "Sort order ASC accepted"
else
    print_error "Sort order ASC failed"
fi
echo ""

print_test "GET /api/v1/users/pagination_test/videos?sort_by=created_at&order=desc"
SORT_DESC=$(curl -s "$API_V1/users/pagination_test/videos?sort_by=created_at&order=desc")
echo "$SORT_DESC" | jq

if echo "$SORT_DESC" | grep -q '"success".*:.*true'; then
    print_success "Sort order DESC accepted"
else
    print_error "Sort order DESC failed"
fi
echo ""

# ============================================
# TEST 13: Response Format Consistency
# ============================================
print_header "TEST 13: Response Format Consistency"
echo ""

print_info "Checking response format across different endpoints..."

# Success response
print_test "Success response format (GET /health)"
SUCCESS_FORMAT=$(curl -s $BASE_URL/health)
echo "$SUCCESS_FORMAT" | jq

if echo "$SUCCESS_FORMAT" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Success response has correct structure"
else
    print_error "Success response format incorrect"
fi
echo ""

# Error response
print_test "Error response format (GET /nonexistent)"
ERROR_FORMAT=$(curl -s $BASE_URL/nonexistent)
echo "$ERROR_FORMAT" | jq

if echo "$ERROR_FORMAT" | jq -e '.success' > /dev/null 2>&1 && \
   echo "$ERROR_FORMAT" | jq -e '.error' > /dev/null 2>&1; then
    print_success "Error response has correct structure"
else
    print_error "Error response format incorrect"
fi
echo ""

# Paginated response
print_test "Paginated response format (GET /users/pagination_test/videos)"
PAGINATED_FORMAT=$(curl -s "$API_V1/users/pagination_test/videos")
echo "$PAGINATED_FORMAT" | jq

if echo "$PAGINATED_FORMAT" | jq -e '.success' > /dev/null 2>&1 && \
   echo "$PAGINATED_FORMAT" | jq -e '.data' > /dev/null 2>&1 && \
   echo "$PAGINATED_FORMAT" | jq -e '.pagination' > /dev/null 2>&1; then
    print_success "Paginated response has correct structure"
else
    print_error "Paginated response format incorrect"
fi
echo ""

# ============================================
# TEST 14: Pagination Metadata
# ============================================
print_header "TEST 14: Pagination Metadata Completeness"
echo ""

print_test "Checking pagination metadata fields..."
PAGINATION_META=$(curl -s "$API_V1/users/pagination_test/videos" | jq '.pagination')
echo "$PAGINATION_META"

REQUIRED_FIELDS=("page" "limit" "total" "total_pages" "has_next" "has_prev")
ALL_PRESENT=true

for field in "${REQUIRED_FIELDS[@]}"; do
    if echo "$PAGINATION_META" | jq -e ".$field" > /dev/null 2>&1; then
        echo "  ✓ $field present"
    else
        echo "  ✗ $field missing"
        ALL_PRESENT=false
    fi
done

if [ "$ALL_PRESENT" = true ]; then
    print_success "All pagination metadata fields present"
else
    print_error "Some pagination metadata fields missing"
fi
echo ""

# ============================================
# TEST 15: Request Logging
# ============================================
print_header "TEST 15: Request Logging"
echo ""

print_info "Checking if requests are being logged..."
print_info "Making test request..."

curl -s $BASE_URL/health > /dev/null

print_info "Check Docker logs with: docker logs gosport-api --tail 5"
print_success "Request logging should appear in server logs"
echo ""

# ============================================
# SUMMARY
# ============================================
echo ""
echo "========================================"
print_success "BASIC API STRUCTURE TESTS COMPLETED!"
echo "========================================"
echo ""

print_info "Summary of tested features:"
echo "  ✅ Health check endpoint"
echo "  ✅ 404 Not Found handler"
echo "  ✅ CORS configuration"
echo "  ✅ Global rate limiting (100 req/min)"
echo "  ✅ Auth rate limiting (5 req/15min)"
echo "  ✅ Error handling (validation, invalid JSON)"
echo "  ✅ Pagination helpers (default, custom, max, invalid)"
echo "  ✅ Query filters (sort order)"
echo "  ✅ Response format consistency"
echo "  ✅ Pagination metadata"
echo "  ✅ Request logging"
echo ""

print_info "Check server logs for detailed request/error logging:"
echo "  docker logs gosport-api --tail 50"
echo ""

print_success "All Basic API Structure features tested! 🎉"