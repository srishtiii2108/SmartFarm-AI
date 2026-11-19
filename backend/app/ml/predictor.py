import io
import json
import logging
from pathlib import Path
from typing import Any, Dict, List
import numpy as np
from fastapi import status
from PIL import Image, ImageOps, UnidentifiedImageError
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.ml.disease_metadata import get_disease_details

logger = logging.getLogger("smartfarm.ml.predictor")

BACKEND_ROOT = Path(__file__).resolve().parents[2]
IMG_SIZE = (224, 224)


def _resolve_artifact_path(configured_path: str) -> Path:
    candidate = Path(configured_path)
    if candidate.is_absolute():
        return candidate
    return (BACKEND_ROOT / candidate).resolve()


class DiseasePredictor:
    _model: tf.keras.Model | None = None
    _class_map: Dict[str, Dict[str, Any]] = {}
    _evaluation_report: Dict[str, Any] = {}
    _loaded: bool = False

    @classmethod
    def load_artifacts(cls) -> bool:
        if cls._loaded and cls._model is not None:
            return True

        settings = get_settings()
        model_path = _resolve_artifact_path(settings.ML_MODEL_PATH)
        labels_path = _resolve_artifact_path(settings.ML_LABELS_PATH)
        report_path = model_path.parent / "evaluation_report.json"

        if not model_path.exists() or not labels_path.exists():
            logger.warning(f"ML artifacts not found at {model_path}. Disease inference will remain offline until provided.")
            return False

        try:
            cls._model = tf.keras.models.load_model(model_path, compile=False)
            with open(labels_path, "r", encoding="utf-8") as f:
                cls._class_map = json.load(f)

            if report_path.exists():
                with open(report_path, "r", encoding="utf-8") as f:
                    cls._evaluation_report = json.load(f)

            cls._loaded = True
            logger.info(
                f"Loaded MobileNetV2 model '{settings.ML_MODEL_VERSION}' with {len(cls._class_map)} classes from {model_path}"
            )
            return True
        except Exception as exc:
            logger.error(f"Failed to load MobileNetV2 artifacts: {exc}")
            cls._loaded = False
            return False

    @classmethod
    def is_ready(cls) -> bool:
        return cls._loaded and cls._model is not None

    @classmethod
    def get_evaluation_report(cls) -> Dict[str, Any]:
        if not cls._loaded:
            cls.load_artifacts()
        return cls._evaluation_report

    @classmethod
    def preprocess_image_bytes(cls, image_bytes: bytes) -> np.ndarray:
        try:
            with Image.open(io.BytesIO(image_bytes)) as verify_img:
                verify_img.verify()

            with Image.open(io.BytesIO(image_bytes)) as img:
                img = ImageOps.exif_transpose(img).convert("RGB")
                img = img.resize(IMG_SIZE, Image.Resampling.BILINEAR)
                arr = np.asarray(img, dtype=np.float32)
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise AppException(
                message="Uploaded file is not a valid or readable image (JPEG, PNG, or WebP required).",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_IMAGE_FILE",
            ) from exc

        batch = np.expand_dims(arr, axis=0)
        return preprocess_input(batch)

    @classmethod
    def predict(cls, image_bytes: bytes) -> Dict[str, Any]:
        if not cls.is_ready() and not cls.load_artifacts():
            raise AppException(
                message="Plant disease classification model is not loaded on the server.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                code="ML_MODEL_UNAVAILABLE",
            )

        settings = get_settings()
        input_tensor = cls.preprocess_image_bytes(image_bytes)
        probs = cls._model.predict(input_tensor, verbose=0)[0]

        top_indices = np.argsort(probs)[::-1][:3]
        top_predictions: List[Dict[str, Any]] = []

        for idx in top_indices:
            meta = cls._class_map.get(str(int(idx)), {})
            raw_class = meta.get("raw_class", f"Class_{idx}")
            top_predictions.append(
                {
                    "raw_class": raw_class,
                    "label": meta.get("display_name", raw_class),
                    "crop_category": meta.get("crop_category", "other"),
                    "is_healthy": bool(meta.get("is_healthy", False)),
                    "confidence": round(float(probs[idx]), 4),
                }
            )

        primary = top_predictions[0]
        disease_info = get_disease_details(primary["raw_class"])

        return {
            "predicted_label": primary["label"],
            "raw_class": primary["raw_class"],
            "crop_category": primary["crop_category"],
            "is_healthy": primary["is_healthy"],
            "confidence_score": primary["confidence"],
            "low_confidence_warning": primary["confidence"] < 0.60,
            "top_predictions": top_predictions,
            "disease_info": disease_info,
            "model_version": settings.ML_MODEL_VERSION,
            "dataset_limitation_notice": (
                "Model trained on PlantVillage studio leaf images (Tomato, Potato, Bell Pepper). "
                "Complex field backgrounds, shadows, or non-target plant species may affect prediction confidence."
            ),
        }