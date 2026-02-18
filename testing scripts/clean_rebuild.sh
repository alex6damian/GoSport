#!/bin/bash

echo "🧹 Complete Docker cleanup..."

# Stop all
docker compose down

# Remove containers
docker rm -f gosport-api gosport-worker 2>/dev/null

# Remove images
docker rmi gosport-backend gosport_backend gosport-worker gosport_worker 2>/dev/null

# Clean build cache
docker builder prune -af

# Clean system
docker system prune -af

echo "🔨 Rebuilding..."

# Rebuild without cache
DOCKER_BUILDKIT=1 docker compose build --no-cache --pull backend worker

echo "🚀 Starting..."

# Start
docker compose up -d backend worker

echo "📋 Logs (backend):"
docker logs -f gosport-api &

echo "📋 Logs (worker):"
docker logs -f gosport-worker