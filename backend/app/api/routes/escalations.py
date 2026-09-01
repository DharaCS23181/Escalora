import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.user import User, RoleEnum
from app.models.escalation import Escalation, EscalationStatusEnum
from app.models.ticket import Ticket
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.schemas.escalation import EscalationCreate, EscalationResponse, EscalationMetricsResponse
from app.services import escalation_service

router = APIRouter(tags=["Escalations"])


def _escalation_to_response(esc: Escalation) -> dict:
    """Convert an Escalation ORM object to a dict matching EscalationResponse."""
    return {
        "id": esc.id,
        "ticket_id": esc.ticket_id,
        "project_id": esc.project_id,
        "trigger_type": esc.trigger_type.value,
        "reason": esc.reason,
        "triggered_by_id": esc.triggered_by_id,
        "assigned_to_id": esc.assigned_to_id,
        "status": esc.status.value,
        "created_at": esc.created_at,
        "acknowledged_at": esc.acknowledged_at,
        "resolved_at": esc.resolved_at,
        "updated_at": esc.updated_at,
        "triggered_by": esc.triggered_by,
        "assigned_to": esc.assigned_to,
        "ticket_key": esc.ticket.ticket_key if esc.ticket else None,
        "ticket_title": esc.ticket.title if esc.ticket else None,
        "ticket_priority": esc.ticket.priority.value if esc.ticket else None,
        "ticket_status": esc.ticket.status.value if esc.ticket else None,
        "project_name": esc.project.name if esc.project else None,
    }


@router.get("/metrics", response_model=EscalationMetricsResponse)
async def get_escalation_metrics(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get escalation metrics (counts by status)."""
    project_ids = None
    if current_user.role not in [RoleEnum.ADMIN]:
        # Non-admin: scope to their projects
        member_result = await session.execute(
            select(ProjectMember.project_id).where(ProjectMember.user_id == current_user.id)
        )
        project_ids = [row[0] for row in member_result.all()]

    metrics = await escalation_service.get_escalation_metrics(session, project_ids)
    return metrics


@router.get("", response_model=list[EscalationResponse])
async def get_escalations(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    project_id: uuid.UUID | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    trigger_type: str | None = Query(None),
    assigned_to: uuid.UUID | None = Query(None),
    skip: int = 0,
    limit: int = 100,
):
    """List escalations with filters. Scoped by project access."""
    query = (
        select(Escalation)
        .options(
            selectinload(Escalation.ticket),
            selectinload(Escalation.project),
            selectinload(Escalation.triggered_by),
            selectinload(Escalation.assigned_to),
        )
    )

    # Project-level authorization
    if current_user.role == RoleEnum.ADMIN:
        pass  # Admin sees all
    elif current_user.role == RoleEnum.SENIOR_DEVELOPER:
        # Senior dev sees escalations assigned to them OR in their projects
        member_result = await session.execute(
            select(ProjectMember.project_id).where(ProjectMember.user_id == current_user.id)
        )
        accessible_project_ids = [row[0] for row in member_result.all()]
        query = query.where(Escalation.project_id.in_(accessible_project_ids))
    elif current_user.role == RoleEnum.PROJECT_LEAD:
        member_result = await session.execute(
            select(ProjectMember.project_id).where(ProjectMember.user_id == current_user.id)
        )
        accessible_project_ids = [row[0] for row in member_result.all()]
        query = query.where(Escalation.project_id.in_(accessible_project_ids))
    else:
        # Developer: only see escalations on their own tickets
        query = query.join(Ticket).where(Ticket.assignee_id == current_user.id)

    if project_id:
        query = query.where(Escalation.project_id == project_id)
    if status_filter:
        query = query.where(Escalation.status == status_filter)
    if trigger_type:
        query = query.where(Escalation.trigger_type == trigger_type)
    if assigned_to:
        query = query.where(Escalation.assigned_to_id == assigned_to)

    query = query.order_by(Escalation.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    escalations = result.scalars().all()

    return [_escalation_to_response(e) for e in escalations]


@router.get("/{escalation_id}", response_model=EscalationResponse)
async def get_escalation(
    escalation_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a specific escalation."""
    esc = await escalation_service.get_escalation(session, escalation_id)
    return _escalation_to_response(esc)


@router.post("", response_model=EscalationResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_escalation(
    escalation_in: EscalationCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Manually escalate a ticket (Project Lead / Admin only)."""
    esc = await escalation_service.create_manual_escalation(
        session,
        escalation_in.ticket_id,
        escalation_in.reason,
        escalation_in.assigned_to_id,
        current_user,
    )
    return _escalation_to_response(esc)


@router.patch("/{escalation_id}/acknowledge", response_model=EscalationResponse)
async def acknowledge_escalation(
    escalation_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Acknowledge an escalation (Senior Developer)."""
    esc = await escalation_service.acknowledge_escalation(session, escalation_id, current_user)
    return _escalation_to_response(esc)


@router.patch("/{escalation_id}/take-over", response_model=EscalationResponse)
async def take_over_escalation(
    escalation_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Take over a ticket via escalation (Senior Developer)."""
    esc = await escalation_service.take_over_escalation(session, escalation_id, current_user)
    return _escalation_to_response(esc)


@router.patch("/{escalation_id}/resolve", response_model=EscalationResponse)
async def resolve_escalation(
    escalation_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Resolve an escalation (Senior Developer)."""
    esc = await escalation_service.resolve_escalation(session, escalation_id, current_user)
    return _escalation_to_response(esc)
