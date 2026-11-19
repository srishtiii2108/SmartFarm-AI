from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class TopPredictionItem(BaseModel):
    raw_class: str
    label: str
    crop_category: str
    is_healthy: bool
    confidence: float


class DiseaseMetadataResponse(BaseModel):
    pathogen: str
    symptoms: str
    recommended_actions: List[str]


class PredictionResponse(BaseModel):
    id: UUID
    crop_id: Optional[UUID]
    crop_name: Optional[str] = None
    image_url: str
    image_hash: str
    predicted_label: str
    is_healthy: bool
    confidence_score: float
    low_confidence_warning: bool = False
    top_predictions: List[Dict[str, Any]]
    disease_info: Optional[DiseaseMetadataResponse] = None
    model_version: str
    dataset_limitation_notice: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)