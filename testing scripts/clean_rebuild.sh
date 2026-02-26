#!/bin/bash

echo "🧹 Cleaning database and rebuilding..."

# Stop all
docker-compose down

# Remove database volume (CAUTION: Deletes all data!)
docker volume rm gosport_postgres_data

# Remove old images
docker rmi gosport_backend gosport_rss-worker gosport_video-worker 2>/dev/null || true

# Clean build cache
docker builder prune -f

# Rebuild all
docker-compose build --no-cache

# Start database first
docker-compose up -d db
sleep 5

# Start backend (runs migrations)
docker-compose up -d backend

# Wait for migrations
sleep 10

# Check backend logs
echo "📋 Backend migration logs:"
docker logs gosport-api 2>&1 | grep -A5 "migrations"

# Start workers
docker-compose up -d video-worker rss-worker

echo "✅ Done! Check logs:"
echo "docker logs gosport-api"
echo "docker logs gosport-rss-worker"