from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.rag import DocumentChunk, KnowledgeDocument
from app.rag.cohere_client import CohereRAGClient


def retrieve_relevant_chunks(
    db: Session,
    query: str,
    top_k: int = 5,
    min_similarity: float = 0.35,
    crop_tag: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query_vectors = CohereRAGClient.embed_texts([query.strip()], input_type="search_query")
    if not query_vectors:
        return []
    query_vec = query_vectors[0]

    similarity_expr = (1.0 - DocumentChunk.embedding.cosine_distance(query_vec)).label("similarity")

    sql_query = (
        db.query(DocumentChunk, KnowledgeDocument, similarity_expr)
        .join(KnowledgeDocument, DocumentChunk.document_id == KnowledgeDocument.id)
    )

    if crop_tag and crop_tag.lower() != "all":
        sql_query = sql_query.filter(KnowledgeDocument.crop_tag.in_([crop_tag.lower(), "general"]))

    rows = (
        sql_query.order_by(DocumentChunk.embedding.cosine_distance(query_vec))
        .limit(top_k)
        .all()
    )

    retrieved: List[Dict[str, Any]] = []
    for chunk, doc, sim_score in rows:
        score = round(float(sim_score), 4)
        if score < min_similarity:
            continue
        meta = chunk.chunk_metadata or {}
        retrieved.append(
            {
                "chunk_id": str(chunk.id),
                "document_id": str(doc.id),
                "document_title": doc.title,
                "source_name": doc.source_name,
                "crop_tag": doc.crop_tag,
                "section": meta.get("section", "Reference"),
                "content": chunk.content,
                "similarity": score,
            }
        )

    return retrieved