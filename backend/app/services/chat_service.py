from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID, uuid4
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.models.rag import ChatHistory, KnowledgeDocument
from app.rag.cohere_client import CohereRAGClient
from app.rag.retriever import retrieve_relevant_chunks
from app.schemas.rag import ChatRequest, ChatResponse, CitationItem

INSUFFICIENT_CONTEXT_REPLY = (
    "I could not find verified information in the SmartFarm AI knowledge base to answer that question reliably. "
    "Currently, our indexed guides cover Tomato, Potato, and Bell Pepper diseases (such as Early Blight, Late Blight, "
    "Bacterial Spot, Leaf Mold, Septoria Leaf Spot, and TYLCV), crop rotation, irrigation, and post-harvest storage. "
    "Please try rephrasing your question around these topics or upload relevant reference documentation."
)


class ChatService:
    @staticmethod
    def process_chat_message(db: Session, payload: ChatRequest) -> ChatResponse:
        session_id = payload.session_id or uuid4()

        # Fetch prior turns in this session for conversational context
        prior_turns = (
            db.query(ChatHistory)
            .filter(ChatHistory.session_id == session_id)
            .order_by(asc(ChatHistory.created_at))
            .all()
        )
        history_payload = [{"role": t.role, "message": t.message} for t in prior_turns]

        # Save user message
        user_record = ChatHistory(
            session_id=session_id,
            role="user",
            message=payload.message.strip(),
        )
        db.add(user_record)
        db.flush()

        # Retrieve relevant chunks from pgvector
        retrieved = retrieve_relevant_chunks(
            db=db,
            query=payload.message,
            top_k=5,
            min_similarity=0.35,
            crop_tag=payload.crop_filter,
        )

        if not retrieved:
            assistant_reply = INSUFFICIENT_CONTEXT_REPLY
            model_used = "retrieval-threshold-guard"
            citations_list: List[CitationItem] = []
            grounded = False
        else:
            gen_result = CohereRAGClient.generate_grounded_reply(
                user_question=payload.message.strip(),
                retrieved_chunks=retrieved,
                conversation_history=history_payload,
            )
            assistant_reply = gen_result["answer"]
            model_used = gen_result["model_used"]
            grounded = True
            citations_list = [
                CitationItem(
                    document_id=item["document_id"],
                    document_title=item["document_title"],
                    source_name=item["source_name"],
                    section=item["section"],
                    chunk_id=item["chunk_id"],
                    similarity_score=item["similarity"],
                )
                for item in retrieved
            ]

        assistant_record = ChatHistory(
            session_id=session_id,
            role="assistant",
            message=assistant_reply,
            citations=[c.model_dump() for c in citations_list],
            model_used=model_used,
        )
        db.add(assistant_record)
        db.commit()
        db.refresh(assistant_record)

        return ChatResponse(
            session_id=session_id,
            user_message=payload.message.strip(),
            assistant_reply=assistant_reply,
            grounded=grounded,
            citations=citations_list,
            model_used=model_used,
            created_at=assistant_record.created_at or datetime.now(timezone.utc),
        )

    @staticmethod
    def get_session_history(db: Session, session_id: UUID) -> List[ChatHistory]:
        return (
            db.query(ChatHistory)
            .filter(ChatHistory.session_id == session_id)
            .order_by(asc(ChatHistory.created_at))
            .all()
        )

    @staticmethod
    def list_knowledge_documents(db: Session, limit: int = 50, offset: int = 0) -> Tuple[int, List[KnowledgeDocument]]:
        query = db.query(KnowledgeDocument)
        total = query.count()
        items = query.order_by(desc(KnowledgeDocument.created_at)).offset(offset).limit(limit).all()
        return total, items