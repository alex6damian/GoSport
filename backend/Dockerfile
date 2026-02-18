# Build
FROM golang:1.24-alpine AS builder

# Working directory for source code
WORKDIR /src

# Copy all module files first for caching
COPY pkg/go.mod pkg/go.sum ./pkg/
COPY backend/go.mod backend/go.sum ./backend/

# Download dependencies for pkg
RUN cd pkg && go mod download

# Set working directory to backend
WORKDIR /src/backend

# Download dependencies for backend. Now, the path ../pkg is correct!
RUN go mod download

# Copy the rest of the source code
WORKDIR /src
COPY pkg/ ./pkg/
COPY backend/ ./backend/

# Set working directory back to backend for building
WORKDIR /src/backend
RUN CGO_ENABLED=0 GOOS=linux go build -o /backend-app .

# Run
FROM alpine:latest
WORKDIR /
COPY --from=builder /backend-app .
EXPOSE 8080

RUN chmod +x /backend-app

CMD ["./backend-app"]