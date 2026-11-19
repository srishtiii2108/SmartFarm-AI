from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.exceptions import AppException
from app.db.session import get_db
from app.ml.predictor import DiseasePredictor
from app.models.user import User
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/predictions", tags=["AI Crop Disease Detection"])
limiter = Limiter(key_func=get_remote_address)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


@router.post("/predict", status_code=status.HTTP_201_CREATED, summary="Upload leaf image for MobileNetV2 disease diagnosis")
@limiter.limit("30/minute")
async def predict_plant_disease(
    request: Request,
    file: UploadFile = File(..., description="Leaf photo (JPEG, PNG, or WebP, max 5MB)"),
    crop_id: Optional[str] = Form(None, description="Optional registered Crop UUID to link this scan"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise AppException(
            message="Unsupported file type. Please upload a JPEG, PNG, or WebP leaf image.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="UNSUPPORTED_IMAGE_TYPE",
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise AppException(
            message="Uploaded image file is empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="EMPTY_IMAGE_FILE",
        )
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise AppException(
            message="Image exceeds maximum allowed size of 5 MB.",
            status_code=status.HTTP_400_BAD_REQUEST,
            code="IMAGE_TOO_LARGE",
        )

    parsed_crop_id: Optional[UUID] = None
    if crop_id and crop_id.strip():
        try:
            parsed_crop_id = UUID(crop_id.strip())
        except ValueError as exc:
            raise AppException(
                message="Invalid crop_id format. Must be a valid UUID.",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_CROP_UUID",
            ) from exc

    result = PredictionService.run_and_store_prediction(
        db=db,
        user_id=current_user.id,
        image_bytes=image_bytes,
        content_type=file.content_type or "image/jpeg",
        original_filename=file.filename or "leaf.jpg",
        crop_id=parsed_crop_id,
    )
    return {"success": True, "data": result}


@router.get("", summary="List prediction history with filters & pagination")
def list_prediction_history(
    crop_id: Optional[UUID] = Query(None),
    is_healthy: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Search by predicted disease label"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, items = PredictionService.list_predictions(
        db, current_user.id, crop_id, is_healthy, search, limit, offset
    )
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items,
    }


@router.get("/model-info", summary="Get trained MobileNetV2 test evaluation metrics & limitations")
def get_model_evaluation_info():
    report = DiseasePredictor.get_evaluation_report()
    return {
        "success": True,
        "model_loaded": DiseasePredictor.is_ready(),
        "evaluation": report,
    }