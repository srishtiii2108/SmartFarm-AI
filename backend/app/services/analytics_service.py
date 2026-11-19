import csv
import io
from typing import Any, Dict, List
from uuid import UUID
from fastapi import status
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppException
from app.models.farm import Crop, Prediction, ProduceInventory, WeatherRecord
from app.models.rag import KnowledgeDocument


class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(db: Session, user_id: UUID) -> Dict[str, Any]:
        # 1. Core KPI Counters (Scoped to authenticated user)
        total_scans = (
            db.query(func.count(Prediction.id))
            .filter(Prediction.user_id == user_id)
            .scalar()
            or 0
        )
        healthy_scans = (
            db.query(func.count(Prediction.id))
            .filter(Prediction.user_id == user_id, Prediction.is_healthy.is_(True))
            .scalar()
            or 0
        )
        diseased_scans = total_scans - healthy_scans
        healthy_rate_pct = round((healthy_scans / total_scans) * 100, 1) if total_scans > 0 else 0.0

        total_crops = (
            db.query(func.count(Crop.id))
            .filter(Crop.user_id == user_id)
            .scalar()
            or 0
        )
        active_crops = (
            db.query(func.count(Crop.id))
            .filter(Crop.user_id == user_id, Crop.status == "active")
            .scalar()
            or 0
        )
        # Shared agronomic knowledge base across all farmers
        indexed_docs = db.query(func.count(KnowledgeDocument.id)).scalar() or 0

        # 2. Disease Distribution Chart Data (GROUP BY predicted_label)
        disease_count_col = func.count(Prediction.id).label("count")
        dist_rows = (
            db.query(
                Prediction.predicted_label,
                Prediction.is_healthy,
                disease_count_col,
            )
            .filter(Prediction.user_id == user_id)
            .group_by(Prediction.predicted_label, Prediction.is_healthy)
            .order_by(desc(disease_count_col))
            .limit(10)
            .all()
        )
        disease_distribution = [
            {
                "label": row.predicted_label,
                "is_healthy": bool(row.is_healthy),
                "count": int(row.count),
            }
            for row in dist_rows
        ]

        # 3. Historical Prediction Trends (Grouped by Date using SQLAlchemy CASE)
        scan_date_expr = func.date(Prediction.created_at)
        healthy_sum_expr = func.sum(
            case((Prediction.is_healthy.is_(True), 1), else_=0)
        ).label("healthy")

        trend_rows = (
            db.query(
                scan_date_expr.label("scan_date"),
                func.count(Prediction.id).label("total"),
                healthy_sum_expr,
            )
            .filter(Prediction.user_id == user_id)
            .group_by(scan_date_expr)
            .order_by(scan_date_expr)
            .limit(30)
            .all()
        )
        prediction_trends = []
        for row in trend_rows:
            tot = int(row.total or 0)
            hlth = int(row.healthy or 0)
            prediction_trends.append(
                {
                    "date": str(row.scan_date),
                    "total_scans": tot,
                    "healthy": hlth,
                    "diseased": tot - hlth,
                }
            )

        # 4. Crop Health & Status Breakdown
        crop_status_rows = (
            db.query(Crop.status, func.count(Crop.id).label("count"))
            .filter(Crop.user_id == user_id)
            .group_by(Crop.status)
            .all()
        )
        crop_health_stats = [
            {"status": row.status, "count": int(row.count)} for row in crop_status_rows
        ]

        # 5. Recent Disease Detections (Last 5 scans for current user)
        recent_rows = (
            db.query(Prediction)
            .filter(Prediction.user_id == user_id)
            .options(joinedload(Prediction.crop))
            .order_by(desc(Prediction.created_at))
            .limit(5)
            .all()
        )
        recent_detections = [
            {
                "id": str(p.id),
                "crop_name": p.crop.name if p.crop else "Unassigned Scan",
                "predicted_label": p.predicted_label,
                "is_healthy": p.is_healthy,
                "confidence_score": p.confidence_score,
                "image_url": p.image_url,
                "created_at": p.created_at.isoformat(),
            }
            for p in recent_rows
        ]

        # 6. Latest Stored Weather Summary for current user
        latest_weather = (
            db.query(WeatherRecord)
            .filter(WeatherRecord.user_id == user_id)
            .order_by(desc(WeatherRecord.created_at))
            .first()
        )
        weather_summary = None
        if latest_weather:
            weather_summary = {
                "location_name": latest_weather.location_name,
                "latitude": latest_weather.latitude,
                "longitude": latest_weather.longitude,
                "temperature_c": latest_weather.temperature_c,
                "relative_humidity_pct": latest_weather.relative_humidity_pct,
                "precipitation_mm": latest_weather.precipitation_mm,
                "condition": latest_weather.weather_description,
                "observed_at": latest_weather.observed_at.isoformat(),
            }

        return {
            "kpis": {
                "total_plant_scans": total_scans,
                "healthy_predictions": healthy_scans,
                "diseased_predictions": diseased_scans,
                "healthy_rate_pct": healthy_rate_pct,
                "total_registered_crops": total_crops,
                "active_crops": active_crops,
                "indexed_knowledge_docs": indexed_docs,
            },
            "disease_distribution": disease_distribution,
            "prediction_trends": prediction_trends,
            "crop_health_stats": crop_health_stats,
            "recent_detections": recent_detections,
            "weather_summary": weather_summary,
        }

    @staticmethod
    def get_detailed_reports(db: Session, user_id: UUID) -> Dict[str, Any]:
        dashboard_data = AnalyticsService.get_dashboard_summary(db, user_id)

        # Crop Category Distribution
        cat_rows = (
            db.query(Crop.crop_category, func.count(Crop.id).label("count"))
            .filter(Crop.user_id == user_id)
            .group_by(Crop.crop_category)
            .all()
        )
        crops_by_category = [
            {"category": row.crop_category, "count": int(row.count)} for row in cat_rows
        ]

        # Produce Inventory Aggregations (Grouped by Status & Unit)
        inv_rows = (
            db.query(
                ProduceInventory.status,
                ProduceInventory.unit,
                func.count(ProduceInventory.id).label("batches"),
                func.sum(ProduceInventory.quantity).label("total_quantity"),
            )
            .filter(ProduceInventory.user_id == user_id)
            .group_by(ProduceInventory.status, ProduceInventory.unit)
            .all()
        )
        inventory_summary = [
            {
                "status": row.status,
                "unit": row.unit,
                "batches": int(row.batches),
                "total_quantity": float(row.total_quantity or 0),
            }
            for row in inv_rows
        ]

        # Recent Weather Observations (Last 10 records for current user)
        weather_rows = (
            db.query(WeatherRecord)
            .filter(WeatherRecord.user_id == user_id)
            .order_by(desc(WeatherRecord.observed_at))
            .limit(10)
            .all()
        )
        weather_observations = [
            {
                "id": str(w.id),
                "location_name": w.location_name,
                "temperature_c": w.temperature_c,
                "relative_humidity_pct": w.relative_humidity_pct,
                "precipitation_mm": w.precipitation_mm,
                "condition": w.weather_description,
                "observed_at": w.observed_at.isoformat(),
            }
            for w in weather_rows
        ]

        return {
            **dashboard_data,
            "crops_by_category": crops_by_category,
            "inventory_summary": inventory_summary,
            "recent_weather_observations": weather_observations,
        }

    @staticmethod
    def generate_csv_export(db: Session, user_id: UUID, dataset_type: str) -> str:
        allowed = {"predictions", "crops", "inventory", "weather"}
        dtype = dataset_type.lower().strip()
        if dtype not in allowed:
            raise AppException(
                message=f"Invalid export dataset '{dataset_type}'. Allowed values: {', '.join(sorted(allowed))}.",
                status_code=status.HTTP_400_BAD_REQUEST,
                code="INVALID_EXPORT_TYPE",
            )

        output = io.StringIO()
        writer = csv.writer(output)

        if dtype == "predictions":
            writer.writerow([
                "prediction_id",
                "crop_name",
                "predicted_label",
                "is_healthy",
                "confidence_score",
                "model_version",
                "image_url",
                "created_at_utc",
            ])
            rows: List[Prediction] = (
                db.query(Prediction)
                .filter(Prediction.user_id == user_id)
                .options(joinedload(Prediction.crop))
                .order_by(desc(Prediction.created_at))
                .all()
            )
            for r in rows:
                writer.writerow([
                    str(r.id),
                    r.crop.name if r.crop else "",
                    r.predicted_label,
                    r.is_healthy,
                    r.confidence_score,
                    r.model_version,
                    r.image_url,
                    r.created_at.isoformat(),
                ])

        elif dtype == "crops":
            writer.writerow([
                "crop_id",
                "name",
                "variety",
                "crop_category",
                "planting_date",
                "expected_harvest_date",
                "status",
                "location_name",
                "latitude",
                "longitude",
                "created_at_utc",
            ])
            rows_c: List[Crop] = (
                db.query(Crop)
                .filter(Crop.user_id == user_id)
                .order_by(desc(Crop.created_at))
                .all()
            )
            for c in rows_c:
                writer.writerow([
                    str(c.id),
                    c.name,
                    c.variety or "",
                    c.crop_category,
                    c.planting_date.isoformat(),
                    c.expected_harvest_date.isoformat() if c.expected_harvest_date else "",
                    c.status,
                    c.location_name or "",
                    c.latitude if c.latitude is not None else "",
                    c.longitude if c.longitude is not None else "",
                    c.created_at.isoformat(),
                ])

        elif dtype == "inventory":
            writer.writerow([
                "inventory_id",
                "crop_name",
                "produce_name",
                "quantity",
                "unit",
                "harvest_date",
                "status",
                "notes",
                "created_at_utc",
            ])
            rows_i: List[ProduceInventory] = (
                db.query(ProduceInventory)
                .filter(ProduceInventory.user_id == user_id)
                .options(joinedload(ProduceInventory.crop))
                .order_by(desc(ProduceInventory.harvest_date))
                .all()
            )
            for i in rows_i:
                writer.writerow([
                    str(i.id),
                    i.crop.name if i.crop else "",
                    i.produce_name,
                    float(i.quantity),
                    i.unit,
                    i.harvest_date.isoformat(),
                    i.status,
                    i.notes or "",
                    i.created_at.isoformat(),
                ])

        elif dtype == "weather":
            writer.writerow([
                "weather_id",
                "location_name",
                "latitude",
                "longitude",
                "observed_at_utc",
                "temperature_c",
                "relative_humidity_pct",
                "precipitation_mm",
                "weather_description",
                "record_type",
            ])
            rows_w: List[WeatherRecord] = (
                db.query(WeatherRecord)
                .filter(WeatherRecord.user_id == user_id)
                .order_by(desc(WeatherRecord.observed_at))
                .all()
            )
            for w in rows_w:
                writer.writerow([
                    str(w.id),
                    w.location_name or "",
                    w.latitude,
                    w.longitude,
                    w.observed_at.isoformat(),
                    w.temperature_c if w.temperature_c is not None else "",
                    w.relative_humidity_pct if w.relative_humidity_pct is not None else "",
                    w.precipitation_mm if w.precipitation_mm is not None else "",
                    w.weather_description or "",
                    w.record_type,
                ])

        return output.getvalue()