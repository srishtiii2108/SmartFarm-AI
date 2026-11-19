from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.farm import CropCreate, CropResponse, CropUpdate
from app.services.farm_service import FarmService

router = APIRouter(prefix="/crops", tags=["Crop Management"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Register a new crop")
def create_crop(
    payload: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crop = FarmService.create_crop(db, payload, current_user.id)
    return {"success": True, "data": CropResponse.model_validate(crop)}


@router.get("", summary="List registered crops with filters & pagination")
def list_crops(
    crop_category: Optional[str] = Query(None, description="Filter by tomato, potato, bell_pepper, other"),
    crop_status: Optional[str] = Query(None, alias="status", description="Filter by active, harvested, diseased, archived"),
    search: Optional[str] = Query(None, description="Search by crop name or plot location"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, items = FarmService.list_crops(db, current_user.id, crop_category, crop_status, search, limit, offset)
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [CropResponse.model_validate(c) for c in items],
    }


@router.get("/{crop_id}", summary="Get single crop details")
def get_crop(
    crop_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crop = FarmService.get_crop_or_404(db, crop_id, current_user.id)
    return {"success": True, "data": CropResponse.model_validate(crop)}


@router.patch("/{crop_id}", summary="Update crop details or status")
def update_crop(
    crop_id: UUID,
    payload: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crop = FarmService.update_crop(db, crop_id, payload, current_user.id)
    return {"success": True, "data": CropResponse.model_validate(crop)}


@router.delete("/{crop_id}", summary="Delete a crop record")
def delete_crop(
    crop_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    FarmService.delete_crop(db, crop_id, current_user.id)
    return {"success": True, "message": "Crop record deleted successfully."}