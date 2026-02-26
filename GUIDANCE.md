# Backend Structure 📁

## Project Layout
```
backend/                       # 🔐 High-performance backend serving as the core API for the sports streaming platform
│
├── main.go                    # 🚀 Entry point - starts the server, setup routes & middleware
├── go.mod                     # 📦 Go dependencies (package versions)
├── go.sum                     # 🔒 Checksums for dependencies (security)
│
├── middleware/                # 🛡️ HTTP middleware (functions that run before handlers)
│   ├── auth.go                # 🔑 JWT verification (validates token in Authorization header)
│   ├── error_handler.go       # ⚠️ Unexpected server errors handler
│   └── rate_limiter.go        # ✋ Brute-force protection
│
├── routes/                    # 🛣️ HTTP handlers (business logic for endpoints)
│   ├── auth.go                # 🔐 Register & Login handlers (POST /auth/register, /auth/login)
│   ├── users.go               # 👤 User CRUD handlers (GET/PUT /users/me, users/:username, users/:username/videos)
│   └── videos.go              # 🎬 Video CRUD handlers (POST /videos/upload, GET /videos, GET /videos/:id, PUT /videos/:id, DELETE /videos/:id)
│
├── services/                  # 🔧 Business logic services
│   └── video_service.go       # 📹 Video upload/download/delete operations with MinIO
│
└── utils/                     # 🧰 Helper functions (reusable utilities)
    ├── hash.go                # 🔒 Password hashing (bcrypt)
    ├── jwt.go                 # 🎫 JWT token generation & validation
    ├── pagination.go          # 📄 Pagination helper
    ├── query.go               # 🔍 Query parsing utilities
    ├── response.go            # 📤 Standardized API responses
    └── validator.go           # ✅ Input validation

frontend/                      # 🚧 In progress..

pkg/                           # 📦 Shared packages (used by backend + workers)
│
├── go.mod                     # 📦 Shared dependencies
├── go.sum                     # 🔒 Shared checksums
├── config/                    # ⚙️ Application configuration
│   ├── cors.go                # 📌 Enhanced CORS configuration
│   └── minio.go               # 🗄️ MinIO client initialization & bucket setup
│
├── database/
│   └── db.go                  # 🗄️ PostgreSQL connection + GORM setup + AutoMigrate tables
│
└── models/                    # 📊 Database models (Go structs = SQL tables)
    ├── comment.go             # 💬 Comment Model (user, video, content)
    ├── newsarticle.go         # 📰 NewsArticle Model (title, content, sport, source)
    ├── processing_job.go      # 🛠 Video Worker Job Model (id, status, logs)
    ├── rss_feed.go            # 📰 RSS Feed Model (url, sport, language)
    ├── subscription.go        # 🔔 Subscription Model (subscriber_id, creator_id) 
    ├── user.go                # 👤 User Model (id, username, email, password, role, avatar)
    └── video.go               # 🎥 Video Model (title, description, sport, minio_key, file_size, status, views, likes)


worker/                        # ⚙️ Background workers (independent processes)
│
├── rss_worker/                # 📰 RSS Feed Worker
│   ├── main.go                # 🔄 RSS sync worker - fetches news every 30 minutes
│   ├── Dockerfile             # 🐳 Container for RSS worker
│   ├── go.mod                 # 📦 Worker dependencies
│   └── go.sum                 # 🔒 Worker checksums
│
└── video_worker/              # 🎬 Video Processing Worker
    ├── main.go                # 🎞️ Video transcoding worker - converts videos to HLS
    ├── Dockerfile             # 🐳 Container for video worker (includes FFmpeg)
    ├── go.mod                 # 📦 Worker dependencies
    └── go.sum                 # 🔒 Worker checksums
```

## Module Descriptions

### 🚀 Entry Point
- **main.go** - Application starting point, configures HTTP server, initializes routes and middleware

### 📦 Dependencies
- **go.mod** - Defines the module and project dependencies
- **go.sum** - Cryptographic checksums for package integrity verification



## 🎯 Backend API (backend/)

### 🛡️ Middleware (backend/middleware/)
Intermediate functions for request processing:
- **auth.go** - JWT verification for protected endpoints (AuthMiddleware, AdminOnly)
- **error_handler.go** - Global error handling and formatting
- **rate_limiter.go** - Rate limiting to prevent abuse


### 🛣️ Routes (backend/routes/)
Controllers for API endpoints:
- **auth.go** - Authentication (register, login)
- **users.go** - User CRUD (view/edit profile, check videos/profiles)
- **videos.go** - Video management (upload, list, get details with presigned URLs, update, delete)
- **admin_feeds.go** - RSS feed management (admin only: create, list, update, delete, sync)

### 🔧 Services (backend/services/)
Business logic layer:
- **video_service.go** - MinIO integration for video storage operations
- **rss_service.go** - RSS feed fetching, parsing, and article extraction

