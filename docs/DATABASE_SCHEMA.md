# SmartFarm AI – Database Schema Documentation

**Database Engine:** PostgreSQL (Supabase) + `pgvector` extension  
**Author:** Srishti Anand

## Normalized Tables (7 Core Entities)

1. **`crops`**: Tracks active/harvested farm crops (`id`, `name`, `variety`, `crop_category`, `planting_date`, `expected_harvest_date`, `status`, `location_name`, `latitude`, `longitude`, `notes`, `created_at`, `updated_at`).
2. **`predictions`**: Stores MobileNetV2 disease classification outputs (`id`, `crop_id` FK `SET NULL`, `image_url`, `image_hash`, `predicted_label`, `is_healthy`, `confidence_score`, `top_predictions` JSONB, `model_version`, `created_at`).
3. **`weather_records`**: Persists Open-Meteo current, forecast, and historical snapshots (`id`, `location_name`, `latitude`, `longitude`, `observed_at`, `temperature_c`, `relative_humidity_pct`, `precipitation_mm`, `weather_code`, `weather_description`, `record_type`, `raw_payload` JSONB, `created_at`).
4. **`produce_inventory`**: Tracks harvested produce quantities and lifecycle status (`id`, `crop_id` FK `CASCADE`, `produce_name`, `quantity`, `unit`, `harvest_date`, `status`, `notes`, `created_at`, `updated_at`).
5. **`knowledge_documents`**: Tracks ingested agricultural guides with SHA-256 deduplication (`id`, `title`, `source_name`, `crop_tag`, `file_hash` UNIQUE, `total_chunks`, `created_at`).
6. **`document_chunks`**: Stores text chunks and 1024-d Cohere embeddings indexed with HNSW cosine similarity (`id`, `document_id` FK `CASCADE`, `chunk_index`, `content`, `metadata` JSONB, `embedding` `VECTOR(1024)`, `created_at`).
7. **`chat_history`**: Persists session-scoped RAG conversations and source citations (`id`, `session_id`, `role`, `message`, `citations` JSONB, `model_used`, `created_at`).