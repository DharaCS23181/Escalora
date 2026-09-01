import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.ticket import Ticket, TicketStatus, EscalationStatus
from app.models.ticket_activity import TicketActivity
from app.models.project import Project
from app.models.user import User
from app.models.notification import Notification
from app.models.project_member import ProjectMember
from app.models.sla_policy import SLAPolicy
from app.models.ticket_sla import TicketSLA, SLAStatus
from datetime import timedelta
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketStatusUpdate, TicketAssignUpdate
from app.schemas.notification import NotificationCreate
from app.services.notification_service import create_notification
from app.workers.tasks import send_ticket_assignment_email
from datetime import datetime, UTC

def check_project_access(session: AsyncSession, project_id: uuid.UUID, user: User) -> bool:
    # Normally we check if user is a member of the project or admin.
    if user.role == "ADMIN":
        return True
    return True # We will do proper queries below

from sqlalchemy.orm import selectinload

async def get_ticket(session: AsyncSession, ticket_id: uuid.UUID) -> Ticket:
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket

async def get_project(session: AsyncSession, project_id: uuid.UUID) -> Project:
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

async def log_activity(session: AsyncSession, ticket_id: uuid.UUID, actor_id: uuid.UUID, action: str, old_val: str = None, new_val: str = None):
    activity = TicketActivity(
        ticket_id=ticket_id,
        actor_id=actor_id,
        action=action,
        old_value=old_val,
        new_value=new_val
    )
    session.add(activity)

