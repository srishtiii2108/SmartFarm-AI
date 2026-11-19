from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.clients.open_meteo import OpenMeteoClient
from app.db.session import get_db
from app.models.user import User
from app.schemas.farm import WeatherRecordResponse, WeatherSyncRequest
from app.services.farm_service import FarmService

router = APIRouter(prefix="/weather", tags=["Weather & Environmental Intelligence"])


@router.get("/locations", summary="Search city/village coordinates via Open-Meteo Geocoding")
async def search_weather_locations(
    query: str = Query(..., min_length=2, max_length=100, description="City or region name, e.g., Nashik"),
    count: int = Query(5, ge=1, le=10),
):
    locations = await OpenMeteoClient.search_locations(query=query, count=count)
    return {"success": True, "items": locations}


@router.post("/sync", summary="Fetch & persist current, historical (3d), and forecast (7d) weather")
async def sync_weather(
    payload: WeatherSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await FarmService.sync_and_get_weather(db, payload, current_user.id)
    return {
        "success": True,
        "source": result["source"],
        "observed_current": WeatherRecordResponse.model_validate(result["observed_current"]),
        "daily_series": result["daily_series"],
    }


@router.get("/history", summary="List stored weather observations")
def get_weather_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, items = FarmService.list_weather_history(db, current_user.id, limit, offset)
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [WeatherRecordResponse.model_validate(w) for w in items],
    }


@router.get("/risk-analysis", summary="Evaluate heuristic crop environmental risk indicators")
async def get_environmental_risk(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    location_name: Optional[str] = Query(None, max_length=150),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = await FarmService.evaluate_environmental_risk(db, current_user.id, latitude, longitude, location_name)
    return {"success": True, "data": report}