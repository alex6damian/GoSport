#!/bin/bash

echo "🧪 Testing Video Upload & Worker Processing"
echo "=========================================="
echo ""

BASE_URL="http://localhost:8080/api/v1"
HEALTH_URL="http://localhost:8080/health"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API is healthy
echo "🏥 Step 1: Health check..."
HEALTH=$(curl -s $HEALTH_URL)
STATUS=$(echo $HEALTH | jq -r '.status' 2>/dev/null)

if [ "$STATUS" != "ok" ]; then
  echo -e "${RED}❌ API is not healthy${NC}"
  exit 1
fi
echo -e "${GREEN}✅ API is healthy${NC}"
echo ""

# Register user and login to get token
echo "📝 Step 2: Register user..."
curl -s -X POST $BASE_URL/auth/register -H "Content-Type: application/json" -d '{"username": "test_user", "email": "testuser@example.com", "password": "Test1234"}' > /dev/null
echo -e "${GREEN}✅ User registration attempted (OK if already exists)${NC}"
echo ""

echo "🔐 Step 3: Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login -H "Content-Type: application/json" -d '{"email": "testuser@example.com", "password": "Test1234"}')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"; echo "Response: $LOGIN_RESPONSE"; exit 1
fi
echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Create test video
echo "📹 Step 4: Creating test video..."
if [ ! -f "test_video.mp4" ]; then
  if command -v ffmpeg &> /dev/null; then
    ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=24 -pix_fmt yuv420p -y test_video.mp4 > /dev/null 2>&1
    echo -e "${GREEN}✅ Test video created${NC}"
  else
    echo -e "${RED}❌ ffmpeg not found. Please create test_video.mp4 manually${NC}"; exit 1
  fi
else
  echo -e "${GREEN}✅ Test video exists${NC}"
fi
echo ""

# Video upload and worker processing
echo "⬆️  Step 5: Uploading video to trigger worker..."
UPLOAD_RESPONSE=$(curl -s -X POST $BASE_URL/videos/upload -H "Authorization: Bearer $TOKEN" -F "video=@test_video.mp4" -F "title=Test Football Goal ⚽")
VIDEO_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.id' 2>/dev/null)

if [ -z "$VIDEO_ID" ] || [ "$VIDEO_ID" = "null" ]; then
  echo -e "${RED}❌ Upload failed${NC}"; echo "Response: $UPLOAD_RESPONSE"; exit 1
fi
INITIAL_STATUS=$(echo $UPLOAD_RESPONSE | jq -r '.data.status')
echo -e "${GREEN}✅ Upload successful. Job created for worker.${NC}"
echo "Video ID: $VIDEO_ID"
echo "Initial Status: $INITIAL_STATUS"
echo ""

# Wait for worker to process the video
echo "⏳ Step 6: Waiting for worker to process the video..."
MAX_WAIT_TIME=120 # 2 minutes timeout
ELAPSED_TIME=0
CURRENT_STATUS=""

while [ $ELAPSED_TIME -lt $MAX_WAIT_TIME ]; do
  VIDEO_DETAILS=$(curl -s $BASE_URL/videos/$VIDEO_ID)
  CURRENT_STATUS=$(echo $VIDEO_DETAILS | jq -r '.data.video.status')

  if [ "$CURRENT_STATUS" = "ready" ]; then
    echo -e "\n${GREEN}✅ Worker finished successfully! Status is 'ready'.${NC}"
    HLS_PATH=$(echo $VIDEO_DETAILS | jq -r '.data.video.hls_path')
    if [ -z "$HLS_PATH" ] || [ "$HLS_PATH" = "null" ]; then
        echo -e "${RED}❌ Status is ready, but HLS path is missing!${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ HLS Path is set: $HLS_PATH${NC}"
    break
  elif [ "$CURRENT_STATUS" = "failed" ]; then
    echo -e "\n${RED}❌ Worker failed! Status is 'failed'. Check worker logs.${NC}"
    exit 1
  fi

  echo -n "." # Print a dot for each check
  sleep 5
  ELAPSED_TIME=$((ELAPSED_TIME + 5))
done

if [ "$CURRENT_STATUS" != "ready" ]; then
  echo -e "\n${RED}❌ Timeout! Worker did not finish in $MAX_WAIT_TIME seconds. Last status: '$CURRENT_STATUS'${NC}"
  exit 1
fi
echo ""

# echo "📋 Step 7: Listing videos..."
# LIST_RESPONSE=$(curl -s "$BASE_URL/videos?page=1&limit=10")
# TOTAL=$(echo $LIST_RESPONSE | jq -r '.pagination.total' 2>/dev/null)
# if [ -z "$TOTAL" ] || [ "$TOTAL" = "null" ]; then echo -e "${RED}❌ List videos failed${NC}"; exit 1; fi
# echo -e "${GREEN}✅ Videos listed. Total: $TOTAL${NC}"
# echo ""

# echo "🗑️  Step 8: Deleting video..."
# DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/videos/$VIDEO_ID -H "Authorization: Bearer $TOKEN")
# DELETE_SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success' 2>/dev/null)
# if [ "$DELETE_SUCCESS" != "true" ]; then echo -e "${RED}❌ Delete failed${NC}"; exit 1; fi
# echo -e "${GREEN}✅ Video deleted${NC}"
# echo ""

# Cleanup
# echo "🧹 Cleanup..."
# rm -f test_video.mp4
# echo -e "${GREEN}✅ Test video file removed${NC}"
# echo ""

echo "=========================================="
echo -e "${GREEN}🎉 All tests passed, including worker validation!${NC}"
echo "=========================================="