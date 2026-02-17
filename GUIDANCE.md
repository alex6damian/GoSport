# Backend Structure 📁

## Project Layout
```
backend/
│
├── main.go                    # 🚀 Entry point - starts the server, setup routes & middleware
├── go.mod                     # 📦 Go dependencies (package versions)
├── go.sum                     # 🔒 Checksums for dependencies (security)
│
├── config/                    # ⚙️ Application configuration
│   ├── cors.go                # 📌 Enhanced CORS configuration
│   └── minio.go               # 🗄️ MinIO client initialization & bucket setup
│
├── database/
│   └── db.go                  # 🗄️ PostgreSQL connection + GORM setup + AutoMigrate tables
│
├── middleware/                # 🛡️ HTTP middleware (functions that run before handlers)
│   ├── auth.go                # 🔑 JWT verification (validates token in Authorization header)
│   ├── error_handler.go       # ⚠️ Unexpected server errors handler
│   └── rate_limiter.go        # ✋ Brute-force protection
│
├── models/                    # 📊 Database models (Go structs = SQL tables)
│   ├── user.go                # 👤 User Model (id, username, email, password, role, avatar)
│   ├── video.go               # 🎥 Video Model (title, description, sport, minio_key, file_size, status, views, likes)
│   ├── comment.go             # 💬 Comment Model (user, video, content)
│   ├── newsarticle.go         # 📰 NewsArticle Model (title, content, sport, source)
│   └── subscription.go        # 🔔 Subscription Model (subscriber_id, creator_id)
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
```

## Module Descriptions

### 🚀 Entry Point
- **main.go** - Application starting point, configures HTTP server, initializes routes and middleware

### 📦 Dependencies
- **go.mod** - Defines the module and project dependencies
- **go.sum** - Cryptographic checksums for package integrity verification

### 📦 Configuration (/config)
- **cors.go** - Cross-Origin Resource Sharing configuration for API access
- **minio.go** - MinIO object storage client initialization and bucket management

### 🗄️ Database (/database)
- **db.go** - Manages PostgreSQL connection using GORM, configures AutoMigrate for tables

### 📊 Models (/models)
Go structs that map to database tables:
- **user.go** - Users (authentication, roles, profile)
- **video.go** - Video content (metadata, MinIO storage keys, file info, statistics, HLS support)
- **comment.go** - Viewers comments
- **news.go** - Sports news articles
- **subscription.go** - Subscription relationships between users

### 🛣️ Routes (/routes)
Controllers for API endpoints:
- **auth.go** - Authentication (register, login)
- **users.go** - User CRUD (view/edit profile, check videos/profiles)
- **videos.go** - Video management (upload, list, get details with presigned URLs, update, delete)

### 🔧 Services (/services)
Business logic layer:
- **video_service.go** - MinIO integration for video storage operations

### 🛡️ Middleware (/middleware)
Intermediate functions for request processing:
- **auth.go** - JWT verification for protected endpoints
- **error_handler.go** - Global error handling and formatting
- **rate_limiter.go** - Rate limiting to prevent abuse

### 🧰 Utils (/utils)
Reusable helper functions:
- **hash.go** - Secure password hashing (bcrypt)
- **jwt.go** - JWT token generation and validation
- **response.go** - Uniform API response formatting
- **validator.go** - Input validation (username, password, etc.)
- **pagination.go** - Pagination metadata generation
- **query.go** - Query parameter parsing and validation

---

## Getting Started
```bash
# Clean build
./testing\ scripts/video_upload_test.sh 
```