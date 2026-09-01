import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User, RoleEnum
from app.api.dependencies import get_current_active_user, RequireRole
from app.schemas.sla import SLAPolicyCreate, SLAPolicyUpdate, SLAPolicyResponse, SLAOverviewResponse
from app.services import sla_service

router = APIRouter(tags=["SLA"])

admin_required = RequireRole([RoleEnum.ADMIN])

@router.get("/policies", response_model=list[SLAPolicyResponse])
async def get_policies(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    return await sla_service.get_policies(session)

@router.post("/policies", response_model=SLAPolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    policy_in: SLAPolicyCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    return await sla_service.create_policy(session, policy_in)

@router.get("/policies/{policy_id}", response_model=SLAPolicyResponse)
async def get_policy(
    policy_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    return await sla_service.get_policy(session, policy_id)

@router.patch("/policies/{policy_id}", response_model=SLAPolicyResponse)
async def update_policy(
    policy_id: uuid.UUID,
    policy_in: SLAPolicyUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    return await sla_service.update_policy(session, policy_id, policy_in)

@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_policy(
    policy_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    await sla_service.update_policy(session, policy_id, SLAPolicyUpdate(active=False))

@router.get("/overview", response_model=SLAOverviewResponse)
async def get_sla_overview(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    return await sla_service.get_sla_overview(session, current_user)
