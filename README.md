<h1 align="center">SmartFarm AI</h1>

<p align="center">
  <b>AI-Powered Agriculture Intelligence &amp; Farm Management Platform</b><br/>
  Crop disease detection &nbsp;|&nbsp; RAG-based farming assistant &nbsp;|&nbsp; Weather risk intelligence &nbsp;|&nbsp; Live farm analytics
</p>

<p align="center">
  Developed by <a href="https://github.com/srishtiii2108"><b>Srishti Anand</b></a>
</p>

<p align="center">
  <a href="https://smart-farm-ai-three.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/></a>
  <a href="https://smartfarm-ai-babp.onrender.com/docs"><img src="https://img.shields.io/badge/API_Docs-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="API Docs"/></a>
  <a href="https://smartfarm-ai-babp.onrender.com/api/v1/health"><img src="https://img.shields.io/badge/Health-Check-1F5C3A?style=for-the-badge" alt="Health Check"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/pgvector-HNSW-336791?style=flat-square" alt="pgvector"/>
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/TensorFlow-2.18-FF6F00?style=flat-square&logo=tensorflow&logoColor=white" alt="TensorFlow"/>
  <img src="https://img.shields.io/badge/Cohere-RAG-39594D?style=flat-square" alt="Cohere"/>
  <img src="https://img.shields.io/badge/Auth-JWT_+_bcrypt-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
