# SmartFarm AI – Living Architecture & Context Log
- **Author / Owner:** Srishti Anand
## 1. Project Identity
- **Name:** SmartFarm AI (AI-Powered Agriculture Intelligence & Farm Management Platform)
- **Architecture Style:** Modular Monolith Backend (FastAPI) + Single Page Application Frontend (React + Vite)
- **Database & Vector Store:** Supabase PostgreSQL + pgvector
- **Object Storage:** Supabase Storage (Leaf Scan Images)
- **Generative AI & Embeddings:** Cohere API ONLY (No Gemini models)
- **Weather Telemetry:** Open-Meteo REST API
- **ML Inference:** MobileNetV2 (PlantVillage: Tomato, Potato, Bell Pepper)

## 2. Engineering Rules
- Zero hardcoded credentials; all secrets in backend `.env`.
- Zero fake/mock analytics; all dashboard metrics computed from live PostgreSQL queries.
- Strict separation between *Observed Data* (weather, scan metrics) and *AI/Heuristic Interpretations*.
- Offline ML training (`ml/`) decoupled from online inference (`backend/`).

## 3. Build Progress Tracker
- [x] Step 1: Monorepo initialization (`backend`, `frontend`, `ml`, `docs`)
- [x] Step 2: `.gitignore`, living docs setup, and Python virtual environment
- [x] Step 3: Backend modular folder structure & dependencies installation
- [x] Step 4: Production config, structured logging, global exception handlers & FastAPI `/health` server
- [x] Step 5: Supabase PostgreSQL, `pgvector` extension, Storage bucket & SQLAlchemy database schema
- [x] Step 6: Core Farm Operations APIs (Crop Management, Produce Inventory, Open-Meteo Weather & Environmental Risk)
- [x] Step 7: Cohere-powered RAG Pipeline (`embed-english-v3.0` + `command-a-03-2025`) & Grounded AI Farming Assistant
- [x] Step 8: Computer Vision Plant Disease Detection (MobileNetV2 Training, Real Evaluation & Live `/predict` API)
- [x] Step 9: Live Analytics, Reports & Streaming CSV Export APIs (Backend Complete!)
- [x] Step 10: Frontend SaaS Foundation (React + Vite + Tailwind + Axios + Sidebar Layout)
- [x] Step 11: Smart Dashboard, AI Disease Scanner & Prediction History UI
- [x] Step 12: Weather & Environmental Risk Intelligence + Cohere RAG AI Farming Assistant UI
## 3. Build Progress Tracker
- [x] Step 1: Monorepo initialization (`backend`, `frontend`, `ml`, `docs`)
- [x] Step 2: `.gitignore`, living docs setup, and Python virtual environment
- [x] Step 3: Backend modular folder structure & dependencies installation
- [x] Step 4: Production config, structured logging, global exception handlers & FastAPI `/health` server
- [x] Step 5: Supabase PostgreSQL, `pgvector` extension, Storage bucket & SQLAlchemy database schema
- [x] Step 6: Core Farm Operations APIs (Crop Management, Produce Inventory, Open-Meteo Weather & Environmental Risk)
- [x] Step 7: Cohere-powered RAG Pipeline (`embed-english-v3.0` + `command-a-03-2025`) & Grounded AI Farming Assistant
- [x] Step 8: Computer Vision Plant Disease Detection (MobileNetV2 Training, Real Evaluation & Live `/predict` API)
- [x] Step 9: Live Analytics, Reports & Streaming CSV Export APIs (Backend Complete!)
- [x] Step 10: Frontend SaaS Foundation (React + Vite + Tailwind + Axios + Sidebar Layout)
- [x] Step 11: Smart Dashboard, AI Disease Scanner & Prediction History UI
- [x] Step 12: Weather & Environmental Risk Intelligence + Cohere RAG AI Farming Assistant UI
- [x] Step 13: Crop Management, Produce Inventory & Analytics/CSV Export UI 