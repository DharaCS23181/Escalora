import uuid
import logging
from datetime import datetime, UTC
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.escalation import Escalation, EscalationTriggerType, EscalationStatusEnum
from app.models.ticket import Ticket, EscalationStatus, TicketStatus
from app.models.ticket_sla import TicketSLA, SLAStatus
from app.models.ticket_activity import TicketActivity
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User, RoleEnum
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)


async def find_escalation_target(session: AsyncSession, project_id: uuid.UUID) -> User | None:
    """Find the first eligible Senior Developer in the project team."""
    result = await session.execute(
        select(ProjectMember)
        .options(selectinload(ProjectMember.user))
        .where(
            ProjectMember.project_id == project_id,
            ProjectMember.role == RoleEnum.SENIOR_DEVELOPER
        )
        .join(User)
        .where(User.status == "ACTIVE")
        .order_by(ProjectMember.joined_at.asc())
    )
    member = result.scalars().first()
    return member.user if member else None


async def get_escalation(session: AsyncSession, escalation_id: uuid.UUID) -> Escalation:
    """Get escalation by ID with all relationships loaded."""
    result = await session.execute(
        select(Escalation)
        .options(
            selectinload(Escalation.ticket).selectinload(Ticket.assignee),
            selectinload(Escalation.ticket).selectinload(Ticket.sla),
            selectinload(Escalation.project),
            selectinload(Escalation.triggered_by),
            selectinload(Escalation.assigned_to),
        )
        .where(Escalation.id == escalation_id)
    )
    escalation = result.scalars().first()
    if not escalation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found")
    return escalation


async def _has_active_escalation(session: AsyncSession, ticket_id: uuid.UUID) -> bool:
    """Check if ticket already has an active (OPEN or ACKNOWLEDGED) escalation."""
    result = await session.execute(
        select(func.count(Escalation.id))
        .where(
            Escalation.ticket_id == ticket_id,
            Escalation.status.in_([EscalationStatusEnum.OPEN, EscalationStatusEnum.ACKNOWLEDGED])
        )
    )
    return result.scalar_one() > 0


async def create_sla_breach_escalation(session: AsyncSession, ticket: Ticket, sla: TicketSLA) -> Escalation | None:
    """Create automatic escalation for SLA breach. Idempotent — returns None if already escalated."""
    # Guard: already escalated
    if ticket.escalation_status in [EscalationStatus.ESCALATED, EscalationStatus.ACKNOWLEDGED]:
        return None

    if await _has_active_escalation(session, ticket.id):
        return None

    now = datetime.now(UTC)

    # Find target Senior Developer
    target = await find_escalation_target(session, ticket.project_id)

    # Determine reason
    reason = "Resolution SLA breached"
    if sla.response_completed_at is None and now >= sla.response_due_at:
        reason = "Response SLA breached"

    # Create escalation record
    escalation = Escalation(
        ticket_id=ticket.id,
        project_id=ticket.project_id,
        trigger_type=EscalationTriggerType.SLA_BREACH,
        reason=reason,
        triggered_by_id=None,  # System-triggered
        assigned_to_id=target.id if target else None,
        status=EscalationStatusEnum.OPEN,
    )
    session.add(escalation)

    # Update ticket escalation state
    ticket.escalation_status = EscalationStatus.ESCALATED
    ticket.escalated_at = now
    ticket.escalated_to_id = target.id if target else None

    # Log activity
    activity = TicketActivity(
        ticket_id=ticket.id,
        actor_id=None,
        action="ESCALATED",
        old_value=None,
        new_value=f"Automatically escalated to {target.full_name}" if target else "Automatically escalated (no Senior Developer available)",
    )
    session.add(activity)

    # Notifications
    if target:
        # Notify Senior Developer
        notif = NotificationCreate(
            recipient_id=target.id,
            actor_id=None,
            type="TICKET_ESCALATED",
            title="Ticket Escalated",
            message=f"{ticket.ticket_key} has been escalated to you because its SLA was breached.",
            ticket_id=ticket.id,
            project_id=ticket.project_id,
        )
        await create_notification(session, notif)

    # Notify Project Lead if no target or always
    project_result = await session.execute(
        select(Project).where(Project.id == ticket.project_id)
    )
    project = project_result.scalars().first()
    if project and project.project_lead_id:
        lead_msg = (
            f"{ticket.ticket_key} has breached its SLA and was escalated to {target.full_name}."
            if target
            else f"{ticket.ticket_key} has breached its SLA but no eligible Senior Developer is available."
        )
        lead_notif = NotificationCreate(
            recipient_id=project.project_lead_id,
            actor_id=None,
            type="TICKET_ESCALATED",
            title="Ticket Escalated",
            message=lead_msg,
            ticket_id=ticket.id,
            project_id=ticket.project_id,
        )
        await create_notification(session, lead_notif)

    # Notify original developer
    if ticket.assignee_id and (not target or ticket.assignee_id != target.id):
        dev_notif = NotificationCreate(
            recipient_id=ticket.assignee_id,
            actor_id=None,
            type="TICKET_ESCALATED",
            title="Ticket Escalated",
            message=f"{ticket.ticket_key} has been escalated to {target.full_name}." if target else f"{ticket.ticket_key} has been escalated.",
            ticket_id=ticket.id,
            project_id=ticket.project_id,
        )
        await create_notification(session, dev_notif)

    await session.flush()  # Flush so escalation gets an ID before commit

    # Queue email after flush (will be sent after commit via Celery)
    if target:
        from app.workers.tasks import send_escalation_email
        send_escalation_email.delay(
            target.email,
            target.full_name,
            ticket.ticket_key,
            ticket.title,
            project.name if project else "Unknown",
            ticket.priority.value,
            reason,
            target.full_name,
        )

    logger.info(f"Escalation created for ticket {ticket.ticket_key} -> {target.full_name if target else 'NO TARGET'}")
    return escalation


