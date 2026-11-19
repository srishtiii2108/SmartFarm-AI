from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CropCategory(str, Enum):
    TOMATO = "tomato"
    POTATO = "potato"
    BELL_PEPPER = "bell_pepper"
    OTHER = "other"


class CropStatus(str, Enum):
    ACTIVE = "active"
    HARVESTED = "harvested"
    DISEASED = "diseased"
    ARCHIVED = "archived"


class InventoryUnit(str, Enum):
    KG = "kg"
    QUINTAL = "quintal"
    CRATES = "crates"
    TONS = "tons"


class InventoryStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    SPOILED = "spoiled"


# ==================== CROP SCHEMAS ====================

class CropCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Roma Tomato"])
    variety: Optional[str] = Field(None, max_length=100, examples=["Determinate Hybrid"])
    crop_category: CropCategory = Field(default=CropCategory.TOMATO)
    planting_date: date
    expected_harvest_date: Optional[date] = None
    status: CropStatus = Field(default=CropStatus.ACTIVE)
    location_name: Optional[str] = Field(None, max_length=150, examples=["Nashik Plot A"])
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, examples=[19.9975])
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, examples=[73.7898])
    notes: Optional[str] = Field(None, max_length=1000)


class CropUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    variety: Optional[str] = Field(None, max_length=100)
    crop_category: Optional[CropCategory] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    status: Optional[CropStatus] = None
    location_name: Optional[str] = Field(None, max_length=150)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    notes: Optional[str] = Field(None, max_length=1000)


class CropResponse(BaseModel):
    id: UUID
    name: str
    variety: Optional[str]
    crop_category: str
    planting_date: date
    expected_harvest_date: Optional[date]
    status: str
    location_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== PRODUCE INVENTORY SCHEMAS ====================

class InventoryCreate(BaseModel):
    crop_id: UUID
    produce_name: str = Field(..., min_length=2, max_length=120, examples=["Grade-A Red Tomatoes"])
    quantity: float = Field(..., gt=0, examples=[125.5])
    unit: InventoryUnit = Field(default=InventoryUnit.KG)
    harvest_date: date = Field(default_factory=date.today)
    status: InventoryStatus = Field(default=InventoryStatus.AVAILABLE)
    notes: Optional[str] = Field(None, max_length=1000)


class InventoryUpdate(BaseModel):
    produce_name: Optional[str] = Field(None, min_length=2, max_length=120)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[InventoryUnit] = None
    harvest_date: Optional[date] = None
    status: Optional[InventoryStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)


class InventoryResponse(BaseModel):
    id: UUID
    crop_id: UUID
    crop_name: Optional[str] = None
    produce_name: str
    quantity: float
    unit: str
    harvest_date: date
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==================== WEATHER & RISK SCHEMAS ====================

class WeatherSyncRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, examples=[19.9975])
    longitude: float = Field(..., ge=-180.0, le=180.0, examples=[73.7898])
    location_name: Optional[str] = Field(None, max_length=150, examples=["Nashik, Maharashtra"])
    force_refresh: bool = Field(default=False)


class WeatherRecordResponse(BaseModel):
    id: UUID
    location_name: Optional[str]
    latitude: float
    longitude: float
    observed_at: datetime
    temperature_c: Optional[float]
    relative_humidity_pct: Optional[float]
    precipitation_mm: Optional[float]
    weather_code: Optional[int]
    weather_description: Optional[str]
    record_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiskIndicator(BaseModel):
    risk_type: str
    severity: str  # low, moderate, high
    affected_crops: List[str]
    observed_trigger: str
    advisory_note: str


class EnvironmentalRiskReport(BaseModel):
    location_name: Optional[str]
    latitude: float
    longitude: float
    observed_weather: Dict[str, Any]
    active_farm_crops: List[str]
    risk_indicators: List[RiskIndicator]
    methodology_disclaimer: str