### 🧰 Utils (backend/utils/)
Reusable helper functions:
- **hash.go** - Secure password hashing (bcrypt)
- **jwt.go** - JWT token generation and validation
- **response.go** - Uniform API response formatting
- **validator.go** - Input validation (email, password, etc.)
- **pagination.go** - Pagination metadata generation
- **query.go** - Query parameter parsing and validation



## 📦 Shared Packages (pkg/)

### ⚙️ Configuration (pkg/config/)
- **cors.go** - Cross-Origin Resource Sharing configuration for API access
- **minio.go** - MinIO object storage client initialization and bucket management

### 🗄️ Database (pkg/database/)
- **db.go** - Manages PostgreSQL connection using GORM, configures AutoMigrate for tables

### 📊 Models (pkg/models/)
Go structs that map to database tables:
- **user.go** - Users (authentication, roles, profile)
- **video.go** - Video content (metadata, MinIO storage keys, file info, statistics, HLS support)
- **processing_job.go** - Video processing jobs (status tracking, progress, error logs)
- **comment.go** - User comments on videos
- **newsarticle.go** - Sports news articles from RSS feeds
- **rss_feed.go** - RSS feed sources (URL, sport category, language, sync status)
- **subscription.go** - Subscription relationships between users



## ⚙️ Background Workers (worker/)

### 📰 RSS Worker (worker/rss_worker/)
**Purpose:** Automatically fetches sports news from RSS feeds

**How it works:**
1. Runs as independent Docker container
2. Connects to same PostgreSQL database as backend
3. Every 30 minutes:
   - Fetches all active RSS feeds from database
   - Parses XML feed content
   - Extracts articles (title, description, link, published date)
   - Stores new articles in `news_articles` table
   - Updates `last_sync` timestamp on RSS feed

### 🎬 Video Worker (worker/video_worker/)
**Purpose:** Converts uploaded videos to HLS format for adaptive streaming

**How it works:**
1. Runs as independent Docker container with FFmpeg installed
2. Monitors processing_jobs table for new jobs (status = pending)
3. When job found:
    - Downloads original video from MinIO
    - Transcodes to multiple resolutions (1080p, 720p, 480p, 360p)
    - Generates HLS playlist (.m3u8) and segments (.ts)
    - Uploads processed files back to MinIO
    - Updates video status = processed and hls_support = true
    - Updates job status = completed or failed



## 🔄 System Architecture
```
            ┌─────────────┐
            │   Client    │
            └──────┬──────┘
                   │ HTTP Requests
                   ▼
┌─────────────────────────────────────────┐
│          Backend API (Fiber)            │
│  - Authentication & Authorization       │
│  - Video Upload (raw file → MinIO)      │
│  - RSS Feed Management (admin)          │
│  - News API (public)                    │
└──┬─────────────────────────────┬────────┘
   │                             │                 
   ▼                             ▼               
┌──────────┐                ┌──────────┐   
│PostgreSQL│                │  MinIO   │    
│ Database │                │ (S3-like)│    
└─────┬────┘                └──────────┘    
      │
      │ Shared Database
      │
   ┌──┴───────────────────────┐
   │                          │
   ▼                          ▼
┌─────────────┐      ┌─────────────┐
│ RSS Worker  │      │Video Worker │
│ (Cron: 30m) │      │ (Poll: 10s) │
│             │      │             │
│ - Fetch RSS │      │ - FFmpeg    │
│ - Parse XML │      │ - HLS trans │
│ - Store news│      │ - Upload    │
└─────────────┘      └─────────────┘
```

## 📊 API Endpoints Overview

### 🔐 Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### 👤 Users
- `GET /api/v1/users/me` - Get current user profile (auth required)
- `PUT /api/v1/users/me` - Update profile (auth required)
- `GET /api/v1/users/:username` - Get public user profile
- `GET /api/v1/users/:username/videos` - Get user's videos

### 🎬 Videos
- `POST /api/v1/videos/upload` - Upload video (auth required)
- `GET /api/v1/videos` - List videos (paginated, filterable)
- `GET /api/v1/videos/:id` - Get video details + presigned URL
- `PUT /api/v1/videos/:id` - Update video metadata (auth required)
- `DELETE /api/v1/videos/:id` - Delete video (auth required)

### 📰 News (Public)
- `GET /api/v1/news` - List news articles (paginated)
- `GET /api/v1/news/:id` - Get single article
- `GET /api/v1/news/sport/:sport` - Get news articles(filter by sport)

### 🛡️ Admin (Admin Only)
- `POST /api/v1/admin/feeds` - Create RSS feed
- `GET /api/v1/admin/feeds` - List all feeds
- `PUT /api/v1/admin/feeds/:id` - Update feed
- `DELETE /api/v1/admin/feeds/:id` - Delete feed
- `POST /api/v1/admin/feeds/:id/sync` - Sync specific feed
- `POST /api/v1/admin/feeds/sync-all` - Sync all active feeds


## Getting Started
```bash
# Clean build
./testing\ scripts/video_upload_test.sh 
```