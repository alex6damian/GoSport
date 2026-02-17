#!/bin/bash

echo "🧪 Testing Video Upload API"
echo "=============================="
echo ""

BASE_URL="http://localhost:8080/api/v1"
HEALTH_URL="http://localhost:8080/health"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Health check
echo "🏥 Step 1: Health check..."
HEALTH=$(curl -s $HEALTH_URL)
STATUS=$(echo $HEALTH | jq -r '.status' 2>/dev/null)

if [ "$STATUS" != "ok" ]; then
  echo -e "${RED}❌ API is not healthy${NC}"
  exit 1
fi
echo -e "${GREEN}✅ API is healthy${NC}"
echo ""

# Step 2: Register user (if needed)
echo "📝 Step 2: Register user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "testuser@example.com",
    "password": "Test1234"
  }')

REGISTER_SUCCESS=$(echo $REGISTER_RESPONSE | jq -r '.success' 2>/dev/null)

if [ "$REGISTER_SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ User registered${NC}"
else
  echo -e "${YELLOW}⚠️  User might already exist (continuing...)${NC}"
fi
echo ""

# Step 3: Login
echo "🔐 Step 3: Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test1234"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 4: Create test video
echo "📹 Step 4: Creating test video..."
if [ ! -f "test_video.mp4" ]; then
  if command -v ffmpeg &> /dev/null; then
    ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 \
      -pix_fmt yuv420p -c:v libx264 -preset ultrafast \
      test_video.mp4 -y > /dev/null 2>&1
    echo -e "${GREEN}✅ Test video created ($(du -h test_video.mp4 | cut -f1))${NC}"
  else
    echo -e "${RED}❌ ffmpeg not found. Please create test_video.mp4 manually${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Test video exists ($(du -h test_video.mp4 | cut -f1))${NC}"
fi
echo ""

# Step 5: Upload video
echo "⬆️  Step 5: Uploading video..."
UPLOAD_RESPONSE=$(curl -s -X POST $BASE_URL/videos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@test_video.mp4" \
  -F "title=Test Football Goal ⚽" \
  -F "description=Amazing goal from the test script!" \
  -F "sport=football")

VIDEO_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.id' 2>/dev/null)

if [ -z "$VIDEO_ID" ] || [ "$VIDEO_ID" = "null" ]; then
  echo -e "${RED}❌ Upload failed${NC}"
  echo "Response: $UPLOAD_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✅ Upload successful${NC}"
echo "Video ID: $VIDEO_ID"
echo "Title: $(echo $UPLOAD_RESPONSE | jq -r '.data.title')"
echo "Status: $(echo $UPLOAD_RESPONSE | jq -r '.data.status')"
echo "Size: $(echo $UPLOAD_RESPONSE | jq -r '.data.file_size' | numfmt --to=iec)"
echo ""

# Step 6: Get video details
echo "📥 Step 6: Getting video details..."
sleep 1
VIDEO_RESPONSE=$(curl -s $BASE_URL/videos/$VIDEO_ID)
VIDEO_URL=$(echo $VIDEO_RESPONSE | jq -r '.data.video_url' 2>/dev/null)
VIEWS=$(echo $VIDEO_RESPONSE | jq -r '.data.video.views' 2>/dev/null)

if [ -z "$VIDEO_URL" ] || [ "$VIDEO_URL" = "null" ]; then
  echo -e "${RED}❌ Get video failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Video retrieved${NC}"
echo "Views: $VIEWS"
echo "Video URL: ${VIDEO_URL:0:60}..."
echo ""

# Step 7: List all videos
echo "📋 Step 7: Listing videos..."
LIST_RESPONSE=$(curl -s "$BASE_URL/videos?page=1&limit=10")
TOTAL=$(echo $LIST_RESPONSE | jq -r '.pagination.total' 2>/dev/null)

if [ -z "$TOTAL" ] || [ "$TOTAL" = "null" ]; then
  echo -e "${RED}❌ List videos failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Videos listed${NC}"
echo "Total videos: $TOTAL"
echo ""

# Step 8: Filter by sport
echo "⚽ Step 8: Filter by sport (football)..."
FILTER_RESPONSE=$(curl -s "$BASE_URL/videos?sport=football")
FOOTBALL_COUNT=$(echo $FILTER_RESPONSE | jq -r '.pagination.total' 2>/dev/null)
echo -e "${GREEN}✅ Filter works${NC}"
echo "Football videos: $FOOTBALL_COUNT"
echo ""

# Step 9: Search videos
echo "🔍 Step 9: Search videos..."
SEARCH_RESPONSE=$(curl -s "$BASE_URL/videos?search=goal")
SEARCH_COUNT=$(echo $SEARCH_RESPONSE | jq -r '.pagination.total' 2>/dev/null)
echo -e "${GREEN}✅ Search works${NC}"
echo "Videos matching 'goal': $SEARCH_COUNT"
echo ""

# Step 10: Get user videos
echo "👤 Step 10: Get user videos..."
USER_VIDEOS=$(curl -s "$BASE_URL/users/test_user/videos")
USER_VIDEO_COUNT=$(echo $USER_VIDEOS | jq -r '.pagination.total' 2>/dev/null)
echo -e "${GREEN}✅ User videos retrieved${NC}"
echo "User's videos: $USER_VIDEO_COUNT"
echo ""

# Step 11: Update video
echo "✏️  Step 11: Updating video..."
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Epic Goal! 🔥",
    "description": "Updated description with more details",
    "sport": "soccer"
  }')

UPDATE_SUCCESS=$(echo $UPDATE_RESPONSE | jq -r '.success' 2>/dev/null)

if [ "$UPDATE_SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Update failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Video updated${NC}"
echo "New title: $(echo $UPDATE_RESPONSE | jq -r '.data.video.title')"
echo ""

# Step 12: Check MinIO
echo "🗄️  Step 12: Checking MinIO storage..."
MINIO_KEY=$(echo $UPLOAD_RESPONSE | jq -r '.data.minio_key')
echo "MinIO key: $MINIO_KEY"
echo "Check in MinIO Console: http://localhost:9001"
echo "Bucket: gosport-videos"
echo ""

# Step 13: Delete video
echo "🗑️  Step 13: Deleting video..."
DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN")

DELETE_SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success' 2>/dev/null)

if [ "$DELETE_SUCCESS" != "true" ]; then
  echo -e "${RED}❌ Delete failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Video deleted${NC}"
echo ""

# Step 14: Verify deletion
echo "✅ Step 14: Verify deletion..."
VERIFY_RESPONSE=$(curl -s $BASE_URL/videos/$VIDEO_ID)
VERIFY_SUCCESS=$(echo $VERIFY_RESPONSE | jq -r '.success' 2>/dev/null)

if [ "$VERIFY_SUCCESS" = "true" ]; then
  echo -e "${RED}❌ Video still exists (delete failed)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Video confirmed deleted${NC}"
echo ""

# Cleanup
echo "🧹 Cleanup..."
rm -f test_video.mp4
echo -e "${GREEN}✅ Test video file removed${NC}"
echo ""

echo "=============================="
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo "=============================="