</p>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Live Deployment](#live-deployment)
4. [System Architecture](#system-architecture)
5. [Tech Stack](#tech-stack)
6. [AI and ML Details](#ai-and-ml-details)
7. [Database Design](#database-design)
8. [Security and Reliability](#security-and-reliability)
9. [API Reference](#api-reference)
10. [Project Structure](#project-structure)
11. [Getting Started](#getting-started)
12. [Deployment Guide](#deployment-guide)
13. [Engineering Principles](#engineering-principles)
14. [Known Limitations](#known-limitations)
15. [Roadmap](#roadmap)
16. [Author](#author)

---

## Overview

**SmartFarm AI** is a full-stack, multi-tenant platform that helps growers of **Tomato, Potato and Bell Pepper** make faster, better-informed crop decisions. Each farmer gets a private workspace where they can:

- **Scan a leaf photo** and receive a disease prediction with top-3 classes, confidence, symptoms and prevention steps.
- **Ask an AI farming assistant** that answers only from verified agronomy guides (RAG) and cites its sources.
- **Check weather-driven risk alerts** built from real Open-Meteo data and transparent agronomic rules.
- **Manage crops and harvested produce** with full CRUD, filters and pagination.
- **View live analytics** and export CSV reports. Every metric is computed from PostgreSQL, never mocked.

> **Design philosophy:** grounded AI, honest AI, separated facts. The assistant refuses to answer when evidence is missing, low-confidence scans are flagged, and observed data (weather, scans) is always kept apart from AI and heuristic interpretation.

<div align="center">

| 15 | 22,787 | 80.37% | 27 | 8 | 11 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| Disease classes | Training images | Held-out test accuracy | REST endpoints | Database tables | Frontend pages |

</div>

---

## Key Features

<table>
<tr>
<td width="50%" valign="top">

### AI Disease Detection
- MobileNetV2 transfer-learning classifier (15 classes)
- Top-3 predictions with confidence scores
- Automatic low-confidence warning below 0.60
- Disease information: pathogen, symptoms, prevention
- Leaf images stored in Supabase Storage with a SHA-256 hash
- Searchable, filterable scan history

</td>
<td width="50%" valign="top">

### RAG Farming Assistant
- Cohere `embed-english-v3.0` (1024-d) and `command-a-03-2025`
- pgvector HNSW cosine search, top-5 chunks
- Similarity gate (>= 0.35): no evidence means no LLM call
- Source citations with document, section and score
- Prompt-injection shield and no pesticide-dosage rule
- Upload your own `.md`, `.txt` or `.pdf` guides (SHA-256 de-duplicated)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Weather and Risk Intelligence
- Open-Meteo geocoding, 3 past days and 7-day forecast
- 30-minute database read-through cache
- 5 rule-based risk indicators (fungal, bacterial, heat, chilling, waterlogging)
- Observed telemetry kept separate from heuristic advisories

</td>
<td width="50%" valign="top">

### Farm Operations and Analytics
- Crop lifecycle and produce inventory management
- Live dashboard: KPIs, disease distribution, daily trends
- Cross-module reports with SQL aggregations
- CSV export for predictions, crops, inventory and weather

</td>
</tr>
<tr>
<td colspan="2" valign="top">

### Multi-Tenant Security
JWT authentication, bcrypt password hashing, strong password policy, per-farmer data isolation on every query, rate limiting, CORS allow-list, request-ID tracing and a uniform error envelope.

</td>
</tr>
</table>

---

## Live Deployment

| Service | Platform | Link |
|---|---|---|
| Frontend (React SPA) | Vercel | https://smart-farm-ai-three.vercel.app |
| Backend API (FastAPI) | Render | https://smartfarm-ai-babp.onrender.com |
| Interactive API docs | Swagger UI | https://smartfarm-ai-babp.onrender.com/docs |
| Health endpoint | JSON | https://smartfarm-ai-babp.onrender.com/api/v1/health |

> **Note:** if the backend instance has been idle, the first request can take a little while to wake up. The frontend shows a hint when this happens.

---

## System Architecture

**Style:** modular monolith. One FastAPI service split into clear modules, with offline ML training kept separate from online inference.

```text
+------------------------------------------------------------------+
|  CLIENT        React 19 + Vite single-page app   (Vercel)        |
|                Axios client, JWT sent as Bearer token            |
+---------------------------------+--------------------------------+
                                  | HTTPS
+---------------------------------v--------------------------------+
|  API LAYER     FastAPI                           (Render)        |
|                Middleware: CORS, Request-ID tracing, rate limit  |
|                Routers:    /api/v1/*  (thin, validate and delegate)|
+---------------------------------+--------------------------------+
                                  |
+---------------------------------v--------------------------------+
|  SERVICE LAYER   Farm  |  Prediction  |  Chat / RAG  |  Analytics |
+--------+------------+-------------+--------------+---------------+
         |            |             |              |
         v            v             v              v
  +------------+ +-----------+ +------------+ +----------------+
  | PostgreSQL | | Supabase  | | MobileNetV2| | External APIs  |
  | + pgvector | | Storage   | | (in-process| | Cohere         |
  | (Supabase) | | leaf-scans| |  inference)| | Open-Meteo     |
  +------------+ +-----------+ +------------+ +----------------+
```

### Request flow: leaf scan

```text
1. React UI    -> POST /predictions/predict  (image + JWT)
2. FastAPI     -> validate file type, size, user and optional crop ownership
3. MobileNetV2 -> resize to 224x224, preprocess, predict
4. FastAPI     -> take top-3 classes, attach disease information
5. Supabase    -> upload verified image to Storage
6. PostgreSQL  -> save prediction row scoped to the current user
7. React UI    <- label, confidence, top-3, disease info, low-confidence flag
```

### Request flow: assistant answer (RAG)

```text
Question
   |
   v
Embed query (search_query)
   |
   v
pgvector cosine search, top-5 chunks
   |
   v
Similarity >= 0.35 ?
   |-- No  --> fixed safe reply, LLM is NOT called
   |
   `-- Yes --> build prompt (rules + last 4 turns + untrusted context)
                  |
                  v
               Cohere command-a-03-2025, temperature 0.2
                  |
                  v
               Answer + citations, saved to chat_history
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS, Axios, Recharts, Lucide Icons |
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2, Uvicorn, httpx, slowapi |
| Database | Supabase PostgreSQL, pgvector (HNSW index) |
| Storage | Supabase Storage (leaf scan images) |
| Computer Vision | TensorFlow / Keras (CPU), MobileNetV2, Pillow, NumPy |
| Generative AI | Cohere `embed-english-v3.0`, Cohere `command-a-03-2025` |
| Weather | Open-Meteo REST API (forecast and geocoding) |
| Security | JWT (PyJWT, HS256), bcrypt, CORS, rate limiting |
| Deployment | Vercel (frontend), Render (backend) |

---

## AI and ML Details

### Plant Disease Classifier

| Item | Detail |
|---|---|
| Architecture | MobileNetV2, ImageNet transfer learning, two-stage fine-tuning |
| Dataset | PlantVillage subset: Tomato (10), Potato (3), Bell Pepper (2) = 15 classes |
| Images | 22,787 total |
| Split | Stratified, seed 42: 70 / 15 / 15 = 15,950 train, 3,418 validation, 3,419 held-out test |
| Augmentation | Random flip, rotation, zoom, contrast (training set only) |
| Input | 224 x 224 RGB with MobileNetV2 preprocessing |
| Artifact | `ml/artifacts/smartfarm_mobilenetv2_v1.keras` (`mobilenetv2-v1.0`) |

**Held-out test performance (3,419 images)**

| Metric | Value |
|---|:---:|
| Accuracy | **80.37%** |
| Macro F1 | 0.7395 |
| Weighted F1 | 0.7923 |
| Macro precision / recall | 0.7987 / 0.7772 |

<details>
<summary><b>Per-class results (click to expand)</b></summary>

<br/>

| Class | Test images | Precision | Recall | F1 |
|---|:---:|:---:|:---:|:---:|
| Tomato Yellow Leaf Curl Virus | 804 | 0.951 | 0.981 | 0.966 |
| Pepper, bell - healthy | 222 | 0.964 | 0.973 | 0.969 |
| Potato - Early blight | 150 | 1.000 | 0.873 | 0.932 |
| Pepper, bell - Bacterial spot | 149 | 0.977 | 0.872 | 0.922 |
| Tomato - healthy | 238 | 0.804 | 0.983 | 0.885 |
| Tomato - Bacterial spot | 319 | 0.908 | 0.806 | 0.854 |
| Potato - Late blight | 150 | 0.919 | 0.760 | 0.832 |
| Potato - healthy | 23 | 0.704 | 0.826 | 0.760 |
| Tomato - Septoria leaf spot | 266 | 0.768 | 0.711 | 0.738 |
| Tomato - Spider mites | 252 | 0.592 | 0.933 | 0.724 |
| Tomato - Leaf Mold | 143 | 0.599 | 0.867 | 0.709 |
| Tomato - Target Spot | 210 | 0.579 | 0.643 | 0.609 |
| Tomato - Late blight | 287 | 0.955 | 0.373 | 0.536 |
| Tomato - Tomato mosaic virus | 56 | 0.325 | 0.964 | 0.486 |
| Tomato - Early blight | 150 | 0.933 | 0.093 | 0.170 |

Full report: [`ml/artifacts/evaluation_report.json`](ml/artifacts/evaluation_report.json) | Confusion matrix: [`ml/artifacts/confusion_matrix.png`](ml/artifacts/confusion_matrix.png)

</details>

> **Transparency first.** Metrics are measured on a separate held-out test set and published through `GET /api/v1/predictions/model-info`. The model was trained on lab-style PlantVillage images (single detached leaves on plain backgrounds), so field photos can score lower. Predictions below 0.60 confidence automatically show an uncertainty warning in the UI.

### RAG Pipeline

<table>
<tr>
<td width="50%" valign="top">

**Ingestion**
1. Extract text (`.md`, `.txt`, `.pdf` via pypdf)
2. Clean and normalise whitespace
3. SHA-256 hash of the text; skip duplicates (idempotent seeding)
4. Section-aware chunking: about 900 characters, 150 overlap, Markdown headings kept as metadata
5. Batch embedding with `input_type="search_document"`
6. Store the document and its 1024-d vectors in one transaction
7. Auto-seed the 4 bundled guides at startup

</td>
<td width="50%" valign="top">

**Retrieval and generation**
1. Embed the question with `input_type="search_query"`
2. HNSW cosine search returns the top-5 chunks (optional crop filter)
3. Threshold gate drops chunks under 0.35 similarity
4. No chunks left: fixed safe reply, LLM not called
5. Context wrapped in `<untrusted_retrieved_documents>` tags
6. Last 4 turns of the session added for continuity
7. Cohere `command-a-03-2025` at temperature 0.2
8. Answer and citations saved in `chat_history`

</td>
</tr>
</table>

| Guardrail | How it works |
|---|---|
| Grounding only | System prompt restricts answers to the retrieved documents |
| Retrieval gate | Weak evidence never reaches the LLM |
| Prompt-injection shield | Retrieved text is treated as passive, untrusted data |
| Chemical safety | Never prescribes pesticide doses, dilutions or spray intervals |
| Honest gaps | If context is missing, the assistant says what is missing |

### Environmental Risk Engine

| Indicator | Trigger | Crops |
|---|---|---|
| Fungal leaf-blight conditions | Humidity >= 80% and 15-26 C | Tomato, Potato |
| Bacterial foliar disease | Humidity >= 75% and 24-32 C | Tomato, Bell Pepper |
| Heat / blossom-drop stress | Temperature >= 35 C | All crops |
| Chilling stress | Temperature <= 8 C | Tomato, Bell Pepper |
| Waterlogging risk | Precipitation >= 15 mm | All crops |

> Rules are transparent agronomic heuristics, not validated epidemiological forecasts. The API response states this explicitly.

---

## Database Design

PostgreSQL (Supabase) with the `pgvector` extension. UUID primary keys, tenant isolation through `user_id`.

| Table | Purpose | Key points |
|---|---|---|
| `users` | Farmer accounts | Unique email, bcrypt hash, active flag |
| `crops` | Crops per farmer | `user_id` FK (CASCADE), category and status indexed |
| `predictions` | Disease scan results | `crop_id` FK **SET NULL**, JSONB top-3, CHECK confidence in [0, 1] |
| `produce_inventory` | Harvested produce | `crop_id` FK **CASCADE**, NUMERIC(10,2) quantity, CHECK quantity >= 0 |
| `weather_records` | Weather snapshots | Raw JSONB payload, composite index on coordinates and time |
| `knowledge_documents` | Indexed guides | Unique SHA-256 `file_hash`, crop tag |
| `document_chunks` | Text chunks and vectors | `VECTOR(1024)`, HNSW index (cosine, m=16, ef_construction=64) |
| `chat_history` | Assistant conversations | Session ID, citations (JSONB), model used |

**Relationships:** one user owns many crops, predictions, inventory items and weather records. One crop has many predictions (SET NULL on delete) and many inventory items (CASCADE on delete). One knowledge document has many chunks (CASCADE on delete).

<details>
<summary><b>Design decisions (click to expand)</b></summary>

<br/>

| Decision | Reason |
|---|---|
| `SET NULL` on `predictions.crop_id` | A scan is a historical record; deleting a crop should not erase it |
| `CASCADE` on `produce_inventory.crop_id` | Inventory only makes sense together with its crop |
| JSONB columns | Flexible payloads: top-3 results, raw weather response, citations, chunk metadata |
| `NUMERIC(10,2)` for quantity | Exact decimals with no floating-point drift |
| `CHECK` constraints | Confidence range and non-negative quantity enforced inside the database |
| HNSW index | Fast approximate search with no training step |
| Unique `file_hash` | Guarantees idempotent knowledge-base ingestion |
| Connection pool (5 plus 10 overflow, pre-ping) | Reuses connections and survives idle drops |

</details>

---

## Security and Reliability

| Area | Implementation |
|---|---|
| Authentication | JWT (HS256, 24 h expiry) enforced through a FastAPI dependency on protected routes |
| Passwords | bcrypt (12 rounds, random salt); 8-72 characters with upper, lower, digit and special character |
| Login hygiene | Same error for wrong email and wrong password; deactivated accounts are blocked |
| Tenant isolation | `user_id` filter on every query; other users' IDs return 404, not 403 |
| Input validation | Pydantic v2 schemas, enums, range checks, file type and size limits (image 5 MB, document 10 MB) |
| Rate limiting | `/chat` 20 per minute, `/predictions/predict` 30 per minute (per IP) |
| CORS | Origin allow-list from environment |
| Error handling | One envelope: `{success, error: {code, message, request_id}}`; unexpected errors never leak internals |
| Observability | Request ID in `X-Request-ID`, structured logs with latency |
| Resilience | Timeouts on external APIs, graceful 502/503/504 mapping, Supabase key validation with REST fallback |
| Configuration | All secrets read from `.env` via pydantic-settings; `.env.example` provided |

---

## API Reference

Base URL: `https://smartfarm-ai-babp.onrender.com/api/v1` | Interactive docs: [`/docs`](https://smartfarm-ai-babp.onrender.com/docs)

<details open>
<summary><b>Auth and system</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| POST | `/auth/register` | Create a farmer account and receive a JWT |
| POST | `/auth/login` | Sign in and receive a JWT |
| GET | `/auth/me` | Current authenticated profile |
| GET | `/health` | API, database, storage, Cohere and model status |

</details>

<details>
<summary><b>Disease detection</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| POST | `/predictions/predict` | Upload a leaf image (JPEG/PNG/WebP, max 5 MB) with optional `crop_id` |
| GET | `/predictions` | Paginated scan history with filters (`crop_id`, `is_healthy`, `search`) |
| GET | `/predictions/model-info` | Held-out test metrics and known limitations |

</details>

<details>
<summary><b>AI assistant and knowledge base</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| POST | `/chat` | Grounded RAG answer with citations |
| GET | `/chat/history/{session_id}` | Conversation turns for a session |
| GET | `/knowledge/documents` | Indexed reference documents |
| POST | `/knowledge/ingest` | Upload and index `.md`, `.txt` or `.pdf` |

</details>

<details>
<summary><b>Weather and risk</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| GET | `/weather/locations?query=` | Geocode a city or village |
| POST | `/weather/sync` | Current, 3 past days and 7-day forecast with 30-minute DB cache |
| GET | `/weather/history` | Stored weather snapshots |
| GET | `/weather/risk-analysis` | Observed telemetry plus rule-based risk indicators |

</details>

<details>
<summary><b>Farm operations and analytics</b></summary>

| Method | Endpoint | Description |
|:---:|---|---|
| POST, GET | `/crops` | Create and list crops (filters and pagination) |
| GET, PATCH, DELETE | `/crops/{id}` | Read, update or delete a crop |
| POST, GET | `/inventory` | Record and list harvested produce |
| PATCH, DELETE | `/inventory/{id}` | Update or delete an inventory entry |
| GET | `/analytics/dashboard` | Live KPIs, distributions, trends and recent detections |
| GET | `/analytics/reports` | Cross-module statistics |
| GET | `/analytics/export/{dataset}` | CSV export: `predictions`, `crops`, `inventory`, `weather` |

</details>

---

## Project Structure

```text
SmartFarm-AI/
|-- backend/
|   |-- app/
|   |   |-- api/v1/        Routers: auth, crops, inventory, predictions, weather, chat, analytics, health
|   |   |-- services/      Business logic (farm, prediction, chat, analytics)
|   |   |-- rag/           Chunker, ingestion, retriever, Cohere client
|   |   |-- ml/            MobileNetV2 predictor and disease metadata
|   |   |-- clients/       Open-Meteo and Supabase Storage clients
|   |   |-- models/        SQLAlchemy models (user, farm, rag)
|   |   |-- schemas/       Pydantic request and response models
|   |   |-- core/          Config, security (JWT, bcrypt), exceptions, logging
|   |   |-- db/            Engine, session, init_db
|   |   `-- main.py        App factory, middleware, lifespan
|   |-- knowledge_base/    Bundled agronomy guides (auto-indexed at startup)
|   |-- scripts/           Migration and maintenance scripts
|   |-- .env.example
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- api/           Axios client with JWT and error interceptors
|   |   |-- context/       AuthContext
|   |   |-- components/    Layout, ProtectedRoute, shared UI
|   |   `-- pages/         Landing, Auth, Dashboard, Scanner, History, Weather, Assistant, Crops, Inventory, Analytics
|   |-- vercel.json        SPA rewrite rules
|   `-- .env.example
|-- ml/
|   `-- artifacts/         Trained model, class map, evaluation report, confusion matrix
`-- docs/                  API, database, ML evaluation and RAG architecture notes
```

---

## Getting Started

### Prerequisites

- Python 3.12 and Node.js 18+
- A Supabase project (PostgreSQL with `pgvector`, plus a Storage bucket named `leaf-scans`)
- A Cohere API key

### 1. Clone

```bash
git clone https://github.com/srishtiii2108/SmartFarm-AI.git
cd SmartFarm-AI
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # fill in your values (see table below)
uvicorn app.main:app --reload
```

API: `http://127.0.0.1:8000` | Docs: `http://127.0.0.1:8000/docs`

On first start the app creates the `vector` extension and all tables, loads the model and indexes the bundled knowledge base.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env               # VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
npm run dev
```

App: `http://localhost:5173`

### Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase secret key (server side only) |
| `SUPABASE_BUCKET` | Storage bucket name (default `leaf-scans`) |
| `COHERE_API_KEY` | Cohere API key for embeddings and chat |
| `COHERE_CHAT_MODEL` | Default `command-a-03-2025` |
| `COHERE_EMBED_MODEL` | Default `embed-english-v3.0` |
| `JWT_SECRET_KEY` | Required in production. Long random secret used to sign tokens |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins for CORS |
| `ML_MODEL_PATH`, `ML_LABELS_PATH`, `ML_MODEL_VERSION` | Model artifact locations and version tag |

Generate a strong secret with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Verify

```bash
curl http://127.0.0.1:8000/api/v1/health
# expect: database "connected", ml_inference "loaded"
```

---

## Deployment Guide

<table>
<tr>
<td width="50%" valign="top">

**Frontend on Vercel**
1. Import the repository and set the root directory to `frontend`
2. Framework preset: Vite
3. Add `VITE_API_BASE_URL=https://smartfarm-ai-babp.onrender.com/api/v1`
4. Deploy. `vercel.json` rewrites all routes to `index.html`, so deep links work

</td>
<td width="50%" valign="top">

**Backend on Render**
1. Create a Web Service with root directory `backend` (Python 3.12.7 pinned in `runtime.txt`)
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the environment variables above and set `ALLOWED_ORIGINS` to the Vercel URL

</td>
</tr>
</table>

---

## Engineering Principles

- **Secrets stay in the environment.** `.env` is never committed; `.env.example` documents every variable.
- **No fake analytics.** Every dashboard number is a live SQL aggregate.
- **Observed is not interpreted.** Weather and scan data are shown separately from AI and heuristic advice.
- **Layered code.** Router, Service, Model or Client, so business logic stays testable.
- **Offline training, online inference.** `ml/` produces artifacts; `backend/` only loads and serves them.
- **Safe-by-default AI.** Grounded answers, a retrieval gate, no chemical dosages and explicit uncertainty.

---

## Known Limitations

- The classifier was trained on PlantVillage lab-style images; real field photos with complex backgrounds may reduce accuracy. Visually similar tomato diseases (Early blight, Late blight, Target Spot, Leaf Mold) are harder to separate.
- Coverage is limited to Tomato, Potato and Bell Pepper.
- The bundled knowledge base is intentionally small (4 guides); answers are only as good as the indexed documents.
- Weather risk indicators are rule-based heuristics, not validated forecasting models.
- SmartFarm AI is decision support and not a replacement for a certified agronomist.

---

## Roadmap

- [ ] Automated test suite (auth, tenant isolation, chunker, risk rules)
- [ ] Alembic database migrations
- [ ] Hybrid retrieval (BM25 and vector) with reranking and query rewriting for follow-up questions
- [ ] RAG evaluation set (hit-rate at k, answer faithfulness)
- [ ] Field-image data, class-imbalance handling and a "not a leaf" detector
- [ ] Per-user chat ownership and role-based knowledge-base management
- [ ] Streaming chat responses
- [ ] More crops and regional-language support

---

## Author

<p align="center">
  <b>Srishti Anand</b><br/>
  Full-Stack and AI Developer
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/srishti-anand-b7a5b12b7/"><img src="https://img.shields.io/badge/LinkedIn-Srishti_Anand-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/srishtiii2108"><img src="https://img.shields.io/badge/GitHub-srishtiii2108-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/></a>
  <a href="https://smart-farm-ai-three.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-SmartFarm_AI-1F5C3A?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"/></a>
</p>

<p align="center"><i>If you found this project useful, please consider giving it a star.</i></p>
