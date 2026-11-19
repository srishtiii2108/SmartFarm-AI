from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])


@router.get("/dashboard", summary="Get live Smart Dashboard KPIs, charts, and recent activity")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = AnalyticsService.get_dashboard_summary(db, current_user.id)
    return {"success": True, "data": data}


@router.get("/reports", summary="Get full cross-module agricultural analytics report")
def get_full_analytics_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = AnalyticsService.get_detailed_reports(db, current_user.id)
    return {"success": True, "data": data}


@router.get("/export/{dataset_type}", summary="Download CSV export (predictions, crops, inventory, weather)")
def export_dataset_csv(
    dataset_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    csv_content = AnalyticsService.generate_csv_export(db, current_user.id, dataset_type)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"smartfarm_{dataset_type.lower()}_{timestamp}.csv"

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )