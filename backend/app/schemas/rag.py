from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1500, examples=["What are the symptoms of Early Blight in tomatoes and how can I prevent it?"])
    session_id: Optional[UUID] = None
    crop_filter: Optional[str] = Field(None, description="Optional crop filter: tomato, potato, bell_pepper, all")


class CitationItem(BaseModel):
    document_id: str
    document_title: str
    source_name: str
    section: str
    chunk_id: str
    similarity_score: float


class ChatResponse(BaseModel):
    session_id: UUID
    user_message: str
    assistant_reply: str
    grounded: bool
    citations: List[CitationItem]
    model_used: str
    created_at: datetime


class ChatHistoryItem(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    message: str
    citations: Optional[List[dict]] = None
    model_used: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeDocumentResponse(BaseModel):
    id: UUID
    title: str
    source_name: str
    crop_tag: Optional[str]
    total_chunks: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)