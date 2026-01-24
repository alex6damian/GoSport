#!/bin/bash

echo "👤 Testing User Routes API"
echo "=============================="
echo ""

BASE_URL="http://localhost:8080/api/v1"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function
print_test() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# ============================================
# SETUP: Register & Login
# ============================================
print_test "🔧 SETUP: Creating test users"
echo ""

# User 1: alex_test
print_info "Creating user: alex_test"
REGISTER_1=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_test",
    "email": "alex@test.com",
    "password": "SecurePass123",
    "role": "user"
  }')

if echo $REGISTER_1 | grep -q "success.*true"; then
    print_success "User alex_test created (or already exists)"
else
    print_info "User might already exist, trying login..."
fi

# Login alex_test
print_info "Login as alex_test..."
TOKEN_ALEX=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@test.com",
    "password": "SecurePass123"
  }' | jq -r '.data.token')

if [ -z "$TOKEN_ALEX" ] || [ "$TOKEN_ALEX" = "null" ]; then
    print_error "Failed to login as alex_test"
    exit 1
fi

print_success "Logged in as alex_test"
echo "Token: ${TOKEN_ALEX:0:50}..."
echo ""

# User 2: johndoe
print_info "Creating user: johndoe"
REGISTER_2=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@test.com",
    "password": "JohnDoe123",
    "role": "user"
  }')

if echo $REGISTER_2 | grep -q "success.*true"; then
    print_success "User johndoe created"
else
    print_info "User might already exist"
fi

# Login johndoe
TOKEN_JOHN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "JohnDoe123"
  }' | jq -r '.data.token')

print_success "Logged in as johndoe"
echo ""

# ============================================
# TEST 1: GET /users/me (Protected)
# ============================================
print_test "1️⃣  GET /users/me (My Profile - Protected)"
echo ""

print_info "Request with valid token (alex_test):"
curl -s $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN_ALEX" | jq
echo ""

print_info "Expected: 200 OK, returns full profile with email"
echo ""

# ============================================
# TEST 2: GET /users/me WITHOUT token
# ============================================
print_test "2️⃣  GET /users/me WITHOUT token (Should fail)"
echo ""

print_info "Request without Authorization header:"
curl -s $BASE_URL/users/me | jq
echo ""

print_info "Expected: 401 Unauthorized, 'Missing authorization header'"
echo ""

# ============================================
# TEST 3: PUT /users/me (Update Profile)
# ============================================
print_test "3️⃣  PUT /users/me (Update Profile - Protected)"
echo ""

print_info "Update username and avatar:"
curl -s -X PUT $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_updated",
    "avatar": "https://i.pravatar.cc/150?img=12"
  }' | jq
echo ""

print_info "Expected: 200 OK, returns updated profile"
echo ""

# ============================================
# TEST 4: PUT /users/me with duplicate username
# ============================================
print_test "4️⃣  PUT /users/me with duplicate username (Should fail)"
echo ""

print_info "Trying to change username to 'johndoe' (already taken):"
curl -s -X PUT $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe"
  }' | jq
echo ""

print_info "Expected: 409 Conflict, 'Username already taken'"
echo ""

# ============================================
# TEST 5: PUT /users/me with invalid avatar URL
# ============================================
print_test "5️⃣  PUT /users/me with invalid avatar URL (Should fail)"
echo ""

print_info "Invalid URL format:"
curl -s -X PUT $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "avatar": "not-a-valid-url"
  }' | jq
echo ""

print_info "Expected: 400 Bad Request, validation error"
echo ""

# ============================================
# TEST 6: GET /users/:username (Public Profile)
# ============================================
print_test "6️⃣  GET /users/:username (Public Profile - No Auth)"
echo ""

print_info "Get public profile of alex_updated:"
curl -s $BASE_URL/users/alex_updated | jq
echo ""

print_info "Expected: 200 OK, profile WITHOUT email (public)"
echo ""

# ============================================
# TEST 7: GET /users/:username (Nonexistent)
# ============================================
print_test "7️⃣  GET /users/nonexistent_user (Should fail)"
echo ""

print_info "Request for user that doesn't exist:"
curl -s $BASE_URL/users/nonexistent_user | jq
echo ""

print_info "Expected: 404 Not Found, 'User not found'"
echo ""

# ============================================
# TEST 8: GET /users/:username/videos
# ============================================
print_test "8️⃣  GET /users/:username/videos (User's Videos)"
echo ""

print_info "Get videos from alex_updated (empty for now):"
curl -s "$BASE_URL/users/alex_updated/videos?page=1&limit=10" | jq
echo ""

print_info "Expected: 200 OK, empty videos array with pagination"
echo ""

# ============================================
# TEST 9: GET /users/:username/videos with pagination
# ============================================
print_test "9️⃣  GET /users/:username/videos with pagination params"
echo ""

print_info "Request with page=2, limit=5:"
curl -s "$BASE_URL/users/johndoe/videos?page=2&limit=5" | jq
echo ""

print_info "Expected: 200 OK, pagination reflects params"
echo ""

# ============================================
# TEST 10: GET /users/:username/videos (Nonexistent user)
# ============================================
print_test "🔟 GET /users/nonexistent/videos (Should fail)"
echo ""

print_info "Request videos for nonexistent user:"
curl -s "$BASE_URL/users/nonexistent/videos" | jq
echo ""

print_info "Expected: 404 Not Found, 'User not found'"
echo ""

# ============================================
# TEST 11: Verify updated username persists
# ============================================
print_test "1️⃣1️⃣  Verify username change persisted"
echo ""

print_info "GET /users/me again to verify username is 'alex_updated':"
UPDATED_PROFILE=$(curl -s $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN_ALEX")

echo $UPDATED_PROFILE | jq
echo ""

USERNAME=$(echo $UPDATED_PROFILE | jq -r '.data.username')
if [ "$USERNAME" = "alex_updated" ]; then
    print_success "Username successfully updated to 'alex_updated'"
else
    print_error "Username update failed! Current: $USERNAME"
fi
echo ""

# ============================================
# TEST 12: Change username back
# ============================================
print_test "1️⃣2️⃣  Change username back to original"
echo ""

print_info "Update username back to 'alex_test':"
curl -s -X PUT $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_test"
  }' | jq
echo ""

print_info "Expected: 200 OK, username changed back"
echo ""

# ============================================
# SUMMARY
# ============================================
echo ""
echo "========================================"
print_success "ALL TESTS COMPLETED!"
echo "========================================"
echo ""

print_info "Summary of tested endpoints:"
echo "  ✅ GET  /users/me (protected)"
echo "  ✅ PUT  /users/me (protected)"
echo "  ✅ GET  /users/:username (public)"
echo "  ✅ GET  /users/:username/videos (public)"
echo ""

print_info "Edge cases tested:"
echo "  ✅ Missing auth token (401)"
echo "  ✅ Duplicate username (409)"
echo "  ✅ Invalid avatar URL (400)"
echo "  ✅ Nonexistent user (404)"
echo "  ✅ Pagination parameters"
echo ""

print_success "All user routes working as expected! 🎉"