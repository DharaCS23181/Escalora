import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse, TicketStatusUpdate, TicketAssignUpdate, TicketActivityResponse, TicketPriorityUpdate
from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity
from app.models.ticket_sla import TicketSLA
from app.models.sla_policy import SLAPolicy
from app.schemas.sla import TicketSLAResponse
from app.api.dependencies import get_current_user
from app.services import ticket_service

router = APIRouter(tags=["Tickets"])

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Create a new ticket.
    """
    return await ticket_service.create_ticket(session, ticket_in, current_user)

@router.get("", response_model=list[TicketResponse])
async def get_tickets(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    project_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    assignee_id: uuid.UUID | None = Query(None),
    skip: int = 0,
    limit: int = 100
):
    """
    Get tickets, optionally filtered.
    """
    # Simple project check for now
    query = select(Ticket).options(
        selectinload(Ticket.assignee), 
        selectinload(Ticket.created_by),
        selectinload(Ticket.sla).selectinload(TicketSLA.policy)
    )
    
    if project_id:
        query = query.where(Ticket.project_id == project_id)
    if status:
        query = query.where(Ticket.status == status)
    if priority:
        query = query.where(Ticket.priority == priority)
    if assignee_id:
        query = query.where(Ticket.assignee_id == assignee_id)
        
    query = query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    return list(result.scalars().all())

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get a specific ticket.
    """
    result = await session.execute(
        select(Ticket)
        .options(
            selectinload(Ticket.assignee), 
            selectinload(Ticket.created_by),
            selectinload(Ticket.sla).selectinload(TicketSLA.policy)
        )
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalars().first()
    if not ticket:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(
    ticket_id: uuid.UUID,
    status_in: TicketStatusUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Update ticket status.
    """
    return await ticket_service.update_ticket_status(session, ticket_id, status_in, current_user)

@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: uuid.UUID,
    assign_in: TicketAssignUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Assign a ticket.
    """
    return await ticket_service.assign_ticket(session, ticket_id, assign_in, current_user)

@router.patch("/{ticket_id}/priority", response_model=TicketResponse)
async def update_ticket_priority(
    ticket_id: uuid.UUID,
    priority_in: TicketPriorityUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Update a ticket's priority and recalculate SLA.
    """
    return await ticket_service.update_ticket_priority(session, ticket_id, priority_in.priority.value, current_user)

@router.get("/{ticket_id}/activity", response_model=list[TicketActivityResponse])
async def get_ticket_activity(
    ticket_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get ticket activity stream.
    """
    result = await session.execute(
        select(TicketActivity)
        .options(selectinload(TicketActivity.actor))
        .where(TicketActivity.ticket_id == ticket_id)
        .order_by(TicketActivity.created_at.desc())
    )
    return list(result.scalars().all())

@router.get("/{ticket_id}/sla", response_model=TicketSLAResponse)
async def get_ticket_sla(
    ticket_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get SLA details for a ticket.
    """
    result = await session.execute(
        select(TicketSLA)
        .options(selectinload(TicketSLA.policy))
        .where(TicketSLA.ticket_id == ticket_id)
    )
    sla = result.scalars().first()
    if not sla:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="SLA not found for this ticket")
    return sla

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Delete a ticket (only if CLOSED and by ADMIN/PROJECT_LEAD).
    """
    await ticket_service.delete_ticket(session, ticket_id, current_user)
