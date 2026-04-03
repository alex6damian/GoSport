# Build
FROM golang:1.24-alpine AS builder

# Working directory for source code
WORKDIR /src

# Copy all module files first for caching
COPY backend/go.mod backend/go.sum ./backend/
COPY pkg/go.mod pkg/go.sum ./pkg/                
COPY worker/rss_worker/go.mod worker/rss_worker/go.sum ./worker/rss_worker/

# Download dependencies for backend
RUN cd backend && go mod download

# Set working directory to rss_worker
WORKDIR /src/worker/rss_worker

# Download dependencies for rss_worker
RUN go mod download
RUN go mod tidy

# Copy the rest of the source code
WORKDIR /src
COPY backend/ ./backend/
COPY pkg/ ./pkg/                                
COPY worker/rss_worker/ ./worker/rss_worker/

# Set working directory back to rss_worker for building
WORKDIR /src/worker/rss_worker
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /rss-worker-app .

# Run
FROM alpine:latest

# Install ca-certificates for HTTPS requests (RSS feeds)
RUN apk update && apk add --no-cache ca-certificates tzdata

WORKDIR /
COPY --from=builder /rss-worker-app .

RUN chmod +x /rss-worker-app

CMD ["./rss-worker-app"]