async def create_manual_escalation(
    session: AsyncSession,
    ticket_id: uuid.UUID,
    reason: str,
    assigned_to_id: uuid.UUID | None,
    current_user: User,
) -> Escalation:
    """Create manual escalation by Project Lead or Admin."""
    # RBAC
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.PROJECT_LEAD]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to escalate tickets")

    # Load ticket
    ticket_result = await session.execute(
        select(Ticket)
        .options(selectinload(Ticket.assignee), selectinload(Ticket.sla))
        .where(Ticket.id == ticket_id)
    )
    ticket = ticket_result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    # Check not already escalated
    if await _has_active_escalation(session, ticket.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This ticket is already escalated")

    # Validate target if provided
    target = None
    if assigned_to_id:
        target_result = await session.execute(select(User).where(User.id == assigned_to_id))
        target = target_result.scalars().first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")
        if target.role != RoleEnum.SENIOR_DEVELOPER:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Escalation target must be a Senior Developer")
        # Verify membership
        member_result = await session.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == ticket.project_id,
                ProjectMember.user_id == assigned_to_id,
            )
        )
        if not member_result.scalars().first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senior Developer is not a member of this project")

    now = datetime.now(UTC)

    escalation = Escalation(
        ticket_id=ticket.id,
        project_id=ticket.project_id,
        trigger_type=EscalationTriggerType.MANUAL,
        reason=reason,
        triggered_by_id=current_user.id,
        assigned_to_id=assigned_to_id,
        status=EscalationStatusEnum.OPEN,
    )
    session.add(escalation)

    ticket.escalation_status = EscalationStatus.ESCALATED
    ticket.escalated_at = now
    ticket.escalated_to_id = assigned_to_id

    activity = TicketActivity(
        ticket_id=ticket.id,
        actor_id=current_user.id,
        action="ESCALATED",
        old_value=None,
        new_value=f"Manually escalated by {current_user.full_name}" + (f" to {target.full_name}" if target else ""),
    )
    session.add(activity)

    # Notify target
    if target:
        notif = NotificationCreate(
            recipient_id=target.id,
            actor_id=current_user.id,
            type="TICKET_ESCALATED",
            title="Ticket Escalated",
            message=f"{ticket.ticket_key} has been escalated to you by {current_user.full_name}. Reason: {reason}",
            ticket_id=ticket.id,
            project_id=ticket.project_id,
        )
        await create_notification(session, notif)

    await session.commit()

    # Queue email after commit
    if target:
        project_result = await session.execute(select(Project).where(Project.id == ticket.project_id))
        project = project_result.scalars().first()
        from app.workers.tasks import send_escalation_email
        send_escalation_email.delay(
            target.email,
            target.full_name,
            ticket.ticket_key,
            ticket.title,
            project.name if project else "Unknown",
            ticket.priority.value,
            reason,
            target.full_name,
        )

    return await get_escalation(session, escalation.id)


