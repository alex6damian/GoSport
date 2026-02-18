package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/alex6damian/GoSport/pkg/config"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
)

// UploadVideo uploads a video file to MinIO
func UploadVideo(file io.Reader, filename string, fileSize int64,
	contentType string) (string, error) {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	// Generate unique filename
	ext := filepath.Ext(filename)
	objectName := fmt.Sprintf("videos/%s%s", uuid.New().String(), ext)

	// Upload file
	_, err := config.MinioClient.PutObject(context.Background(), bucketName, objectName,
		file, fileSize, minio.PutObjectOptions{
			ContentType: contentType,
		})
	if err != nil {
		return "", err
	}

	return objectName, nil
}

// GetVideoURL generates a presigned URL for video access
func GetVideoURL(objectName string, expires time.Duration) (string, error) {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	url, err := config.MinioClient.PresignedGetObject(context.Background(),
		bucketName, objectName, expires, nil)
	if err != nil {
		return "", err
	}

	return url.String(), nil
}

// DeleteVideo removes a video from MinIO
func DeleteVideo(objectName string) error {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	return config.MinioClient.RemoveObject(context.Background(), bucketName,
		objectName, minio.RemoveObjectOptions{})
}

// GetVideoInfo gets object metadata
func GetVideoInfo(objectName string) (*minio.ObjectInfo, error) {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	info, err := config.MinioClient.StatObject(context.Background(),
		bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		return nil, err
	}

	return &info, nil
}
