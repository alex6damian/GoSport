#!/bin/bash
# test_video_upload.sh

echo "🎬 Testing Video Upload & Meilisearch Integration"
echo ""

# ========================================
# 1. Check if test video exists
# ========================================
if [ ! -f "test_video.mp4" ]; then
    echo "📥 Downloading test video..."
    curl -L "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4" \
         -o test_video.mp4 --progress-bar
    
    if [ ! -f "test_video.mp4" ]; then
        echo "❌ Failed to download test video"
        exit 1
    fi
    
    echo "✅ Test video downloaded"
else
    echo "✅ Using existing test_video.mp4"
fi

echo ""

# ========================================
# 2. Login and get token
# ========================================
echo "🔐 Logging in..."

# Create admin user if doesn't exist
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@gosport.com",
    "password": "Test1234"
  }' > /dev/null 2>&1

# Login
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gosport.com",
    "password": "Test1234"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.data.token // .token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Login failed!"
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo "Token: ${TOKEN:0:20}..."
echo ""

# ========================================
# 3. Upload video
# ========================================
echo "📤 Uploading video..."

UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/videos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@test_video.mp4" \
  -F "title=Messi Amazing Goals 2024" \
  -F "description=Best goals compilation from Lionel Messi" \
  -F "sport=football")

sleep 3

echo "$UPLOAD_RESPONSE" | jq '.'

VIDEO_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.id // .id // empty')

if [ -z "$VIDEO_ID" ] || [ "$VIDEO_ID" = "null" ]; then
    echo "❌ Upload failed!"
    exit 1
fi

echo ""
echo "✅ Video uploaded! ID: $VIDEO_ID"
echo ""

# ========================================
# 4. Wait for Meilisearch indexing
# ========================================
echo "⏳ Waiting 3 seconds for Meilisearch indexing..."
sleep 3
echo ""

# ========================================
# 5. Search for video
# ========================================
echo "🔍 Searching for 'Messi'..."
SEARCH_RESPONSE=$(curl -s "http://localhost:8080/api/v1/search/videos?q=messi")
echo "$SEARCH_RESPONSE" | jq '.'
echo ""

# ========================================
# 6. Test typo tolerance
# ========================================
echo "🔍 Testing typo tolerance: searching for 'mesi' (typo)..."
TYPO_RESPONSE=$(curl -s "http://localhost:8080/api/v1/search/videos?q=mesi")
echo "$TYPO_RESPONSE" | jq '.'
echo ""

# ========================================
# 7. Filter by sport
# ========================================
echo "🔍 Searching with sport filter: football..."
FILTER_RESPONSE=$(curl -s "http://localhost:8080/api/v1/search/videos?q=goals&sport=football")
echo "$FILTER_RESPONSE" | jq '.'
echo ""

# ========================================
# 8. Check Meilisearch directly
# ========================================
cd ..
export MEILI_MASTER_KEY=$(grep MEILI_MASTER_KEY .env | cut -d '=' -f2)
echo "🔍 Checking Meilisearch index directly..."
curl -s -H "Authorization: Bearer $MEILI_MASTER_KEY" \
  "http://localhost:7700/indexes/videos/documents?limit=5" | jq '.'
echo ""

# ========================================
# Summary
# ========================================
echo "✅ Test complete!"
echo ""
echo "📊 Summary:"
echo "  Video ID: $VIDEO_ID"
echo "  Uploaded: test_video.mp4"
echo "  Title: Messi Amazing Goals 2024"
echo ""
echo "🔗 Quick links:"
echo "  Search UI:        http://localhost:7700"
echo "  MinIO Console:    http://localhost:9001"
echo ""
echo "🧪 Manual tests:"
echo "  curl \"http://localhost:8080/api/v1/search/videos?q=messi\" | jq"
echo "  curl \"http://localhost:8080/api/v1/videos/$VIDEO_ID\" | jq"