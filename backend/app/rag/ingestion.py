import logging
from pathlib import Path
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.rag import DocumentChunk, KnowledgeDocument
from app.rag.chunker import chunk_document_text, clean_text, compute_sha256, extract_text_from_file
from app.rag.cohere_client import CohereRAGClient

logger = logging.getLogger("smartfarm.rag.ingestion")


def ingest_text_document(
    db: Session,
    title: str,
    source_name: str,
    raw_text: str,
    crop_tag: Optional[str] = "general",
) -> Dict[str, object]:
    cleaned = clean_text(raw_text)
    if not cleaned:
        return {"status": "skipped_empty", "title": title}

    doc_hash = compute_sha256(cleaned)
    existing = db.query(KnowledgeDocument).filter(KnowledgeDocument.file_hash == doc_hash).first()
    if existing:
        return {
            "status": "already_exists",
            "document_id": str(existing.id),
            "title": existing.title,
            "total_chunks": existing.total_chunks,
        }

    chunks = chunk_document_text(cleaned, chunk_size=900, chunk_overlap=150)
    if not chunks:
        return {"status": "skipped_no_chunks", "title": title}

    chunk_texts = [c["content"] for c in chunks]
    embeddings = CohereRAGClient.embed_texts(chunk_texts, input_type="search_document")

    doc_record = KnowledgeDocument(
        title=title.strip(),
        source_name=source_name.strip(),
        crop_tag=crop_tag.strip().lower() if crop_tag else "general",
        file_hash=doc_hash,
        total_chunks=len(chunks),
    )
    db.add(doc_record)
    db.flush()  # Assign doc_record.id before inserting chunks

    for chunk_data, vector in zip(chunks, embeddings):
        db.add(
            DocumentChunk(
                document_id=doc_record.id,
                chunk_index=chunk_data["chunk_index"],
                content=chunk_data["content"],
                chunk_metadata=chunk_data["metadata"],
                embedding=vector,
            )
        )

    db.commit()
    db.refresh(doc_record)
    logger.info(f"Ingested knowledge document '{doc_record.title}' ({doc_record.total_chunks} chunks).")
    return {
        "status": "ingested",
        "document_id": str(doc_record.id),
        "title": doc_record.title,
        "total_chunks": doc_record.total_chunks,
    }


def seed_default_knowledge_base(db: Session) -> List[Dict[str, object]]:
    settings = get_settings()
    if not settings.COHERE_API_KEY.strip():
        logger.warning("COHERE_API_KEY not configured; skipping default knowledge base seeding.")
        return []

    kb_dir = Path(__file__).resolve().parents[2] / "knowledge_base"
    if not kb_dir.exists():
        logger.warning(f"Knowledge base directory not found at {kb_dir}")
        return []

    tag_map = {
        "tomato": "tomato",
        "potato": "potato",
        "bell_pepper": "bell_pepper",
    }

    results = []
    for file_path in sorted(kb_dir.glob("*.*")):
        if file_path.suffix.lower() not in {".md", ".txt", ".pdf"}:
            continue
        raw_text = extract_text_from_file(file_path)
        first_line = next((line.lstrip("#").strip() for line in raw_text.splitlines() if line.strip()), file_path.stem)
        crop_tag = "general"
        for key, tag in tag_map.items():
            if key in file_path.stem.lower():
                crop_tag = tag
                break

        res = ingest_text_document(
            db=db,
            title=first_line[:250],
            source_name=file_path.name,
            raw_text=raw_text,
            crop_tag=crop_tag,
        )
        results.append(res)
    return results