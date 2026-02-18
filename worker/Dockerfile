# Build
FROM golang:1.24-alpine AS builder

# Working directory for source code
WORKDIR /src

# Copy all module files first for caching
COPY pkg/go.mod pkg/go.sum ./pkg/
COPY worker/go.mod worker/go.sum ./worker/

# Download dependencies for pkg
RUN cd pkg && go mod download

# Set working directory to worker
WORKDIR /src/worker

# Download dependencies for worker. Now, the path ../pkg is correct!
RUN go mod download

# Copy the rest of the source code
WORKDIR /src
COPY pkg/ ./pkg/
COPY worker/ ./worker/

# Set working directory back to worker for building
WORKDIR /src/worker
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /worker-app .

# Run
FROM alpine:latest
RUN apk update && apk add --no-cache ffmpeg
WORKDIR /
COPY --from=builder /worker-app .

RUN chmod +x /worker-app

CMD ["./worker-app"]