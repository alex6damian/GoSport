package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/mmcdole/gofeed"
	"gorm.io/gorm"

	"github.com/alex6damian/GoSport/pkg/models"
)

type RSSService struct {
	DB     *gorm.DB
	Parser *gofeed.Parser
}

func NewRSSService(db *gorm.DB) *RSSService {
	return &RSSService{
		DB:     db,
		Parser: gofeed.NewParser(),
	}
}

// Fetches articles from a feed and stores them in the database
func (s *RSSService) FetchAndStore(feedID uint) error {
	// Get feed config
	var feed models.RSSFeed
	if err := s.DB.First(&feed, feedID).Error; err != nil {
		return fmt.Errorf("feed not found: %w", err)
	}

	if !feed.Active {
		return fmt.Errorf("feed is not active")
	}

	log.Printf("Syncing feed: %s (%s)", feed.Name, feed.URL)

	// Parse RSS feed
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rssFeed, err := s.Parser.ParseURLWithContext(feed.URL, ctx)
	if err != nil {
		s.DB.Model(&feed).Updates(map[string]interface{}{
			"last_error": err.Error(),
			"last_sync":  time.Now(),
		})
		return fmt.Errorf("failed to parse feed: %w", err)
	}

	// Process articles
	newArticles := 0
	for _, item := range rssFeed.Items {
		article := s.convertToArticle(item, &feed)

		// Check if article exists
		var existing models.NewsArticle
		err := s.DB.Where("source_url = ?", article.SourceURL).First(&existing).Error
		if err == nil {
			continue // Article already exists, skip
		}

		// Save new article
		if err := s.DB.Create(&article).Error; err != nil {
			log.Printf("Failed to save article: %v", err)
			continue
		}

		newArticles++
	}

	// Update feed metadata
	s.DB.Model(&feed).Updates(map[string]interface{}{
		"last_sync":     time.Now(),
		"last_error":    "",
		"article_count": gorm.Expr("article_count + ?", newArticles),
	})

	log.Printf("Finished syncing feed: %s, new articles: %d", feed.Name, newArticles)
	return nil
}

func (s *RSSService) convertToArticle(item *gofeed.Item, feed *models.RSSFeed) models.NewsArticle {

	publishedAt := time.Now()
	if item.PublishedParsed != nil {
		publishedAt = *item.PublishedParsed
	}

	// Extract image URL from media content or enclosures
	imageURL := ""
	if item.Image != nil {
		imageURL = item.Image.URL
	} else if item.Enclosures != nil && len(item.Enclosures) > 0 {
		imageURL = item.Enclosures[0].URL
	}

	// Extract author
	author := ""
	if item.Author != nil {
		author = item.Author.Name
	}

	// Get content or description
	content := item.Content
	if content == "" {
		content = item.Description
	}

	// Generate summary (first 200 chars of content)
	summary := content
	if len(content) > 200 {
		summary = content[:200] + "..."
	}
	summary = stripHTML(summary)

	return models.NewsArticle{
		Title:       item.Title,
		Content:     content,
		Summary:     summary,
		Sport:       feed.Sport,
		Source:      feed.Name,
		SourceURL:   item.Link,
		ImageURL:    imageURL,
		Author:      author,
		PublishedAt: publishedAt,
	}
}

// Syncs all active feeds
func (s *RSSService) SyncAllFeeds() error {
	var feeds []models.RSSFeed
	if err := s.DB.Where("active = ?", true).Find(&feeds).Error; err != nil {
		return err
	}

	log.Printf("Starting sync for %d feeds", len(feeds))

	for _, feed := range feeds {
		if err := s.FetchAndStore(feed.ID); err != nil {
			log.Printf("Error syncing feed %s: %v", feed.Name, err)
		}
		// Smal delay between feeds
		time.Sleep(2 * time.Second)
	}

	return nil
}

// stripHTML removes HTML tags (basic)
func stripHTML(s string) string {
	s = strings.ReplaceAll(s, "<p>", "")
	s = strings.ReplaceAll(s, "</p>", " ")
	s = strings.ReplaceAll(s, "<br>", " ")
	s = strings.ReplaceAll(s, "<br/>", " ")
	// Add more as needed
	return strings.TrimSpace(s)
}
