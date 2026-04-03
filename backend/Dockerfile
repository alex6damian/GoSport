# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /src

# Copy module files (including pkg if needed)
COPY backend/go.mod backend/go.sum ./backend/
COPY pkg/go.mod pkg/go.sum ./pkg/                    

# Download dependencies for backend
RUN cd backend && go mod download
RUN cd backend && go mod tidy

# Copy source code
COPY backend/ ./backend/
COPY pkg/ ./pkg/                                     

# Build
WORKDIR /src/backend
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /backend-app .

# Run stage
FROM alpine:latest

# Install wget for healthcheck + ca-certificates for HTTPS
RUN apk update && apk add --no-cache ffmpeg wget ca-certificates tzdata

WORKDIR /
COPY --from=builder /backend-app .

RUN chmod +x /backend-app

EXPOSE 8080

CMD ["./backend-app"]