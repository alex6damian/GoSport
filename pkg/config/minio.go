package config

import (
	"context"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client

// Initialize MinIO client and creates bucket if needed
func InitMinio() error {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")

	// SSL = Secure Socket Layer(HTTPS encryption), false for development, true for production with HTTPS
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"

	// Initialize MinIO client
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return err
	}

	MinioClient = client
	log.Println("Connected to MinIO")

	bucketName := os.Getenv("MINIO_BUCKET_NAME")

	exists, err := client.BucketExists(context.Background(), bucketName)
	if err != nil {
		return err
	}

	if !exists {
		err := client.MakeBucket(context.Background(), bucketName,
			minio.MakeBucketOptions{})
		if err != nil {
			return err
		}
		log.Printf("Bucket '%s' created\n", bucketName)
	} else {
		log.Printf("Bucket '%s' already exists\n", bucketName)
	}

	return nil
}
