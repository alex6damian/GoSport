package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"github.com/alex6damian/GoSport/pkg/config"
	"github.com/alex6damian/GoSport/pkg/database"
	"github.com/alex6damian/GoSport/pkg/models"
	"github.com/minio/minio-go/v7"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Just connect to the database (migrations should already be done by the API service)
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	database.DB = db // Set global DB variable

	// Initialize MinIO client and bucket
	if err := config.InitMinio(); err != nil {
		log.Fatalf("⚠️  WARNING: Failed to initialize MinIO: %v", err)
	}

	log.Println("🚀 Worker started. Looking for jobs...")

	// Worker loop
	for {
		job, err := findAndLockJob(database.DB)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// No pending jobs, sleep and retry
				log.Println("No pending jobs. Waiting...")
				time.Sleep(10 * time.Second)
				continue
			}
			log.Printf("Error finding job: %v. Retrying...", err)
			time.Sleep(10 * time.Second)
			continue
		}

		// Found a job, process it
		log.Printf("Processing job ID %d for video ID %d", job.ID, job.VideoID)

		err = processJob(database.DB, job)
		if err != nil {
			log.Printf("Failed to process job ID %d: %v", job.ID, err)
			UpdateJobStatus(database.DB, job, "failed", err.Error())
			UpdateVideoStatus(database.DB, job.VideoID, "failed")
		} else {
			log.Printf("Successfully processed job ID %d", job.ID)
			UpdateJobStatus(database.DB, job, "completed", "")
			// Video status is updated in processJob
		}
	}
}

// Finds the next pending job and locks it for processing
func findAndLockJob(db *gorm.DB) (*models.ProcessingJob, error) {
	var job models.ProcessingJob

	err := db.Transaction(func(tx *gorm.DB) error {
		// Find "queued" job and lock it
		if err := tx.Set("gorm:query_option", "FOR UPDATE SKIP LOCKED").
			Where("status = ?", "queued").
			First(&job).Error; err != nil {
			return err
		}

		// Update status to "processing"
		job.Status = "processing"
		if err := tx.Save(&job).Error; err != nil {
			return err
		}

		return nil // Commit transaction
	})

	if err != nil {
		return nil, err
	}

	return &job, nil
}

func processJob(db *gorm.DB, job *models.ProcessingJob) error {
	log.Printf("Starting processing for job ID %d...", job.ID)

	// Getting video details from DB (MinioKey)
	var video models.Video
	if err := db.First(&video, job.VideoID).Error; err != nil {
		return fmt.Errorf("failed to fetch video details: %v", err)
	}
	if video.MinioKey == "" {
		return fmt.Errorf("video with ID %d has no MinIO key", video.ID)
	}

	// Creating temporary directory for processing (base temp dir + unique subdir for this job)
	baseTempDir := os.TempDir()
	jobTempDir, err := os.MkdirTemp(baseTempDir, "processing-"+strconv.Itoa(int(job.ID))+"-*")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %v", err)
	}

	// Ensure temp directory is cleaned up after processing
	defer os.RemoveAll(jobTempDir)

	localInputPath := filepath.Join(jobTempDir, video.MinioKey)
	localOutputPath := filepath.Join(jobTempDir, "hls")
	// 0755 is a common permission for directories (rwxr-xr-x)
	if err := os.Mkdir(localOutputPath, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	// Download video from MinIO to local temp directory
	log.Printf("Downloading video from MinIO: %s to %s", video.MinioKey, localInputPath)
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	err = config.MinioClient.FGetObject(context.Background(), bucketName, video.MinioKey, localInputPath, minio.GetObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to download video from MinIO: %v", err)
	}
	log.Println("Download complete. Starting processing...")

	// Run FFmpeg to convert video to HLS format
	log.Println("Starting FFmpeg...")
	hlsMasterPlaylist := "master.m3u8"
	cmd := exec.Command(
		"ffmpeg",
		"-i", localInputPath, // Input file
		"-codec:", "copy", // Copy codecs (no re-encoding for speed)
		"-start_number", "0", // Start segment numbering at 0
		"-hls_time", "10", // Each segment is 10 seconds
		"-hls_list_size", "0", // Include all segments in playlist
		"-f", "hls", // Output format is HLS
		filepath.Join(localOutputPath, hlsMasterPlaylist), // Master playlist output path
	)

	// Catch FFmpeg output for logging
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg failed: %v, output: %s", err, string(output))
	}
	log.Println("FFmpeg processing complete.")

	// Upload HLS output back to MinIO
	log.Println("Uploading HLS files to MinIO...")
	hlsRemotePath := fmt.Sprintf("videos/hls/%d/", video.ID) // e.g., videos/hls/123/

	// Search for all generated HLS files (master playlist + segments)
	files, err := filepath.Glob(filepath.Join(localOutputPath, "*"))
	if err != nil {
		return fmt.Errorf("failed to list HLS output files: %v", err)
	}

	for _, file := range files {
		objectName := hlsRemotePath + filepath.Base(file) // e.g., videos/hls/123/master.m3u8 or videos/hls/123/segment0.ts
		contentType := "application/vnd.apple.mpegurl"    // Default content type for HLS files
		if filepath.Ext(file) == ".ts" {
			contentType = "video/mp2t" // Content type for TS segments
		}

		_, err = config.MinioClient.FPutObject(context.Background(), bucketName, objectName,
			file, minio.PutObjectOptions{ContentType: contentType})
		if err != nil {
			return fmt.Errorf("failed to upload HLS file %s to MinIO: %v", objectName, err)
		}
	}
	log.Println("HLS upload complete")

	// Update video to "ready" status and set HLS path to the master playlist URL
	finalHLSPath := hlsRemotePath + hlsMasterPlaylist // e.g., videos/hls/123/master.m3u8
	return UpdateVideoSuccess(db, job.VideoID, finalHLSPath)
}

func UpdateVideoSuccess(db *gorm.DB, videoID uint, hlsPath string) error {
	return db.Model(&models.Video{}).
		Where("id = ?", videoID).
		Updates(models.Video{
			Status:  "ready",
			HLSPath: hlsPath,
		}).Error
}

// Update job status and logs
func UpdateJobStatus(db *gorm.DB, job *models.ProcessingJob, status string, logs string) {
	job.Status = status
	job.Logs = logs
	db.Save(job)
}

// Update video status
func UpdateVideoStatus(db *gorm.DB, videoID uint, status string) {
	db.Model(&models.Video{}).Where("id = ?", videoID).Update("status", status)
}