async def create_ticket(session: AsyncSession, ticket_in: TicketCreate, current_user: User) -> Ticket:
    # Only PROJECT_LEAD can create tickets, or ADMIN
    if current_user.role.value not in ["ADMIN", "PROJECT_LEAD"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create tickets")
        
    project = await get_project(session, ticket_in.project_id)
    
    # Generate Key: ProjectKey-COUNT+1
    count_result = await session.execute(
        select(func.count(Ticket.id)).where(Ticket.project_id == project.id)
    )
    ticket_count = count_result.scalar_one()
    new_key = f"{project.key}-{ticket_count + 1}"
    
    db_ticket = Ticket(
        **ticket_in.model_dump(exclude_unset=True),
        ticket_key=new_key,
        created_by_id=current_user.id
    )
    
    session.add(db_ticket)
    await session.commit()
    await session.refresh(db_ticket)
    
    await log_activity(session, db_ticket.id, current_user.id, "CREATED")
    
    # SLA Assignment
    policy_result = await session.execute(
        select(SLAPolicy)
        .where(SLAPolicy.priority == db_ticket.priority, SLAPolicy.active == True)
    )
    policy = policy_result.scalars().first()
    if policy:
        now = datetime.now(UTC)
        ticket_sla = TicketSLA(
            ticket_id=db_ticket.id,
            policy_id=policy.id,
            response_started_at=now,
            response_due_at=now + timedelta(minutes=policy.response_time_minutes),
            resolution_started_at=now,
            resolution_due_at=now + timedelta(minutes=policy.resolution_time_minutes),
            status=SLAStatus.ON_TRACK
        )
        session.add(ticket_sla)
    
    if db_ticket.assignee_id:
        await handle_assignment_notifications(session, db_ticket, current_user, project)
        
    await session.commit()
    return await get_ticket(session, db_ticket.id)

async def handle_assignment_notifications(session: AsyncSession, ticket: Ticket, current_user: User, project: Project):
    if not ticket.assignee_id or ticket.assignee_id == current_user.id:
        return
        
    assignee_result = await session.execute(select(User).where(User.id == ticket.assignee_id))
    assignee = assignee_result.scalars().first()
    
    if not assignee:
        return
        
    # Create notification
    notif = NotificationCreate(
        recipient_id=assignee.id,
        actor_id=current_user.id,
        type="TICKET_ASSIGNED",
        title="Ticket Assigned",
        message=f"{current_user.full_name} assigned {ticket.ticket_key} to you.",
        ticket_id=ticket.id,
        project_id=project.id
    )
    await create_notification(session, notif)
    
    # Trigger Email
    send_ticket_assignment_email.delay(
        assignee.email,
        assignee.full_name,
        ticket.ticket_key,
        ticket.title,
        project.name,
        ticket.priority.value,
        current_user.full_name
    )

async def update_ticket_status(session: AsyncSession, ticket_id: uuid.UUID, status_in: TicketStatusUpdate, current_user: User) -> Ticket:
    ticket = await get_ticket(session, ticket_id)
    old_status = ticket.status.value
    new_status = status_in.status.value
    
    if old_status == new_status:
        return ticket
        
    # Check permissions
    if current_user.role.value == "DEVELOPER":
        if ticket.assignee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot change status of a ticket not assigned to you")
            
    ticket.status = status_in.status
    if status_in.status == TicketStatus.RESOLVED:
        ticket.resolved_at = datetime.now(UTC)
        
    # SLA Transitions
    if ticket.sla:
        now = datetime.now(UTC)
        if old_status == TicketStatus.OPEN and new_status == TicketStatus.IN_PROGRESS:
            if not ticket.sla.response_completed_at:
                ticket.sla.response_completed_at = now
        elif old_status == TicketStatus.IN_PROGRESS and new_status == TicketStatus.ON_HOLD:
            if not ticket.sla.paused_at:
                ticket.sla.paused_at = now
                if ticket.sla.status in [SLAStatus.ON_TRACK, SLAStatus.AT_RISK]:
                    ticket.sla.status = SLAStatus.PAUSED
        elif old_status == TicketStatus.ON_HOLD and new_status == TicketStatus.IN_PROGRESS:
            if ticket.sla.paused_at:
                pause_duration = (now - ticket.sla.paused_at).total_seconds()
                ticket.sla.total_pause_seconds += int(pause_duration)
                ticket.sla.resolution_due_at = ticket.sla.resolution_due_at + timedelta(seconds=pause_duration)
                ticket.sla.paused_at = None
                
                if ticket.sla.status == SLAStatus.PAUSED:
                    if now >= ticket.sla.resolution_due_at:
                        ticket.sla.status = SLAStatus.BREACHED
                    else:
                        threshold = ticket.sla.policy.resolution_time_minutes * (ticket.sla.policy.at_risk_threshold_percent / 100.0)
                        if (ticket.sla.resolution_due_at - now).total_seconds() / 60 <= threshold:
                            ticket.sla.status = SLAStatus.AT_RISK
                        else:
                            ticket.sla.status = SLAStatus.ON_TRACK
        elif new_status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            if not ticket.sla.resolution_completed_at:
                ticket.sla.resolution_completed_at = now
                if ticket.sla.status != SLAStatus.BREACHED:
                    ticket.sla.status = SLAStatus.COMPLETED
                    
    await log_activity(session, ticket.id, current_user.id, "STATUS_CHANGED", old_status, new_status)
    await session.commit()
    return await get_ticket(session, ticket.id)

async def update_ticket_priority(session: AsyncSession, ticket_id: uuid.UUID, new_priority: str, current_user: User) -> Ticket:
    ticket = await get_ticket(session, ticket_id)
    old_priority = ticket.priority.value
    if old_priority == new_priority:
        return ticket
        
    if current_user.role.value not in ["ADMIN", "PROJECT_LEAD"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to change priority")
        
    ticket.priority = new_priority
    
    # Recalculate SLA
    policy_result = await session.execute(
        select(SLAPolicy)
        .where(SLAPolicy.priority == new_priority, SLAPolicy.active == True)
    )
    policy = policy_result.scalars().first()
    
    now = datetime.now(UTC)
    if policy:
        if ticket.sla:
            ticket.sla.policy_id = policy.id
            ticket.sla.response_started_at = now
            ticket.sla.response_due_at = now + timedelta(minutes=policy.response_time_minutes)
            ticket.sla.response_completed_at = None
            ticket.sla.resolution_started_at = now
            ticket.sla.resolution_due_at = now + timedelta(minutes=policy.resolution_time_minutes)
            ticket.sla.resolution_completed_at = None
            ticket.sla.status = SLAStatus.ON_TRACK
            ticket.sla.paused_at = None
            ticket.sla.total_pause_seconds = 0
            ticket.sla.breached_at = None
        else:
            ticket_sla = TicketSLA(
                ticket_id=ticket.id,
                policy_id=policy.id,
                response_started_at=now,
                response_due_at=now + timedelta(minutes=policy.response_time_minutes),
                resolution_started_at=now,
                resolution_due_at=now + timedelta(minutes=policy.resolution_time_minutes),
                status=SLAStatus.ON_TRACK
            )
            session.add(ticket_sla)
            
    await log_activity(session, ticket.id, current_user.id, "PRIORITY_CHANGED", old_priority, new_priority)
    await session.commit()
    return await get_ticket(session, ticket.id)

async def assign_ticket(session: AsyncSession, ticket_id: uuid.UUID, assign_in: TicketAssignUpdate, current_user: User) -> Ticket:
    ticket = await get_ticket(session, ticket_id)
    project = await get_project(session, ticket.project_id)
    old_assignee_id = ticket.assignee_id
    new_assignee_id = assign_in.assignee_id
    
    if old_assignee_id == new_assignee_id:
        return ticket
        
    if current_user.role.value == "DEVELOPER":
        if new_assignee_id != current_user.id or old_assignee_id is not None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Developers can only assign unassigned tickets to themselves")
            
    ticket.assignee_id = new_assignee_id
    await log_activity(session, ticket.id, current_user.id, "ASSIGNED", str(old_assignee_id) if old_assignee_id else "Unassigned", str(new_assignee_id) if new_assignee_id else "Unassigned")
    
    if new_assignee_id:
        await handle_assignment_notifications(session, ticket, current_user, project)
        
    await session.commit()
    return await get_ticket(session, ticket.id)

async def delete_ticket(session: AsyncSession, ticket_id: uuid.UUID, current_user: User):
    ticket = await get_ticket(session, ticket_id)
    
    if current_user.role.value not in ["ADMIN", "PROJECT_LEAD"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete tickets")
        
    if ticket.status.value != "CLOSED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CLOSED tickets can be deleted")
        
    await session.delete(ticket)
    await session.commit()
