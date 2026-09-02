from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.dashboard import DashboardOverviewResponse
from app.services import dashboard_service
from app.services.sla_monitor import schedule_sla_check_if_needed

router = APIRouter(tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    background_tasks: BackgroundTasks,
    project_id: uuid.UUID | None = Query(None)
):
    """Get the full role-based dashboard overview data."""
    schedule_sla_check_if_needed(background_tasks)
    return await dashboard_service.get_dashboard_overview(session, current_user, project_id)
