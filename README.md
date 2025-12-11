# 🏟️ GoSport (Proiect Licență)

![Go](https://img.shields.io/badge/Backend-Go-00ADD8?style=flat&logo=go)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat&logo=react)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat&logo=postgresql)
![MinIO](https://img.shields.io/badge/Storage-MinIO-C72C48?style=flat&logo=minio)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED?style=flat&logo=docker)

> **Platformă de conținut sportiv VOD & News**  
> Un serviciu video hibrid (YouTube + Netflix) dedicat sportului, incluzând procesare video HLS, ingestie de știri și recomandări personalizate.

---

## 📖 Despre Proiect

Acest proiect reprezintă lucrarea mea de licență și are ca scop dezvoltarea unui prototip funcțional pentru o platformă de streaming video și agregare de știri sportive. Utilizatorii își pot selecta sporturile preferate, pot urmări creatori de conținut și primesc un feed personalizat de știri și videoclipuri.

Principalele provocări tehnice abordate:
- **Transcodare Video:** Procesare asincronă folosind FFmpeg pentru livrare HLS (Adaptive Bitrate Streaming).
- **Căutare Full-Text:** Indexare rapidă a știrilor folosind Meilisearch.
- **Scalabilitate:** Arhitectură modulară pregătită pentru containerizare.

---

## 🏗️ Arhitectură

Sistemul este construit pe o arhitectură monolitică modulară (cu posibilitate de spargere în microservicii), separând procesarea video (CPU intensive) de API-ul principal.

---

## 🛠️ Tech Stack

| Componentă | Tehnologie | Rol |
|------------|------------|-----|
| **Backend** | Go (Golang) | API REST, Business Logic, Auth (JWT) |
| **Worker** | Go + FFmpeg | Procesare video, generare HLS și Thumbnails |
| **Frontend** | React + hls.js | Interfața utilizator și player video |
| **Database** | PostgreSQL | Stocare persistentă (utilizatori, metadate, feed) |
| **Storage** | MinIO | Object Storage compatibil S3 pentru fișiere video |
| **Search** | Meilisearch | Motor de căutare pentru știri și transcripturi |
| **Metrics** | Prometheus | Monitorizare și observabilitate |

---

## ✨ Funcționalități Cheie (MVP)

### 🎥 Streaming & Video
- **Upload:** Încărcare videoclipuri (Presigned URLs către MinIO).
- **Procesare:** Transcodare automată în format HLS pentru adaptive streaming.
- **Playback:** Player custom bazat pe `hls.js`.
- **Interacțiuni:** Like, Subscribe la creatori.

### 📰 Știri Sportive
- **Ingestie:** Agregare automată din surse externe (RSS/API).
- **Personalizare:** Filtrare știri în funcție de sporturile urmărite de utilizator.
- **Căutare:** Indexare și căutare ultra-rapidă prin articole.

### 🔐 Utilizatori
- Autentificare securizată și management profil.
- Dashboard pentru creatori (gestionare conținut încărcat).

---

## 👤 Autor

**Damian Alexandru**

*Proiect de Licență - 2025/2026*

---
*Acest proiect este destinat scopurilor educaționale.*