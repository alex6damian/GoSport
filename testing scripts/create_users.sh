#!/bin/bash
# testing_script/create_test_users.sh

echo "👥 Creating 10 test users..."
echo ""

API_URL="http://localhost:8080/api/v1"

# Array of usernames and sports
usernames=("alex" "maria" "john" "sarah" "david" "emma" "michael" "sophia" "james" "olivia")
sports=("football" "basketball" "tennis" "volleyball" "baseball" "hockey" "rugby" "cricket" "golf" "swimming")

# Create users
for i in {0..9}; do
    username="${usernames[$i]}"
    email="${username}@gosport.com"
    password="Test1234"
    sport="${sports[$i]}"
    
    echo "Creating user $((i+1)): $username ($sport)"
    
    response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"email\": \"$email\",
            \"password\": \"$password\"
        }")
    
    success=$(echo "$response" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        user_id=$(echo "$response" | jq -r '.data.id // .data.user.id')
        echo "✅ User $username created (ID: $user_id)"
    else
        error=$(echo "$response" | jq -r '.message // .error')
        echo "⚠️  $username: $error"
    fi
    
    echo ""
done

echo ""
echo "✅ All users created!"
echo ""
echo "📋 User List:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in {0..9}; do
    printf "ID: %2d | Username: %-10s | Email: %s\n" "$((i+1))" "${usernames[$i]}" "${usernames[$i]}@gosport.com"
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 All passwords: Test1234"
echo ""
echo "🧪 Test login:"
echo "curl -X POST $API_URL/auth/login \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"alex@gosport.com\",\"password\":\"Test1234\"}' | jq"