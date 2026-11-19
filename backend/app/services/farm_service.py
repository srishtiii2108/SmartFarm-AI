from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from fastapi import status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.clients.open_meteo import OpenMeteoClient, decode_wmo_code
from app.core.exceptions import AppException
from app.models.farm import Crop, ProduceInventory, WeatherRecord
from app.schemas.farm import (
    CropCreate,
    CropUpdate,
    EnvironmentalRiskReport,
    InventoryCreate,
    InventoryUpdate,
    RiskIndicator,
    WeatherSyncRequest,
)


class FarmService:
    # ==================== CROP OPERATIONS ====================

    @staticmethod
    def create_crop(db: Session, payload: CropCreate, user_id: UUID) -> Crop:
        crop = Crop(
            user_id=user_id,
            name=payload.name.strip(),
            variety=payload.variety.strip() if payload.variety else None,
            crop_category=payload.crop_category.value,
            planting_date=payload.planting_date,
            expected_harvest_date=payload.expected_harvest_date,
            status=payload.status.value,
            location_name=payload.location_name.strip() if payload.location_name else None,
            latitude=payload.latitude,
            longitude=payload.longitude,
            notes=payload.notes.strip() if payload.notes else None,
        )
        db.add(crop)
        db.commit()
        db.refresh(crop)
        return crop

    @staticmethod
    def list_crops(
        db: Session,
        user_id: UUID,
        crop_category: Optional[str] = None,
        crop_status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[int, List[Crop]]:
        query = db.query(Crop).filter(Crop.user_id == user_id)
        if crop_category:
            query = query.filter(Crop.crop_category == crop_category.lower())
        if crop_status:
            query = query.filter(Crop.status == crop_status.lower())
        if search:
            term = f"%{search.strip()}%"
            query = query.filter(Crop.name.ilike(term) | Crop.location_name.ilike(term))

        total = query.count()
        items = query.order_by(desc(Crop.created_at)).offset(offset).limit(limit).all()
        return total, items

    @staticmethod
    def get_crop_or_404(db: Session, crop_id: UUID, user_id: UUID) -> Crop:
        crop = (
            db.query(Crop)
            .filter(Crop.id == crop_id, Crop.user_id == user_id)
            .first()
        )
        if not crop:
            raise AppException(
                message=f"Crop with ID '{crop_id}' was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                code="CROP_NOT_FOUND",
            )
        return crop

    @staticmethod
    def update_crop(db: Session, crop_id: UUID, payload: CropUpdate, user_id: UUID) -> Crop:
        crop = FarmService.get_crop_or_404(db, crop_id, user_id)
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(value, "value"):
                value = value.value
            setattr(crop, field, value)

        db.commit()
        db.refresh(crop)
        return crop

    @staticmethod
    def delete_crop(db: Session, crop_id: UUID, user_id: UUID) -> None:
        crop = FarmService.get_crop_or_404(db, crop_id, user_id)
        db.delete(crop)
        db.commit()

    # ==================== PRODUCE INVENTORY OPERATIONS ====================

    @staticmethod
    def create_inventory(db: Session, payload: InventoryCreate, user_id: UUID) -> ProduceInventory:
        if payload.crop_id:
            FarmService.get_crop_or_404(db, payload.crop_id, user_id)

        item = ProduceInventory(
            user_id=user_id,
            crop_id=payload.crop_id,
            produce_name=payload.produce_name.strip(),
            quantity=payload.quantity,
            unit=payload.unit.value,
            harvest_date=payload.harvest_date,
            status=payload.status.value,
            notes=payload.notes.strip() if payload.notes else None,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def list_inventory(
        db: Session,
        user_id: UUID,
        crop_id: Optional[UUID] = None,
        inv_status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[int, List[ProduceInventory]]:
        query = db.query(ProduceInventory).filter(ProduceInventory.user_id == user_id)
        if crop_id:
            query = query.filter(ProduceInventory.crop_id == crop_id)
        if inv_status:
            query = query.filter(ProduceInventory.status == inv_status.lower())

        total = query.count()
        items = (
            query.order_by(desc(ProduceInventory.harvest_date), desc(ProduceInventory.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
        return total, items

    @staticmethod
    def get_inventory_or_404(db: Session, item_id: UUID, user_id: UUID) -> ProduceInventory:
        item = (
            db.query(ProduceInventory)
            .filter(ProduceInventory.id == item_id, ProduceInventory.user_id == user_id)
            .first()
        )
        if not item:
            raise AppException(
                message=f"Inventory record '{item_id}' was not found.",
                status_code=status.HTTP_404_NOT_FOUND,
                code="INVENTORY_NOT_FOUND",
            )
        return item

    @staticmethod
    def update_inventory(
        db: Session,
        item_id: UUID,
        payload: InventoryUpdate,
        user_id: UUID,
    ) -> ProduceInventory:
        item = FarmService.get_inventory_or_404(db, item_id, user_id)
        update_data = payload.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(value, "value"):
                value = value.value
            setattr(item, field, value)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_inventory(db: Session, item_id: UUID, user_id: UUID) -> None:
        item = FarmService.get_inventory_or_404(db, item_id, user_id)
        db.delete(item)
        db.commit()

    # ==================== WEATHER & ENVIRONMENTAL INTELLIGENCE ====================

    @staticmethod
    async def sync_and_get_weather(
        db: Session,
        payload: WeatherSyncRequest,
        user_id: UUID,
    ) -> Dict[str, Any]:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)

        if not payload.force_refresh:
            cached = (
                db.query(WeatherRecord)
                .filter(
                    WeatherRecord.user_id == user_id,
                    WeatherRecord.record_type == "current",
                    WeatherRecord.latitude.between(payload.latitude - 0.02, payload.latitude + 0.02),
                    WeatherRecord.longitude.between(payload.longitude - 0.02, payload.longitude + 0.02),
                    WeatherRecord.created_at >= cutoff,
                )
                .order_by(desc(WeatherRecord.created_at))
                .first()
            )
            if cached and cached.raw_payload:
                return {
                    "source": "database_cache",
                    "observed_current": cached,
                    "daily_series": FarmService._extract_daily_series(cached.raw_payload),
                }

        raw_data = await OpenMeteoClient.fetch_weather(payload.latitude, payload.longitude)
        current_block = raw_data.get("current", {})
        weather_code = current_block.get("weather_code")

        observed_time_str = current_block.get("time")
        try:
            observed_at = (
                datetime.fromisoformat(observed_time_str).replace(tzinfo=timezone.utc)
                if observed_time_str
                else datetime.now(timezone.utc)
            )
        except ValueError:
            observed_at = datetime.now(timezone.utc)

        record = WeatherRecord(
            user_id=user_id,
            location_name=payload.location_name or f"{round(payload.latitude, 3)}, {round(payload.longitude, 3)}",
            latitude=round(payload.latitude, 4),
            longitude=round(payload.longitude, 4),
            observed_at=observed_at,
            temperature_c=current_block.get("temperature_2m"),
            relative_humidity_pct=current_block.get("relative_humidity_2m"),
            precipitation_mm=current_block.get("precipitation"),
            weather_code=weather_code,
            weather_description=decode_wmo_code(weather_code),
            record_type="current",
            raw_payload=raw_data,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "source": "open_meteo_live",
            "observed_current": record,
            "daily_series": FarmService._extract_daily_series(raw_data),
        }

    @staticmethod
    def _extract_daily_series(raw_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        daily = raw_payload.get("daily", {})
        dates = daily.get("time", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])
        precip = daily.get("precipitation_sum", [])
        codes = daily.get("weather_code", [])

        today_str = datetime.now(timezone.utc).date().isoformat()
        series = []
        for idx, day_str in enumerate(dates):
            code = codes[idx] if idx < len(codes) else None
            series.append(
                {
                    "date": day_str,
                    "period_type": "historical" if day_str < today_str else ("today" if day_str == today_str else "forecast"),
                    "temp_max_c": temp_max[idx] if idx < len(temp_max) else None,
                    "temp_min_c": temp_min[idx] if idx < len(temp_min) else None,
                    "precipitation_mm": precip[idx] if idx < len(precip) else None,
                    "weather_code": code,
                    "weather_description": decode_wmo_code(code),
                }
            )
        return series

    @staticmethod
    def list_weather_history(
        db: Session,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[int, List[WeatherRecord]]:
        query = db.query(WeatherRecord).filter(WeatherRecord.user_id == user_id)
        total = query.count()
        items = (
            query.order_by(desc(WeatherRecord.observed_at), desc(WeatherRecord.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
        return total, items

    # ==================== MODULE 10: ENVIRONMENTAL RISK INTELLIGENCE ====================

    @staticmethod
    async def evaluate_environmental_risk(
        db: Session,
        user_id: UUID,
        latitude: float,
        longitude: float,
        location_name: Optional[str] = None,
    ) -> EnvironmentalRiskReport:
        weather_bundle = await FarmService.sync_and_get_weather(
            db,
            WeatherSyncRequest(latitude=latitude, longitude=longitude, location_name=location_name),
            user_id=user_id,
        )
        current_rec: WeatherRecord = weather_bundle["observed_current"]

        active_crops = (
            db.query(Crop)
            .filter(Crop.user_id == user_id, Crop.status.in_(["active", "diseased"]))
            .all()
        )
        active_crop_names = list({f"{c.name} ({c.crop_category})" for c in active_crops})

        temp = current_rec.temperature_c
        humidity = current_rec.relative_humidity_pct
        precip = current_rec.precipitation_mm

        indicators: List[RiskIndicator] = []

        if humidity is not None and temp is not None:
            if humidity >= 80.0 and 15.0 <= temp <= 26.0:
                indicators.append(
                    RiskIndicator(
                        risk_type="Fungal Leaf Blight Favorable Conditions",
                        severity="high" if humidity >= 88.0 else "moderate",
                        affected_crops=["Tomato", "Potato"],
                        observed_trigger=f"Observed relative humidity {humidity}% with temperature {temp}°C",
                        advisory_note="High moisture and moderate temperatures favor fungal spore germination (e.g., Early/Late Blight). Inspect lower foliage and ensure canopy airflow.",
                    )
                )

        if humidity is not None and temp is not None:
            if humidity >= 75.0 and 24.0 <= temp <= 32.0:
                indicators.append(
                    RiskIndicator(
                        risk_type="Bacterial Foliar Disease Risk",
                        severity="moderate",
                        affected_crops=["Tomato", "Bell Pepper"],
                        observed_trigger=f"Observed warm temperature {temp}°C with {humidity}% relative humidity",
                        advisory_note="Warm, humid conditions increase bacterial leaf spot spread. Avoid overhead irrigation during peak humidity.",
                    )
                )

        if temp is not None and temp >= 35.0:
            indicators.append(
                RiskIndicator(
                    risk_type="Thermal / Blossom Drop Stress",
                    severity="high" if temp >= 38.0 else "moderate",
                    affected_crops=["Tomato", "Bell Pepper", "Potato"],
                    observed_trigger=f"Observed air temperature {temp}°C (>= 35°C threshold)",
                    advisory_note="Elevated temperatures can impair pollination and cause flower drop. Maintain consistent soil moisture and mulching.",
                )
            )

        if temp is not None and temp <= 8.0:
            indicators.append(
                RiskIndicator(
                    risk_type="Low Temperature / Chilling Stress",
                    severity="high" if temp <= 4.0 else "moderate",
                    affected_crops=["Tomato", "Bell Pepper"],
                    observed_trigger=f"Observed air temperature {temp}°C (<= 8°C threshold)",
                    advisory_note="Warm-season Solanaceae crops experience slowed growth and chilling injury below 8°C.",
                )
            )

        if precip is not None and precip >= 15.0:
            indicators.append(
                RiskIndicator(
                    risk_type="Excess Surface Moisture / Waterlogging Risk",
                    severity="high" if precip >= 30.0 else "moderate",
                    affected_crops=["Potato", "Tomato", "Bell Pepper"],
                    observed_trigger=f"Observed precipitation {precip} mm",
                    advisory_note="Heavy rainfall increases soil splash transmission and root rot risk. Verify field drainage channels.",
                )
            )

        return EnvironmentalRiskReport(
            location_name=current_rec.location_name,
            latitude=current_rec.latitude,
            longitude=current_rec.longitude,
            observed_weather={
                "source": weather_bundle["source"],
                "observed_at": current_rec.observed_at.isoformat(),
                "temperature_c": temp,
                "relative_humidity_pct": humidity,
                "precipitation_mm": precip,
                "condition": current_rec.weather_description,
            },
            active_farm_crops=active_crop_names,
            risk_indicators=indicators,
            methodology_disclaimer=(
                "Observed weather figures are sourced from Open-Meteo telemetry. "
                "Risk indicators are rule-based agronomic heuristics derived from environmental thresholds "
                "and do not represent validated epidemiological or flood forecasting models."
            ),
        )