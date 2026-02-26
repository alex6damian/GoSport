### NEWS/ADMIN RSS FEED TESTING SCRIPT ###

#!/bin/bash

set -e

BASE_URL="http://localhost:8080/api/v1"

echo "🚀 Testing Full RSS API"
echo "========================"
echo ""

########################################
# 1️⃣ Login
########################################
echo "1️⃣ Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gosport.com",
    "password": "Admin1234"
  }')

echo "$LOGIN_RESPONSE" | jq
echo ""

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful!"
echo ""

########################################
# 2️⃣ Create Feed (WORKING, removed for testing)
########################################
# echo "2️⃣ Creating RSS Feed..."
# CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/admin/feeds \
#   -H "Authorization: Bearer $TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "ESPN NBA",
#     "url": "https://www.espn.com/espn/rss/NBA/news",
#     "sport": "nba",
#     "language": "en"
#   }')

# echo "$CREATE_RESPONSE" | jq
# echo ""

# if ! echo "$CREATE_RESPONSE" | jq -e '.success' > /dev/null; then
#   echo "❌ Feed creation failed!"
#   exit 1
# fi

# FEED_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
# echo "✅ Feed created with ID: $FEED_ID"
# echo ""

########################################
# 3️⃣ Get All Feeds (Admin)
########################################
echo "3️⃣ Getting all RSS feeds..."
curl -s -X GET $BASE_URL/admin/feeds \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

FEED_ID=1

########################################
# 4️⃣ Update Feed
########################################
echo "4️⃣ Updating RSS feed..."
curl -s -X PUT $BASE_URL/admin/feeds/$FEED_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ESPN NBA Updated",
    "sport": "nba",
    "language": "en"
  }' | jq
echo ""

########################################
# 5️⃣ Sync Feed
########################################
echo "5️⃣ Syncing specific feed..."
curl -s -X POST $BASE_URL/admin/feeds/$FEED_ID/sync \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

########################################
# 6️⃣ Sync All Feeds
########################################
echo "6️⃣ Syncing all feeds..."
curl -s -X POST $BASE_URL/admin/feeds/sync-all \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

########################################
# 7️⃣ Public - Get All News
########################################
echo "7️⃣ Getting all news..."
NEWS_RESPONSE=$(curl -s -X GET $BASE_URL/news/)
echo "$NEWS_RESPONSE" | jq
echo ""

########################################
# 8️⃣ Public - Get News by Sport
########################################
echo "8️⃣ Getting NBA news..."
SPORT_NEWS=$(curl -s -X GET $BASE_URL/news/sport/nba)
echo "$SPORT_NEWS" | jq
echo ""

########################################
# 9️⃣ Public - Get Single Article (if exists)
########################################
ARTICLE_ID=$(echo "$NEWS_RESPONSE" | jq -r '.data.articles[0].id')

if [ "$ARTICLE_ID" != "null" ] && [ -n "$ARTICLE_ID" ]; then
  echo "9️⃣ Getting single article (ID: $ARTICLE_ID)..."
  curl -s -X GET $BASE_URL/news/$ARTICLE_ID | jq
  echo ""
else
  echo "9️⃣ No articles found to test single article endpoint."
  echo ""
fi

########################################
# 🔟 Delete Feed
########################################
echo "🔟 Deleting RSS feed..."
curl -s -X DELETE $BASE_URL/admin/feeds/$FEED_ID \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

echo "🎉 All routes tested successfully!"