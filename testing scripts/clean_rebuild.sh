#!/bin/bash

# complete_rebuild.sh - Full clean rebuild with auto-detection

set -e

echo "🧹 ============================================"
echo "🧹 GoSport Platform - Complete Clean Rebuild"
echo "🧹 ============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ========================================
# Step 1: Stop all services
# ========================================
echo -e "${YELLOW}📦 Step 1/8: Stopping all services...${NC}"
docker-compose down -v
echo -e "${GREEN}✅ Services stopped${NC}"
echo ""

# ========================================
# Step 2: Remove all volumes (auto-detect)
# ========================================
echo -e "${YELLOW}🗑️  Step 2/8: Removing all volumes...${NC}"

# Get all volumes with 'gosport' in name
VOLUMES=$(docker volume ls -q | grep -i gosport || true)

if [ -z "$VOLUMES" ]; then
    echo "  No GoSport volumes found"
else
    echo "  Found volumes:"
    echo "$VOLUMES" | sed 's/^/    - /'
    echo "$VOLUMES" | xargs docker volume rm
    echo -e "${GREEN}  ✅ Removed ${#VOLUMES[@]} volume(s)${NC}"
fi
echo ""

# ========================================
# Step 3: Remove old images (auto-detect)
# ========================================
echo -e "${YELLOW}🖼️  Step 3/8: Removing old images...${NC}"

# Get all images with 'gosport' in name
IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -i gosport || true)

if [ -z "$IMAGES" ]; then
    echo "  No GoSport images found"
else
    echo "  Found images:"
    echo "$IMAGES" | sed 's/^/    - /'
    echo "$IMAGES" | xargs docker rmi -f 2>/dev/null || true
    echo -e "${GREEN}  ✅ Removed images${NC}"
fi
echo ""

# ========================================
# Step 4: Clean Docker build cache
# ========================================
echo -e "${YELLOW}🗑️  Step 4/8: Cleaning Docker build cache...${NC}"
docker builder prune -af
echo -e "${GREEN}✅ Build cache cleaned${NC}"
echo ""

# ========================================
# Step 5: Tidy Go modules
# ========================================
echo -e "${YELLOW}📦 Step 5/8: Tidying Go modules...${NC}"
for dir in backend worker/video_worker worker/rss_worker pkg; do
    if [ -d "$dir" ]; then
        echo "  Tidying $dir..."
        (cd "$dir" && go mod tidy 2>/dev/null) && echo "    ✓ $dir"
    fi
done
echo -e "${GREEN}✅ Go modules tidied${NC}"
echo ""

# ========================================
# Step 6: Rebuild all images
# ========================================
echo -e "${YELLOW}🔨 Step 6/8: Building all images (this may take a few minutes)...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✅ All images built${NC}"
echo ""

# ========================================
# Step 7: Start services in order
# ========================================
echo -e "${YELLOW}🚀 Step 7/8: Starting services...${NC}"

# Get actual service names from docker-compose
DB_SERVICE=$(docker-compose config --services | grep -i "db\|postgres" | head -1)
MINIO_SERVICE=$(docker-compose config --services | grep -i "minio" | head -1)
MEILI_SERVICE=$(docker-compose config --services | grep -i "meili" | head -1)
API_SERVICE=$(docker-compose config --services | grep -i "api\|backend" | head -1)
RSS_SERVICE=$(docker-compose config --services | grep -i "rss" | head -1)
VIDEO_SERVICE=$(docker-compose config --services | grep -i "video" | head -1)

# Start infrastructure
echo "  Starting $DB_SERVICE..."
docker-compose up -d $DB_SERVICE
sleep 3

echo "  Starting $MINIO_SERVICE..."
docker-compose up -d $MINIO_SERVICE
sleep 3

echo "  Starting $MEILI_SERVICE..."
docker-compose up -d $MEILI_SERVICE
sleep 3

echo -e "${GREEN}✅ Infrastructure services started${NC}"
echo ""

# Start backend
echo "  Starting $API_SERVICE (running migrations)..."
docker-compose up -d $API_SERVICE
sleep 8

echo -e "${GREEN}✅ Backend API started${NC}"
echo ""

# Start workers
if [ -n "$RSS_SERVICE" ]; then
    echo "  Starting $RSS_SERVICE..."
    docker-compose up -d $RSS_SERVICE
    sleep 2
fi

if [ -n "$VIDEO_SERVICE" ]; then
    echo "  Starting $VIDEO_SERVICE..."
    docker-compose up -d $VIDEO_SERVICE
    sleep 2
fi

echo -e "${GREEN}✅ Workers started${NC}"
echo ""

# ========================================
# Step 8: Check service health
# ========================================
echo -e "${YELLOW}🔍 Step 8/8: Checking service health...${NC}"
echo ""

echo "📊 Running containers:"
docker-compose ps
echo ""

echo "📋 Service Health Checks:"
echo ""

# Get actual container names
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i "db\|postgres" | head -1)
MINIO_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i "minio" | head -1)
MEILI_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i "meili" | head -1)
API_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i "api\|backend" | head -1)

# Check PostgreSQL
if [ -n "$DB_CONTAINER" ]; then
    echo -n "  PostgreSQL ($DB_CONTAINER): "
    if docker exec $DB_CONTAINER pg_isready > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Not ready${NC}"
    fi
fi

# Check MinIO
if [ -n "$MINIO_CONTAINER" ]; then
    echo -n "  MinIO ($MINIO_CONTAINER): "
    if curl -s -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Not ready${NC}"
    fi
fi

# Check Meilisearch
if [ -n "$MEILI_CONTAINER" ]; then
    echo -n "  Meilisearch ($MEILI_CONTAINER): "
    if curl -s -f http://localhost:7700/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Not ready${NC}"
    fi
fi

# Check Backend
if [ -n "$API_CONTAINER" ]; then
    echo -n "  Backend API ($API_CONTAINER): "
    if curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Not ready yet (may still be starting)${NC}"
    fi
fi

echo ""

# ========================================
# Logs
# ========================================
if [ -n "$API_CONTAINER" ]; then
    echo -e "${YELLOW}📋 Recent Backend Logs:${NC}"
    docker logs --tail 30 $API_CONTAINER 2>&1 | grep -v "health" || echo "No logs yet"
    echo ""
fi

# ========================================
# Summary
# ========================================
echo "🎉 ============================================"
echo "🎉 Rebuild Complete!"
echo "🎉 ============================================"
echo ""
echo "📌 Service URLs:"
echo "  🌐 Backend API:       http://localhost:8080"
echo "  🔍 Meilisearch:       http://localhost:7700"
echo "  📦 MinIO Console:     http://localhost:9001"
echo "  🗄️  PostgreSQL:        localhost:5432"
echo ""
echo "📌 Useful Commands:"
echo "  View all logs:        docker-compose logs -f"
echo "  View API logs:        docker logs -f $API_CONTAINER"
echo "  Stop all:             docker-compose down"
echo ""
echo "🧪 Quick Test:"
echo "  curl http://localhost:8080/health"
echo ""

echo "🎉 ============================================"
echo "🎉 Creating admin user!"
echo "🎉 ============================================"

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