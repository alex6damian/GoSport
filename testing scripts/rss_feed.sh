#!/bin/bash

set -e

BASE_URL="http://localhost:8080/api/v1"

echo "🚀 Testing RSS Feed Creation"
echo "============================="
echo ""

# Step 1: Login as admin
echo "1️⃣ Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gosport.com",
    "password": "Admin1234"
  }')

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed! Token is null or empty."
  echo "Error: $(echo "$LOGIN_RESPONSE" | jq -r '.error')"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Decode token to verify claims
echo "2️⃣ Decoding JWT token..."
PAYLOAD=$(echo $TOKEN | cut -d'.' -f2)
echo "$PAYLOAD" | base64 -d 2>/dev/null | jq
echo ""

# Step 3: Add RSS feed
echo "3️⃣ Adding ESPN Soccer RSS feed..."
FEED_RESPONSE=$(curl -s -X POST $BASE_URL/admin/feeds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ESPN Soccer",
    "url": "https://www.espn.com/espn/rss/soccer/news",
    "sport": "football",
    "language": "en"
  }')

echo "Feed creation response:"
echo "$FEED_RESPONSE" | jq
echo ""

# Check success
if echo "$FEED_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Feed created successfully!"
  FEED_ID=$(echo "$FEED_RESPONSE" | jq -r '.data.id')
  echo "Feed ID: $FEED_ID"
else
  echo "❌ Failed to create feed!"
  ERROR=$(echo "$FEED_RESPONSE" | jq -r '.error')
  echo "Error: $ERROR"
  
  # Check backend logs
  echo ""
  echo "📋 Recent backend logs:"
  docker logs gosport-api --tail 20
  
  exit 1
fi

echo ""
echo "🎉 Done! RSS feed added successfully!"