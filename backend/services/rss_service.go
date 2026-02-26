// backend/services/rss_service.go
package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/mmcdole/gofeed"
	"gorm.io/gorm"

	"github.com/alex6damian/GoSport/pkg/config"
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

	log.Printf("📡 Syncing feed: %s (%s)", feed.Name, feed.URL)

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
		article := s.ConvertToArticle(item, &feed)

		// Check if article exists
		var existing models.NewsArticle
		err := s.DB.Where("source_url = ?", article.SourceURL).First(&existing).Error

		if err == nil {
			// Article exists - check if content changed
			if existing.Title != article.Title || existing.Content != article.Content {
				// Update existing article
				existing.Title = article.Title
				existing.Content = article.Content
				existing.Summary = article.Summary
				existing.ImageURL = article.ImageURL

				if err := s.DB.Save(&existing).Error; err != nil {
					log.Printf("⚠️ Failed to update article: %v", err)
					continue
				}

				// Update in Meilisearch
				go s.updateArticleInMeilisearch(existing)
				log.Printf("🔄 Updated article: %s", existing.Title)
			}
			continue // Skip to next article
		}

		// Save new article to database
		if err := s.DB.Create(&article).Error; err != nil {
			log.Printf("⚠️ Failed to save article: %v", err)
			continue
		}

		// ✅ Index new article to Meilisearch
		go s.IndexArticleToMeilisearch(article)

		newArticles++
		log.Printf("✅ New article: %s", article.Title)
	}

	// Update feed metadata
	s.DB.Model(&feed).Updates(map[string]interface{}{
		"last_sync":     time.Now(),
		"last_error":    "",
		"article_count": gorm.Expr("article_count + ?", newArticles),
	})

	log.Printf("✅ Finished syncing feed: %s, new articles: %d", feed.Name, newArticles)
	return nil
}

// Converts a gofeed.Item to our NewsArticle model
func (s *RSSService) ConvertToArticle(item *gofeed.Item, feed *models.RSSFeed) models.NewsArticle {
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

	log.Printf("🔄 Starting sync for %d feeds", len(feeds))

	for _, feed := range feeds {
		if err := s.FetchAndStore(feed.ID); err != nil {
			log.Printf("⚠️ Error syncing feed %s: %v", feed.Name, err)
		}
		// Small delay between feeds
		time.Sleep(2 * time.Second)
	}

	log.Println("✅ All feeds synced")
	return nil
}

// Index new article to Meilisearch
func (s *RSSService) IndexArticleToMeilisearch(article models.NewsArticle) {
	if config.MeiliClient == nil {
		log.Println("⚠️ Meilisearch client not initialized")
		return
	}

	documents := []map[string]interface{}{
		{
			"id":           article.ID,
			"title":        article.Title,
			"summary":      article.Summary,
			"content":      article.Content,
			"sport":        article.Sport,
			"source":       article.Source,
			"source_url":   article.SourceURL,
			"image_url":    article.ImageURL,
			"author":       article.Author,
			"published_at": article.PublishedAt.Unix(),
		},
	}

	_, err := config.MeiliClient.Index("news").AddDocuments(documents, nil)
	if err != nil {
		log.Printf("⚠️ Failed to index article %d to Meilisearch: %v", article.ID, err)
	} else {
		log.Printf("🔍 Indexed article %d to Meilisearch", article.ID)
	}
}

// Update existing article in Meilisearch
func (s *RSSService) updateArticleInMeilisearch(article models.NewsArticle) {
	if config.MeiliClient == nil {
		log.Println("⚠️ Meilisearch client not initialized")
		return
	}

	documents := []map[string]interface{}{
		{
			"id":           article.ID,
			"title":        article.Title,
			"summary":      article.Summary,
			"content":      article.Content,
			"sport":        article.Sport,
			"source":       article.Source,
			"source_url":   article.SourceURL,
			"image_url":    article.ImageURL,
			"author":       article.Author,
			"published_at": article.PublishedAt.Unix(),
		},
	}

	_, err := config.MeiliClient.Index("news").UpdateDocuments(documents, nil)
	if err != nil {
		log.Printf("⚠️ Failed to update article %d in Meilisearch: %v", article.ID, err)
	} else {
		log.Printf("🔍 Updated article %d in Meilisearch", article.ID)
	}
}

// stripHTML removes HTML tags (basic)
func stripHTML(s string) string {
	s = strings.ReplaceAll(s, "<p>", "")
	s = strings.ReplaceAll(s, "</p>", " ")
	s = strings.ReplaceAll(s, "<br>", " ")
	s = strings.ReplaceAll(s, "<br/>", " ")
	s = strings.ReplaceAll(s, "<div>", "")
	s = strings.ReplaceAll(s, "</div>", " ")
	s = strings.ReplaceAll(s, "<span>", "")
	s = strings.ReplaceAll(s, "</span>", "")
	// Add more as needed
	return strings.TrimSpace(s)
}
