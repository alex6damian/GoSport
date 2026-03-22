#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:8080/api/v1"

# Colors (safe defaults if not set)
BLUE="${BLUE:-}"
GREEN="${GREEN:-}"
RED="${RED:-}"
YELLOW="${YELLOW:-}"
NC="${NC:-}"

# Helper functions
print_test()   { echo -e "${BLUE}$1${NC}"; }
print_success(){ echo -e "${GREEN}✅ $1${NC}"; }
print_error()  { echo -e "${RED}❌ $1${NC}"; }
print_info()   { echo -e "${YELLOW}ℹ️  $1${NC}"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { print_error "Missing dependency: $1"; exit 1; }
}
need_cmd curl
need_cmd jq

assert_success_json() {
  local json="$1"
  if ! echo "$json" | grep -q "success.*true"; then
    print_error "Expected success=true, got:"
    echo "$json" | jq .
    exit 1
  fi
}

assert_item_in_list_by_id() {
  # $1 json, $2 id
  local json="$1"
  local id="$2"
  local found
  found=$(echo "$json" | jq -r --arg id "$id" '
    ((.data.items // .data // .items // []) | any(.id == ($id|tonumber)))
  ')
  if [[ "$found" != "true" ]]; then
    print_error "Expected item id=$id to be present in list, got:"
    echo "$json" | jq .
    exit 1
  fi
}

assert_item_not_in_list_by_id() {
  # $1 json, $2 id
  local json="$1"
  local id="$2"
  local found
  found=$(echo "$json" | jq -r --arg id "$id" '
    ((.data.items // .data // .items // []) | any(.id == ($id|tonumber)))
  ')
  if [[ "$found" == "true" ]]; then
    print_error "Expected item id=$id to be absent from list, got:"
    echo "$json" | jq .
    exit 1
  fi
}

# --------------------------------------------------------------------
# User 1: alex_test
print_info "Creating user: alex_test"
REGISTER_1=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alex_test",
    "email": "alex@test.com",
    "password": "SecurePass123",
    "role": "user"
  }')

if echo "$REGISTER_1" | grep -q "success.*true"; then
  print_success "User alex_test created (or already exists)"
else
  print_info "User might already exist, trying login..."
fi

# Login alex_test
print_info "Login as alex_test..."
TOKEN_ALEX=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@test.com",
    "password": "SecurePass123"
  }' | jq -r '.data.token')

if [[ -z "${TOKEN_ALEX:-}" || "$TOKEN_ALEX" == "null" ]]; then
  print_error "Failed to login as alex_test"
  exit 1
fi

print_success "Logged in as alex_test"
echo "Token: ${TOKEN_ALEX:0:50}..."
echo ""

# --------------------------------------------------------------------
# 1) Get videos and pick first VIDEO_ID
print_info "Fetching videos..."
VIDEOS_JSON=$(curl -s -X GET "$BASE_URL/videos/")
VIDEO_ID=$(echo "$VIDEOS_JSON" | jq -r '(.data.videos // .data // .videos // [])[0].id')

if [[ -z "${VIDEO_ID:-}" || "$VIDEO_ID" == "null" ]]; then
  print_error "No videos found or unexpected response from /videos"
  echo "$VIDEOS_JSON" | jq .
  exit 1
fi

print_success "Found first video id: $VIDEO_ID"
echo ""

# --------------------------------------------------------------------
# 2) Add ROOT comment to first video
print_info "Adding ROOT comment to video $VIDEO_ID..."
ADD_COMMENT_JSON=$(curl -s -X POST "$BASE_URL/videos/$VIDEO_ID/comments" \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Comment de test (alex_test)"
  }')

COMMENT_ID=$(echo "$ADD_COMMENT_JSON" | jq -r '.data.id // .id')
if [[ -z "${COMMENT_ID:-}" || "$COMMENT_ID" == "null" ]]; then
  print_error "Failed to create comment (could not extract comment id)"
  echo "$ADD_COMMENT_JSON" | jq .
  exit 1
fi
print_success "Root comment created: $COMMENT_ID"
echo ""

# --------------------------------------------------------------------
# 3) LIST comments for video and assert the comment appears
print_info "Listing comments for video $VIDEO_ID..."
LIST_COMMENTS_JSON=$(curl -s -X GET "$BASE_URL/videos/$VIDEO_ID/comments?page=1&limit=20")
assert_success_json "$LIST_COMMENTS_JSON"
assert_item_in_list_by_id "$LIST_COMMENTS_JSON" "$COMMENT_ID"
print_success "List comments OK (comment is present)"
echo ""

# --------------------------------------------------------------------
# 4) Add REPLY to the root comment via POST /comments/:id/replies
print_info "Adding reply to comment $COMMENT_ID..."
ADD_REPLY_JSON=$(curl -s -X POST "$BASE_URL/comments/$COMMENT_ID/replies" \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Reply de test (alex_test)"
  }')

REPLY_ID=$(echo "$ADD_REPLY_JSON" | jq -r '.data.id // .id')
if [[ -z "${REPLY_ID:-}" || "$REPLY_ID" == "null" ]]; then
  print_error "Failed to create reply (could not extract reply id)"
  echo "$ADD_REPLY_JSON" | jq .
  exit 1
fi
print_success "Reply created: $REPLY_ID"
echo ""

# --------------------------------------------------------------------
# 5) LIST replies and assert reply appears
print_info "Listing replies for comment $COMMENT_ID..."
LIST_REPLIES_JSON=$(curl -s -X GET "$BASE_URL/comments/$COMMENT_ID/replies?page=1&limit=20")
assert_success_json "$LIST_REPLIES_JSON"
assert_item_in_list_by_id "$LIST_REPLIES_JSON" "$REPLY_ID"
print_success "List replies OK (reply is present)"
echo ""

# --------------------------------------------------------------------
# 6) Edit ROOT comment (PUT /comments/:id)
print_info "Editing root comment $COMMENT_ID..."
EDIT_COMMENT_JSON=$(curl -s -X PUT "$BASE_URL/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN_ALEX" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Comment EDITAT (alex_test)"
  }')
assert_success_json "$EDIT_COMMENT_JSON"
print_success "Root comment updated"
echo ""

# --------------------------------------------------------------------
# 7) Delete REPLY first (optional but cleaner), then delete root comment
print_info "Deleting reply $REPLY_ID..."
DELETE_REPLY_JSON=$(curl -s -X DELETE "$BASE_URL/comments/$REPLY_ID" \
  -H "Authorization: Bearer $TOKEN_ALEX")
assert_success_json "$DELETE_REPLY_JSON"
print_success "Reply deleted"
echo ""

# Re-list replies and assert reply is gone (depends on your delete behavior: soft delete vs hard delete)
print_info "Re-listing replies to confirm deletion..."
LIST_REPLIES_AFTER_DEL_JSON=$(curl -s -X GET "$BASE_URL/comments/$COMMENT_ID/replies?page=1&limit=20")
assert_success_json "$LIST_REPLIES_AFTER_DEL_JSON"
assert_item_not_in_list_by_id "$LIST_REPLIES_AFTER_DEL_JSON" "$REPLY_ID"
print_success "Reply no longer in list"
echo ""

print_info "Deleting root comment $COMMENT_ID..."
DELETE_COMMENT_JSON=$(curl -s -X DELETE "$BASE_URL/comments/$COMMENT_ID" \
  -H "Authorization: Bearer $TOKEN_ALEX")
assert_success_json "$DELETE_COMMENT_JSON"
print_success "Root comment deleted"
echo ""

# Re-list comments and assert root comment is gone
print_info "Re-listing comments to confirm deletion..."
LIST_COMMENTS_AFTER_DEL_JSON=$(curl -s -X GET "$BASE_URL/videos/$VIDEO_ID/comments?page=1&limit=20")
assert_success_json "$LIST_COMMENTS_AFTER_DEL_JSON"
assert_item_not_in_list_by_id "$LIST_COMMENTS_AFTER_DEL_JSON" "$COMMENT_ID"
print_success "Root comment no longer in list"
echo ""

print_success "Comment flow done: list comments -> add reply -> list replies -> edit -> delete reply -> delete root"