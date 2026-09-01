import uuid
from datetime import datetime, UTC
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.sla_policy import SLAPolicy
from app.models.ticket_sla import TicketSLA, SLAStatus
from app.models.ticket import Ticket, TicketStatus
from app.models.project import Project
from app.models.user import User
from app.schemas.sla import SLAPolicyCreate, SLAPolicyUpdate, SLAOverviewResponse

async def get_policies(session: AsyncSession) -> list[SLAPolicy]:
    result = await session.execute(select(SLAPolicy).order_by(SLAPolicy.priority))
    return list(result.scalars().all())

async def get_policy(session: AsyncSession, policy_id: uuid.UUID) -> SLAPolicy:
    result = await session.execute(select(SLAPolicy).where(SLAPolicy.id == policy_id))
    policy = result.scalars().first()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SLA Policy not found")
    return policy

async def create_policy(session: AsyncSession, policy_in: SLAPolicyCreate) -> SLAPolicy:
    policy = SLAPolicy(**policy_in.model_dump())
    session.add(policy)
    await session.commit()
    await session.refresh(policy)
    return policy

async def update_policy(session: AsyncSession, policy_id: uuid.UUID, policy_in: SLAPolicyUpdate) -> SLAPolicy:
    policy = await get_policy(session, policy_id)
    update_data = policy_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(policy, key, value)
    await session.commit()
    await session.refresh(policy)
    return policy

async def get_sla_overview(session: AsyncSession, current_user: User) -> SLAOverviewResponse:
    # Query for SLA overview
    query = select(TicketSLA).join(TicketSLA.ticket)
    
    if current_user.role.value != "ADMIN":
        # Limit to accessible projects
        query = query.join(Project, Ticket.project_id == Project.id)
        if current_user.role.value == "PROJECT_LEAD":
            query = query.where(Project.project_lead_id == current_user.id)
        # Developers don't get project overview, but we return their tickets
        elif current_user.role.value in ["DEVELOPER", "SENIOR_DEVELOPER"]:
            query = query.where(Ticket.assignee_id == current_user.id)
            
    result = await session.execute(query)
    slas = result.scalars().all()
    
    total_active_tickets = 0
    on_track_count = 0
    at_risk_count = 0
    breached_count = 0
    completed_count = 0
    
    total_response_durations = 0
    total_resolution_durations = 0
    response_met_count = 0
    resolution_met_count = 0
    
    for sla in slas:
        if sla.ticket.status not in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            total_active_tickets += 1
            if sla.status == SLAStatus.ON_TRACK:
                on_track_count += 1
            elif sla.status == SLAStatus.AT_RISK:
                at_risk_count += 1
            elif sla.status == SLAStatus.BREACHED:
                breached_count += 1
            elif sla.status == SLAStatus.COMPLETED:
                completed_count += 1
        
        # Calculate response metrics
        if sla.response_completed_at:
            duration = (sla.response_completed_at - sla.response_started_at).total_seconds() / 60
            total_response_durations += duration
            if sla.response_completed_at <= sla.response_due_at:
                response_met_count += 1
                
        # Calculate resolution metrics
        if sla.resolution_completed_at:
            duration = (sla.resolution_completed_at - sla.resolution_started_at).total_seconds() / 60
            total_resolution_durations += duration
            if sla.resolution_completed_at <= sla.resolution_due_at:
                resolution_met_count += 1

    total_slas_response = len([s for s in slas if s.response_completed_at])
    total_slas_resolution = len([s for s in slas if s.resolution_completed_at])
    
    return SLAOverviewResponse(
        total_active_tickets=total_active_tickets,
        on_track_count=on_track_count,
        at_risk_count=at_risk_count,
        breached_count=breached_count,
        completed_count=completed_count,
        response_sla_compliance=(response_met_count / total_slas_response * 100) if total_slas_response > 0 else 100.0,
        resolution_sla_compliance=(resolution_met_count / total_slas_resolution * 100) if total_slas_resolution > 0 else 100.0,
        average_response_minutes=(total_response_durations / total_slas_response) if total_slas_response > 0 else 0,
        average_resolution_minutes=(total_resolution_durations / total_slas_resolution) if total_slas_resolution > 0 else 0,
    )
