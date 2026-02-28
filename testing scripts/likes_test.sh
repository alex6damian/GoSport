#!/bin/bash

echo "🧪 Testing Video Likes"
echo ""

API_URL="http://localhost:8080/api/v1"

# 1. Login
echo "1️⃣ Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test1234"}' \
  | jq -r '.data.token // .token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed! Trying to register..."
    curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d '{"username":"test_user","email":"testuser@example.com","password":"Test1234"}' | jq
    
    TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"testuser@example.com","password":"Test1234"}' \
      | jq -r '.data.token // .token')
fi

echo "✅ Token: ${TOKEN:0:30}..."
echo ""

# 2. Get videos - ✅ FIXED: Use .data.videos[0].id
echo "2️⃣ Getting first video..."
VIDEO_ID=$(curl -s "$API_URL/videos?limit=1" | jq -r '.data.videos[0].id')

if [ "$VIDEO_ID" = "null" ] || [ -z "$VIDEO_ID" ]; then
    echo "❌ No videos found!"
    exit 1
fi

echo "✅ Video ID: $VIDEO_ID"
echo ""

# 3. Like video
echo "3️⃣ Liking video..."
curl -s -X POST "$API_URL/videos/$VIDEO_ID/like" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
echo ""

# 4. Check if liked
echo "4️⃣ Checking if liked..."
curl -s "$API_URL/videos/$VIDEO_ID/like" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 5. Unlike video
echo "5️⃣ Unliking video..."
curl -s -X POST "$API_URL/videos/$VIDEO_ID/like" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
echo ""

# 6. Like again
echo "6️⃣ Liking again..."
curl -s -X POST "$API_URL/videos/$VIDEO_ID/like" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -c
echo ""

# 7. Get video stats
echo "7️⃣ Getting video stats..."
curl -s "$API_URL/videos/$VIDEO_ID/stats" | jq
echo ""

# 8. Get who liked video
echo "8️⃣ Getting who liked video..."
curl -s "$API_URL/videos/$VIDEO_ID/likes" | jq
echo ""

# 9. Verify in database
echo "9️⃣ Database verification..."
docker exec gosport-db psql -U pgadmin -d gosport -c "
SELECT 
    v.id,
    v.title,
    v.likes,
    (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) AS actual_likes
FROM videos v
WHERE v.id = $VIDEO_ID;
"

echo ""
echo "✅ Likes test complete!"