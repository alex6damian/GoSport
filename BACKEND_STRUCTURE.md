# Backend Structure 📁

## Project Layout
```
backend/
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
│   ├── videos.go              # 🎬 Video CRUD handlers (POST /videos/upload, GET /videos, GET /videos/:id, PUT /videos/:id, DELETE /videos/:id)
│   └── admin_feeds.go         # 📰 RSS Feed Management (POST/GET/PUT/DELETE /admin/feeds, POST /admin/feeds/sync-all)
│
├── services/                  # 🔧 Business logic services
│   ├── video_service.go       # 📹 Video upload/download/delete operations with MinIO
│   └── rss_service.go         # 📡 RSS feed fetching and article parsing
│
└── utils/                     # 🧰 Helper functions (reusable utilities)
    ├── hash.go                # 🔒 Password hashing (bcrypt)
    │                          #     - HashPassword()
    │                          #     - CheckPassword()
    ├── jwt.go                 # 🎫 JWT token generation & validation
    │                          #     - GenerateToken()
    │                          #     - ValidateToken()
    ├── pagination.go          # 📄 Pagination helper
    │                          #     - ParsePagination()
    │                          #     - CreatePaginationMeta()
    │                          #     - PaginatedResponse()
    ├── query.go               # 🔍 Query parsing utilities
    │                          #     - ParseQueryFilters()
    │                          #     - ValidateSortField()
    │                          #     - BuildOrderClause()
    ├── response.go            # 📤 Standardized API responses
    │                          #     - SuccessResponse()
    │                          #     - ErrorResponse()
    │                          #     - ValidationErrorResponse()
    └── validator.go           # ✅ Input validation
                               #     - IsValidEmail()
                               #     - IsStrongPassword()
                               #     - ValidateStruct()

/worker                        # ⚙️ Background workers (independent processes)
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

/frontend                      # 🚧 In progress..

/pkg                           # 📦 Shared packages (used by backend + workers)
│
├── go.mod                     # 📦 Shared dependencies
├── go.sum                     # 🔒 Shared checksums
│
├── config/                    # ⚙️ Application configuration
│   ├── cors.go                # 📌 Enhanced CORS configuration
│   └── minio.go               # 🗄️ MinIO client initialization & bucket setup
│
├── database/
│   └── db.go                  # 🗄️ PostgreSQL connection + GORM setup + AutoMigrate tables
│
├── models/                    # 📊 Database models (Go structs = SQL tables)
│   ├── comment.go             # 💬 Comment Model (user, video, content)
│   ├── newsarticle.go         # 📰 NewsArticle Model (title, content, sport, source)
│   ├── processing_job.go      # 🛠️ Video Processing Job Model (video_id, status, progress, logs)
│   ├── rss_feed.go            # 📡 RSS Feed Model (name, url, sport, language, active, last_sync)
│   ├── subscription.go        # 🔔 Subscription Model (subscriber_id, creator_id) 
│   ├── user.go                # 👤 User Model (id, username, email, password, role, avatar)
│   └── video.go               # 🎥 Video Model (title, description, sport, minio_key, file_size, status, views, likes, hls_support)
```