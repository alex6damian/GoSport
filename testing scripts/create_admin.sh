# Generate correct password hash using backend
cd backend/scripts

# Create hash generator
cat > hash_password.go << 'EOF'
package main
import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)
func main() {
	hash, _ := bcrypt.GenerateFromPassword([]byte("Admin1234"), bcrypt.DefaultCost)
	fmt.Println(string(hash))
}
EOF

# Generate hash
HASH=$(go run hash_password.go)
echo "Hash: $HASH"

# Update admin in database
cd ../..
docker exec -i gosport-db psql -U pgadmin -d gosport <<EOF
DELETE FROM users WHERE email = 'admin@gosport.com';
INSERT INTO users (username, email, password, role, created_at, updated_at)
VALUES ('admin', 'admin@gosport.com', '$HASH', 'admin', NOW(), NOW());
SELECT id, username, email, role FROM users WHERE email = 'admin@gosport.com';
EOF