from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.exceptions import AppException
from app.db.session import get_db
from app.models.user import User
from app.rag.chunker import extract_text_from_bytes
from app.rag.ingestion import ingest_text_document
from app.schemas.rag import ChatHistoryItem, ChatRequest, KnowledgeDocumentResponse
from app.services.chat_service import ChatService

router = APIRouter(tags=["AI Farming Assistant & Knowledge Base"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/chat", summary="Ask the RAG-grounded AI Farming Assistant")
@limiter.limit("20/minute")
def chat_with_assistant(
    request: Request,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = ChatService.process_chat_message(db, payload)
    return {"success": True, "data": result}


@router.get("/chat/history/{session_id}", summary="Retrieve conversation history for a session")
def get_chat_history(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = ChatService.get_session_history(db, session_id)
    return {
        "success": True,
        "session_id": str(session_id),
        "items": [ChatHistoryItem.model_validate(m) for m in messages],
    }


@router.get("/knowledge/documents", summary="List indexed agricultural reference documents")
def list_documents(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, docs = ChatService.list_knowledge_documents(db, limit, offset)
    return {
        "success": True,
        "total": total,
        "items": [KnowledgeDocumentResponse.model_validate(d) for d in docs],
    }


@router.post("/knowledge/ingest", status_code=status.HTTP_201_CREATED, summary="Upload and index a new agricultural guide (.md, .txt, .pdf)")
async def upload_knowledge_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    crop_tag: str = Form("general"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith((".md", ".txt", ".pdf")):
        raise AppException(
            message="Only .md, .txt, and .pdf files are supported for knowledge base ingestion.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="UNSUPPORTED_DOCUMENT_TYPE",
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > 10 * 1024 * 1024:
        raise AppException(
            message="Document size exceeds the 10 MB limit.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="DOCUMENT_TOO_LARGE",
        )

    extracted = extract_text_from_bytes(file.filename, raw_bytes)
    doc_title = title.strip() if title and title.strip() else file.filename

    result = ingest_text_document(
        db=db,
        title=doc_title,
        source_name=file.filename,
        raw_text=extracted,
        crop_tag=crop_tag,
    )
    return {"success": True, "data": result}