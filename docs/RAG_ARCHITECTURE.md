# SmartFarm AI – Cohere RAG & Grounded Assistant Architecture

**Author:** Srishti Anand  
**Embedding Model:** `embed-english-v3.0` (1024-dimensional float vectors)  
**Chat Generation Model:** `command-a-03-2025` (temperature `0.2`)  
**Vector Store:** Supabase PostgreSQL `pgvector` with HNSW index (`vector_cosine_ops`)

## 1. Ingestion Pipeline (`app/rag/ingestion.py`)
1. **Text Extraction (`chunker.py`):** Extracts clean text from `.md`, `.txt`, and `.pdf` guides.
2. **Deduplication:** Computes SHA-256 hash (`file_hash`) to guarantee idempotent startup seeding and prevent duplicate document indexing.
3. **Section-Aware Chunking:** Splits text into ~900-character chunks with 150-character overlap while preserving Markdown section headings in JSONB metadata.
4. **Asymmetric Embedding:** Embeds document chunks using `input_type="search_document"` and stores them atomically with `KnowledgeDocument` parent records.

## 2. Retrieval & Guardrails (`app/rag/retriever.py` & `cohere_client.py`)
1. **Query Embedding:** Embeds incoming farmer queries using `input_type="search_query"`.
2. **Cosine Similarity Search + Threshold Gate:** Retrieves top-5 chunks ordered by cosine distance (`<=>`). Any chunk below `0.35` cosine similarity is discarded; if zero chunks qualify, the assistant bypasses LLM generation and returns a transparent missing-context notice (`retrieval-threshold-guard`).
3. **Prompt Injection Shield:** Retrieved text is enclosed in `<untrusted_retrieved_documents>` tags and treated strictly as passive reference data.
4. **Chemical Safety Guardrail:** System prompt prohibits prescribing pesticide/fungicide dosages or mixing ratios.