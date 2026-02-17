#!/bin/bash

echo "🧹 Complete Docker cleanup..."

# Stop all
docker compose down

# Remove containers
docker rm -f gosport-api 2>/dev/null

# Remove images
docker rmi gosport-backend gosport_backend 2>/dev/null

# Clean build cache
docker builder prune -af

# Clean system
docker system prune -af

echo "🔨 Rebuilding..."

# Rebuild without cache
DOCKER_BUILDKIT=1 docker compose build --no-cache --pull backend

echo "🚀 Starting..."

# Start
docker compose up -d backend

echo "📋 Logs:"

# Show logs
docker logs -f gosport-api