# 🏟️ GoSport (Bachelor Thesis Project)

![Fiber](https://img.shields.io/badge/Backend-Go-00ADD8?style=flat&logo=go)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat&logo=postgresql)
![MinIO](https://img.shields.io/badge/Storage-MinIO-C72C48?style=flat&logo=minio)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=flat&logo=docker)

> **Sports VOD & News Content Platform**  
> A hybrid video service (YouTube + Netflix–style) dedicated to sports, featuring HLS video processing, news ingestion, and personalized recommendations.

---

## 📖 About the Project

This project represents my bachelor’s thesis and aims to develop a functional prototype for a sports-focused video streaming and news aggregation platform. Users can select their favorite sports, follow content creators, and receive a personalized feed of news and videos.

Main technical challenges addressed:
- **Video Transcoding:** Asynchronous processing using FFmpeg for HLS delivery (Adaptive Bitrate Streaming).
- **Full-Text Search:** Fast news indexing using Meilisearch.
- **Scalability:** Modular architecture designed with containerization in mind.

---

## 🏗️ Architecture

The system is built using a modular monolithic architecture (with the possibility of being split into microservices), separating video processing (CPU-intensive workloads) from the main API.

---

## 🛠️ Tech Stack

| Component | Technology | Role |
|----------|------------|------|
| **Backend** | Go + Fiber | REST API, Business Logic, Auth (JWT) |
| **Worker** | Go + FFmpeg | Video processing, HLS generation, Thumbnails |
| **Frontend** | React + hls.js | User interface and video player |
| **Database** | PostgreSQL | Persistent storage (users, metadata, feed) |
| **Storage** | MinIO | S3-compatible object storage for video files |
| **Search** | Meilisearch | Search engine for news and transcripts |
| **Metrics** | Prometheus | Monitoring and observability |

---

## ✨ Key Features (MVP)

### 🎥 Streaming & Video
- **Upload:** Video uploads using presigned URLs to MinIO.
- **Processing:** Automatic transcoding to HLS format for adaptive streaming.
- **Playback:** Custom video player based on `hls.js`.
- **Interactions:** Likes and subscriptions to content creators.

### 📰 Sports News
- **Ingestion:** Automatic aggregation from external sources (RSS / APIs).
- **Personalization:** News filtering based on user-selected sports.
- **Search:** Ultra-fast article indexing and search.

### 🔐 Users
- Secure authentication and profile management.
- Creator dashboard (uploaded content management).

---

## 👤 Author

**Damian Alexandru**

*Bachelor Thesis Project – 2025/2026*

---
## 🎯 Roadmap

- ### Backend Foundation
- ✅ Docker setup
- ✅ Models & Migrations
- ✅ JWT Authentication     
- ✅ User CRUD
- ✅ API structure

- ### Video Platform
- ✅ MinIO upload
- ✅ FFmpeg processing
- ✅ HLS streaming
- ✅ Video CRUD

- ### Content & Discovery
- ✅ RSS news aggregation
- ✅ Meilisearch integration
- ⬜ Subscriptions
- ⬜ Feed algorithm

- ### Frontend
- ⬜ React setup
- ⬜ Auth UI
- ⬜ Video player
- ⬜ Upload UI
- ⬜ News feed

- ### Polish & Deploy
- ⬜ Testing
- ⬜ Documentation
- ⬜ Deployment (VPS)
- ⬜ Video demo

---

*This project is intended for educational purposes only.*
