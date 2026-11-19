from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import get_settings
from app.db.session import check_db_connection
from app.ml.predictor import DiseasePredictor

router = APIRouter()


@router.get("/health", summary="System Health & Readiness Check")
async def health_check():
    settings = get_settings()
    db_connected = check_db_connection()
    ml_ready = DiseasePredictor.is_ready()

    return {
        "success": True,
        "status": "healthy" if db_connected else "degraded",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "components": {
            "api": "online",
            "database": "connected" if db_connected else "disconnected",
            "supabase_storage": "configured" if bool(settings.SUPABASE_URL and settings.SUPABASE_KEY) else "pending_setup",
            "cohere_ai": "configured" if bool(settings.COHERE_API_KEY) else "pending_setup",
            "ml_inference": "loaded" if ml_ready else "not_loaded",
            "ml_model_version": settings.ML_MODEL_VERSION,
        },
    }