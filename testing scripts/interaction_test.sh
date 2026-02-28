#!/bin/bash
# Quick test to verify everything works

API_URL="http://localhost:8080/api/v1"

echo "🎬 Quick Watch History & Favorites Test"
echo ""

# Login
echo "1️⃣ Login..."
TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"fresh1@test.com","password":"Test1234"}' \
  | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    exit 1
fi

echo "✅ Logged in"
echo ""

# Get video ID
VIDEO_ID=$(curl -s "$API_URL/videos?limit=1" | jq -r '.data.videos[0].id')
echo "🎬 Using video ID: $VIDEO_ID"
echo ""

# Track a view
echo "2️⃣ Tracking view..."
curl -s -X POST "$API_URL/videos/$VIDEO_ID/view" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -c
echo ""

# Add to favorites
echo "3️⃣ Adding to favorites..."
RESULT=$(curl -s -X POST "$API_URL/videos/$VIDEO_ID/favorite" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$RESULT" | jq -c
IS_FAV=$(echo "$RESULT" | jq -r '.is_favorited')
echo ""

# Check watch history
echo "4️⃣ Checking watch history..."
HISTORY=$(curl -s "$API_URL/users/me/history" \
  -H "Authorization: Bearer $TOKEN")

HISTORY_COUNT=$(echo "$HISTORY" | jq '.data | length')
echo "Found $HISTORY_COUNT videos in history"

if [ "$HISTORY_COUNT" -gt "0" ]; then
    echo "✅ Watch history works!"
    echo "$HISTORY" | jq -r '.data[] | "   - \(.title)"'
else
    echo "❌ Watch history is empty"
fi
echo ""

# Check favorites
echo "5️⃣ Checking favorites..."
FAVORITES=$(curl -s "$API_URL/users/me/favorites" \
  -H "Authorization: Bearer $TOKEN")

FAV_COUNT=$(echo "$FAVORITES" | jq '.data | length')
echo "Found $FAV_COUNT videos in favorites"

if [ "$FAV_COUNT" -gt "0" ]; then
    echo "✅ Favorites works!"
    echo "$FAVORITES" | jq -r '.data[] | "   - \(.title)"'
else
    echo "❌ Favorites is empty"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$HISTORY_COUNT" -gt "0" ] && [ "$FAV_COUNT" -gt "0" ]; then
    echo "✅ All tests PASSED!"
else
    echo "❌ Some tests FAILED"
    echo "   Watch history: $HISTORY_COUNT videos"
    echo "   Favorites: $FAV_COUNT videos"
fi