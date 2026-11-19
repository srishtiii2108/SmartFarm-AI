import hashlib
from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.clients.supabase_storage import SupabaseStorageClient
from app.ml.disease_metadata import get_disease_details
from app.ml.predictor import DiseasePredictor
from app.models.farm import Prediction
from app.schemas.prediction import DiseaseMetadataResponse, PredictionResponse
from app.services.farm_service import FarmService


class PredictionService:
    @staticmethod
    def run_and_store_prediction(
        db: Session,
        user_id: UUID,
        image_bytes: bytes,
        content_type: str,
        original_filename: str,
        crop_id: Optional[UUID] = None,
    ) -> PredictionResponse:
        crop = FarmService.get_crop_or_404(db, crop_id, user_id) if crop_id else None

        # 1. Validate & run MobileNetV2 inference first
        inference_result = DiseasePredictor.predict(image_bytes)

        # 2. Upload verified leaf image to Supabase Storage
        image_url = SupabaseStorageClient.upload_leaf_image(
            file_bytes=image_bytes,
            content_type=content_type,
            original_filename=original_filename,
        )
        image_hash = hashlib.sha256(image_bytes).hexdigest()

        # 3. Persist prediction record scoped to current user
        record = Prediction(
            user_id=user_id,
            crop_id=crop.id if crop else None,
            image_url=image_url,
            image_hash=image_hash,
            predicted_label=inference_result["predicted_label"],
            is_healthy=inference_result["is_healthy"],
            confidence_score=inference_result["confidence_score"],
            top_predictions=inference_result["top_predictions"],
            model_version=inference_result["model_version"],
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return PredictionResponse(
            id=record.id,
            crop_id=record.crop_id,
            crop_name=crop.name if crop else None,
            image_url=record.image_url,
            image_hash=record.image_hash,
            predicted_label=record.predicted_label,
            is_healthy=record.is_healthy,
            confidence_score=record.confidence_score,
            low_confidence_warning=inference_result["low_confidence_warning"],
            top_predictions=record.top_predictions,
            disease_info=DiseaseMetadataResponse(**inference_result["disease_info"]),
            model_version=record.model_version,
            dataset_limitation_notice=inference_result["dataset_limitation_notice"],
            created_at=record.created_at,
        )

    @staticmethod
    def list_predictions(
        db: Session,
        user_id: UUID,
        crop_id: Optional[UUID] = None,
        is_healthy: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[int, list[PredictionResponse]]:
        query = db.query(Prediction).filter(Prediction.user_id == user_id)
        if crop_id:
            query = query.filter(Prediction.crop_id == crop_id)
        if is_healthy is not None:
            query = query.filter(Prediction.is_healthy == is_healthy)
        if search:
            query = query.filter(Prediction.predicted_label.ilike(f"%{search.strip()}%"))

        total = query.count()
        rows = query.order_by(desc(Prediction.created_at)).offset(offset).limit(limit).all()

        items = []
        for row in rows:
            top_preds = row.top_predictions or []
            raw_class = top_preds[0].get("raw_class", "") if top_preds else ""
            meta = get_disease_details(raw_class)
            items.append(
                PredictionResponse(
                    id=row.id,
                    crop_id=row.crop_id,
                    crop_name=row.crop.name if row.crop else None,
                    image_url=row.image_url,
                    image_hash=row.image_hash,
                    predicted_label=row.predicted_label,
                    is_healthy=row.is_healthy,
                    confidence_score=row.confidence_score,
                    low_confidence_warning=row.confidence_score < 0.60,
                    top_predictions=top_preds,
                    disease_info=DiseaseMetadataResponse(**meta),
                    model_version=row.model_version,
                    created_at=row.created_at,
                )
            )
        return total, items