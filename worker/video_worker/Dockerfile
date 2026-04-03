# Build
FROM golang:1.24-alpine AS builder

# Working directory for source code
WORKDIR /src

# Copy all module files first for caching
COPY pkg/go.mod pkg/go.sum ./pkg/
COPY worker/video_worker/go.mod worker/video_worker/go.sum ./worker/video_worker/

# Download dependencies for pkg
RUN cd pkg && go mod download

# Set working directory to video_worker
WORKDIR /src/worker/video_worker

# Download dependencies for video_worker
RUN go mod download
RUN go mod tidy

# Copy the rest of the source code
WORKDIR /src
COPY pkg/ ./pkg/
COPY worker/video_worker/ ./worker/video_worker/

# Set working directory back to video_worker for building
WORKDIR /src/worker/video_worker
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /video-worker-app .

# Run
FROM alpine:latest
RUN apk update && apk add --no-cache ffmpeg
WORKDIR /
COPY --from=builder /video-worker-app .

RUN chmod +x /video-worker-app

CMD ["./video-worker-app"]