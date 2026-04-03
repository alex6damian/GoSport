#!/bin/bash
# testing_script/test_subscriptions.sh

echo "🧪 Testing Subscription Routes"
echo ""

# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@gosport.com","password":"Test1234"}' \
  | jq -r '.data.token')

echo "✅ Logged in, token: ${TOKEN:0:20}..."
echo ""

# 1. Subscribe to user 2
echo "1️⃣ Subscribe to user 2:"
curl -s -X POST http://localhost:8080/api/v1/users/2/subscribe \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 2. Check subscription status
echo "2️⃣ Check subscription status:"
curl -s "http://localhost:8080/api/v1/users/2/subscription" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 3. Get my subscriptions
echo "3️⃣ Get my subscriptions:"
curl -s "http://localhost:8080/api/v1/users/subscriptions" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 4. Get user 2's subscribers
echo "4️⃣ Get user 2's subscribers:"
curl -s "http://localhost:8080/api/v1/users/2/subscribers" | jq
echo ""

# 5. Try to subscribe again (should fail)
echo "5️⃣ Try to subscribe again (should fail):"
curl -s -X POST http://localhost:8080/api/v1/users/2/subscribe \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 6. Unsubscribe
# echo "6️⃣ Unsubscribe:"
# curl -s -X DELETE http://localhost:8080/api/v1/users/2/unsubscribe \
#   -H "Authorization: Bearer $TOKEN" | jq
# echo ""

# 7. Check subscription status again
echo "7️⃣ Check subscription status (should be false):"
curl -s "http://localhost:8080/api/v1/users/2/subscription" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

echo "✅ All tests complete!"