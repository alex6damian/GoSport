# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git gcc musl-dev

# Copy go.mod and go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copy all source code
COPY . . 

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Check if exists (debug)
RUN ls -lh /app/main

# Run stage (final image)
FROM alpine:latest

WORKDIR /app

# Install CA certificates
RUN apk --no-cache add ca-certificates

# Copy executable from builder
COPY --from=builder /app/main ./main

# Check if exists
RUN ls -lh ./main && chmod +x ./main

EXPOSE 8080

# Run executable
CMD ["./main"]