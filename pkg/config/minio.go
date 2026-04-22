package config

import (
	"context"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client
var MinioPublicClient *minio.Client

// Initialize MinIO client and creates bucket if needed
func InitMinio() error {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")

	// SSL = Secure Socket Layer(HTTPS encryption), false for development, true for production with HTTPS
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"

	// Initialize MinIO client (internal — used for uploads and bucket ops)
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return err
	}

	MinioClient = client
	log.Println("Connected to MinIO")

	// Initialize a second client with the public endpoint so presigned URLs
	// are signed with the host the browser will actually use.
	// Region is set explicitly to avoid a GetBucketLocation network request
	// at presign time (which would fail since localhost:9000 is unreachable
	// from inside the Docker container).
	publicEndpoint := os.Getenv("MINIO_PUBLIC_ENDPOINT")
	if publicEndpoint == "" {
		publicEndpoint = endpoint
	}
	publicClient, err := minio.New(publicEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: "us-east-1",
	})
	if err != nil {
		return err
	}
	MinioPublicClient = publicClient

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