async def acknowledge_escalation(session: AsyncSession, escalation_id: uuid.UUID, current_user: User) -> Escalation:
    """Senior Developer acknowledges an escalation."""
    escalation = await get_escalation(session, escalation_id)

    if escalation.status != EscalationStatusEnum.OPEN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Escalation is not in OPEN state")

    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.SENIOR_DEVELOPER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if escalation.assigned_to_id and escalation.assigned_to_id != current_user.id and current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This escalation is not assigned to you")

    now = datetime.now(UTC)
    escalation.status = EscalationStatusEnum.ACKNOWLEDGED
    escalation.acknowledged_at = now

    # Update ticket
    escalation.ticket.escalation_status = EscalationStatus.ACKNOWLEDGED

    activity = TicketActivity(
        ticket_id=escalation.ticket_id,
        actor_id=current_user.id,
        action="ESCALATION_ACKNOWLEDGED",
        old_value="OPEN",
        new_value="ACKNOWLEDGED",
    )
    session.add(activity)

    await session.commit()
    return await get_escalation(session, escalation_id)


async def take_over_escalation(session: AsyncSession, escalation_id: uuid.UUID, current_user: User) -> Escalation:
    """Senior Developer takes over the ticket."""
    escalation = await get_escalation(session, escalation_id)

    if escalation.status not in [EscalationStatusEnum.OPEN, EscalationStatusEnum.ACKNOWLEDGED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Escalation is not active")

    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.SENIOR_DEVELOPER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if escalation.assigned_to_id and escalation.assigned_to_id != current_user.id and current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This escalation is not assigned to you")

    now = datetime.now(UTC)
    old_assignee_id = escalation.ticket.assignee_id

    # Auto-acknowledge if still OPEN
    if escalation.status == EscalationStatusEnum.OPEN:
        escalation.status = EscalationStatusEnum.ACKNOWLEDGED
        escalation.acknowledged_at = now

    # Change ticket assignee
    escalation.ticket.assignee_id = current_user.id
    escalation.ticket.escalation_status = EscalationStatus.ACKNOWLEDGED
    escalation.ticket.escalated_to_id = current_user.id

    # Update escalation assigned_to if it was different
    escalation.assigned_to_id = current_user.id

    activity = TicketActivity(
        ticket_id=escalation.ticket_id,
        actor_id=current_user.id,
        action="ESCALATION_TAKEN_OVER",
        old_value=str(old_assignee_id) if old_assignee_id else "Unassigned",
        new_value=str(current_user.id),
    )
    session.add(activity)

    # Notify original assignee
    if old_assignee_id and old_assignee_id != current_user.id:
        notif = NotificationCreate(
            recipient_id=old_assignee_id,
            actor_id=current_user.id,
            type="ESCALATION_TAKEN_OVER",
            title="Ticket Taken Over",
            message=f"{current_user.full_name} has taken over {escalation.ticket.ticket_key} following escalation.",
            ticket_id=escalation.ticket_id,
            project_id=escalation.project_id,
        )
        await create_notification(session, notif)

    await session.commit()
    return await get_escalation(session, escalation_id)


async def resolve_escalation(session: AsyncSession, escalation_id: uuid.UUID, current_user: User) -> Escalation:
    """Resolve an escalation."""
    escalation = await get_escalation(session, escalation_id)

    if escalation.status not in [EscalationStatusEnum.OPEN, EscalationStatusEnum.ACKNOWLEDGED]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Escalation is not active")

    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.SENIOR_DEVELOPER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if escalation.assigned_to_id and escalation.assigned_to_id != current_user.id and current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This escalation is not assigned to you")

    now = datetime.now(UTC)
    escalation.status = EscalationStatusEnum.RESOLVED
    escalation.resolved_at = now

    escalation.ticket.escalation_status = EscalationStatus.RESOLVED

    activity = TicketActivity(
        ticket_id=escalation.ticket_id,
        actor_id=current_user.id,
        action="ESCALATION_RESOLVED",
        old_value="ACKNOWLEDGED",
        new_value="RESOLVED",
    )
    session.add(activity)

    await session.commit()
    return await get_escalation(session, escalation_id)


async def get_escalation_metrics(session: AsyncSession, project_ids: list[uuid.UUID] | None = None) -> dict:
    """Get escalation metrics, optionally filtered by project IDs."""
    base_query = select(func.count(Escalation.id))
    if project_ids:
        base_query = base_query.where(Escalation.project_id.in_(project_ids))

    open_q = await session.execute(base_query.where(Escalation.status == EscalationStatusEnum.OPEN))
    ack_q = await session.execute(base_query.where(Escalation.status == EscalationStatusEnum.ACKNOWLEDGED))
    resolved_q = await session.execute(base_query.where(Escalation.status == EscalationStatusEnum.RESOLVED))

    today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    today_q = await session.execute(base_query.where(Escalation.created_at >= today_start))

    return {
        "open_count": open_q.scalar_one(),
        "acknowledged_count": ack_q.scalar_one(),
        "resolved_count": resolved_q.scalar_one(),
        "today_count": today_q.scalar_one(),
    }
