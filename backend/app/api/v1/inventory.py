from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.farm import InventoryCreate, InventoryResponse, InventoryUpdate
from app.services.farm_service import FarmService

router = APIRouter(prefix="/inventory", tags=["Produce & Inventory Management"])


def _serialize_inventory(item) -> InventoryResponse:
    return InventoryResponse(
        id=item.id,
        crop_id=item.crop_id,
        crop_name=item.crop.name if item.crop else None,
        produce_name=item.produce_name,
        quantity=float(item.quantity),
        unit=item.unit,
        harvest_date=item.harvest_date,
        status=item.status,
        notes=item.notes,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Record harvested produce")
def create_inventory_item(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = FarmService.create_inventory(db, payload, current_user.id)
    return {"success": True, "data": _serialize_inventory(item)}


@router.get("", summary="List produce inventory with filters & pagination")
def list_inventory_items(
    crop_id: Optional[UUID] = Query(None),
    inv_status: Optional[str] = Query(None, alias="status", description="available, reserved, sold, spoiled"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, items = FarmService.list_inventory(db, current_user.id, crop_id, inv_status, limit, offset)
    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_serialize_inventory(i) for i in items],
    }


@router.patch("/{item_id}", summary="Update produce quantity or status")
def update_inventory_item(
    item_id: UUID,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = FarmService.update_inventory(db, item_id, payload, current_user.id)
    return {"success": True, "data": _serialize_inventory(item)}


@router.delete("/{item_id}", summary="Delete an inventory entry")
def delete_inventory_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    FarmService.delete_inventory(db, item_id, current_user.id)
    return {"success": True, "message": "Inventory record deleted successfully."}