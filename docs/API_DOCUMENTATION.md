# SmartFarm AI – REST API Specification (`/api/v1`)

**Author:** Srishti Anand  
**Base URL (Local):** `http://127.0.0.1:8000/api/v1`  
**Interactive OpenAPI Docs:** `/docs`

## Endpoints Overview

### System
- `GET /health` – Verifies API status, PostgreSQL connection, Supabase Storage config, Cohere AI config, and MobileNetV2 model load state.

### AI Crop Disease Detection & Prediction History
- `POST /predictions/predict` – Accepts multipart leaf image (`JPEG/PNG/WebP`, max 5 MB) + optional `crop_id`, runs MobileNetV2 inference, uploads image to Supabase Storage, and persists top-3 predictions.
- `GET /predictions` – Paginated, filterable scan history (`crop_id`, `is_healthy`, `search`).
- `GET /predictions/model-info` – Returns genuine held-out test metrics and dataset limitations.

### AI Farming Assistant & Knowledge Base (Cohere RAG)
- `POST /chat` – Embeds query via `embed-english-v3.0`, retrieves top chunks from `pgvector` (`>= 0.35` cosine similarity), and generates cited answers via `command-a-03-2025`.
- `GET /chat/history/{session_id}` – Fetches session conversation turns and citations.
- `GET /knowledge/documents` – Lists indexed agricultural reference documents.
- `POST /knowledge/ingest` – Uploads and indexes `.md`, `.txt`, or `.pdf` documents with SHA-256 deduplication.

### Weather & Environmental Risk Intelligence
- `GET /weather/locations?query=...` – Geocodes city/village coordinates via Open-Meteo.
- `POST /weather/sync` – Fetches current, 3-day historical, and 7-day forecast weather with 30-minute DB read-through cache.
- `GET /weather/history` – Paginated stored weather snapshots.
- `GET /weather/risk-analysis` – Combines observed telemetry with transparent heuristic risk rules.

### Farm Operations (Crops & Produce Inventory)
- `POST /crops`, `GET /crops`, `GET /crops/{id}`, `PATCH /crops/{id}`, `DELETE /crops/{id}`
- `POST /inventory`, `GET /inventory`, `PATCH /inventory/{id}`, `DELETE /inventory/{id}`

### Analytics & Reports
- `GET /analytics/dashboard` – Live SQL-aggregated KPIs, disease distribution, prediction trends, and recent detections.
- `GET /analytics/reports` – Detailed cross-module statistics across crops, inventory, scans, and weather.
- `GET /analytics/export/{dataset_type}` – Streams downloadable CSV (`predictions`, `crops`, `inventory`, `weather`).