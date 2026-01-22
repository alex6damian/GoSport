# Backend Structure 📁

## Project Layout
```
backend/
│
├── main.go                    # 🚀 Entry point - starts the server, setup routes & middleware
├── go.mod                     # 📦 Go dependencies (package versions)
├── go.sum                     # 🔒 Checksums for dependencies (security)
│
├── database/
│   └── db.go                  # 🗄️ PostgreSQL connection + GORM setup + AutoMigrate tables
│
├── models/                    # 📊 Database models (Go structs = SQL tables)
│   ├── user.go                # 👤 User Model (id, username, email, password, role)
│   ├── video.go               # 🎥 Video Model (title, minio_key, hls_path, status, views, comments)
|   ├── comment.go             # 💬 Comment Model(user, video, content)
│   ├── newsarticle.go         # 📰 NewsArticle Model (title, content, sport, source)
│   └── subscription.go        # 🔔 Subscription Model (subscriber_id, creator_id)
│
├── routes/                    # 🛣️ HTTP handlers (business logic for endpoints)
│   └── auth.go                # 🔐 Register & Login handlers (POST /auth/register, /auth/login)
│
├── middleware/                # 🛡️ HTTP middleware (functions that run before handlers)
│   └── auth.go                # 🔑 JWT verification (validates token in Authorization header)
│
└── utils/                     # 🧰 Helper functions (reusable utilities)
    ├── hash.go                # 🔒 Password hashing (bcrypt)
    │                          #     - HashPassword()
    │                          #     - CheckPassword()
    ├── jwt.go                 # 🎫 JWT token generation & validation
    │                          #     - GenerateToken()
    │                          #     - ValidateToken()
    ├── response.go            # 📤 Standardized API responses
    │                          #     - SuccessResponse()
    │                          #     - ErrorResponse()
    └── validator.go           # ✅ Input validation
                               #     - IsValidEmail()
                               #     - IsStrongPassword()
```

## Module Descriptions

### 🚀 Entry Point
- **main.go** - Application starting point, configures HTTP server, initializes routes and middleware

### 📦 Dependencies
- **go.mod** - Defines the module and project dependencies
- **go.sum** - Cryptographic checksums for package integrity verification

### 🗄️ Database
- **database/db.go** - Manages PostgreSQL connection using GORM, configures AutoMigrate for tables

### 📊 Models
Go structs that map to database tables:
- **user.go** - Users (authentication, roles)
- **video.go** - Video content (metadata, storage keys, statistics)
- **comment.go** - Viewers comments
- **news.go** - Sports news articles
- **subscription.go** - Subscription relationships between users

### 🛣️ Routes
Controllers for API endpoints:
- **auth.go** - Authentication (register, login)

### 🛡️ Middleware
Intermediate functions for request processing:
- **auth.go** - JWT verification for protected endpoints

### 🧰 Utils
Reusable helper functions:
- **hash.go** - Secure password hashing (bcrypt)
- **jwt.go** - JWT token generation and validation
- **response.go** - Uniform API response formatting
- **validator.go** - Input validation (email, password, etc.)

---

## Getting Started
```bash
# Build Docker containers
docker-compose build

# Start the project
docker-compose up -d
```