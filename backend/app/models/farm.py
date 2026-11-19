import uuid
from datetime import datetime, date, timezone
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    Date,
    DateTime,
    Text,
    Numeric,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Crop(Base):
    __tablename__ = "crops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    crop_category = Column(String(50), nullable=False, index=True)
    planting_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=True)
    status = Column(String(30), nullable=False, default="active", index=True)
    location_name = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    predictions = relationship("Prediction", back_populates="crop")
    inventory_items = relationship("ProduceInventory", back_populates="crop", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id = Column(UUID(as_uuid=True), ForeignKey("crops.id", ondelete="SET NULL"), nullable=True, index=True)
    image_url = Column(Text, nullable=False)
    image_hash = Column(String(64), nullable=False, index=True)
    predicted_label = Column(String(120), nullable=False, index=True)
    is_healthy = Column(Boolean, nullable=False, default=False)
    confidence_score = Column(Float, nullable=False)
    top_predictions = Column(JSONB, nullable=False)
    model_version = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    crop = relationship("Crop", back_populates="predictions")

    __table_args__ = (
        CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0", name="ck_prediction_confidence_range"),
    )


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    location_name = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    temperature_c = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    weather_description = Column(String(100), nullable=True)
    record_type = Column(String(30), nullable=False, default="current")
    raw_payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_weather_coords_time", "latitude", "longitude", "observed_at", "record_type"),
    )


class ProduceInventory(Base):
    __tablename__ = "produce_inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_id = Column(UUID(as_uuid=True), ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    produce_name = Column(String(120), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(30), nullable=False, default="kg")
    harvest_date = Column(Date, nullable=False, default=date.today, index=True)
    status = Column(String(30), nullable=False, default="available", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    crop = relationship("Crop", back_populates="inventory_items")

    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_inventory_quantity_non_negative"),
    )