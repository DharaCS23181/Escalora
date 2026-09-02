import time
import asyncio
import logging
from datetime import datetime, UTC
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import BackgroundTasks

from app.db.session import AsyncSessionLocal
from app.models.ticket_sla import TicketSLA, SLAStatus
from app.models.ticket import Ticket, EscalationStatus
from app.models.sla_policy import SLAPolicy
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)

_last_sla_check_time = 0
_sla_check_lock = asyncio.Lock()

def schedule_sla_check_if_needed(background_tasks: BackgroundTasks):
    """
    Schedules an SLA check in the background if more than 60 seconds 
    have passed since the last check on this instance.
    """
    global _last_sla_check_time
    if time.time() - _last_sla_check_time >= 60:
        background_tasks.add_task(run_throttled_sla_check)

async def run_throttled_sla_check():
    """
    Executes the SLA maintenance check at most once per 60 seconds.
    """
    global _last_sla_check_time
    # Safe double-checked locking for async environment
    if time.time() - _last_sla_check_time < 60:
        return
        
    async with _sla_check_lock:
        if time.time() - _last_sla_check_time < 60:
            return
        
        # update time immediately to prevent concurrent executions
        _last_sla_check_time = time.time()
        
    try:
        async with AsyncSessionLocal() as session:
            await check_and_process_sla(session)
    except Exception as e:
        logger.error(f"Background SLA maintenance check failed: {e}")

async def check_and_process_sla(session):
    """
    Evaluate SLA statuses and triggers notifications/escalations.
    """
    logger.info("Executing SLA maintenance check")
    stats = {"processed": 0, "at_risk": 0, "breached": 0, "escalated": 0}
    now = datetime.now(UTC)
    
    # 1. Find tickets that require SLA evaluation
    query = (
        select(TicketSLA)
        .join(Ticket)
        .join(SLAPolicy)
        .options(
            selectinload(TicketSLA.ticket).selectinload(Ticket.assignee),
            selectinload(TicketSLA.policy)
        )
        .where(
            TicketSLA.status.in_([SLAStatus.ON_TRACK, SLAStatus.AT_RISK])
        )
    )
    result = await session.execute(query)
    slas = result.scalars().all()
    stats["processed"] = len(slas)
    
    for sla in slas:
        # Resolution SLA logic
        if not sla.resolution_completed_at:
            if now >= sla.resolution_due_at:
                if sla.status != SLAStatus.BREACHED:
                    sla.status = SLAStatus.BREACHED
                    sla.breached_at = now
                    await _trigger_sla_notification(session, sla, "BREACHED")
                    stats["breached"] += 1
            else:
                threshold = sla.policy.resolution_time_minutes * (sla.policy.at_risk_threshold_percent / 100.0)
                if (sla.resolution_due_at - now).total_seconds() / 60 <= threshold:
                    if sla.status != SLAStatus.AT_RISK:
                        sla.status = SLAStatus.AT_RISK
                        await _trigger_sla_notification(session, sla, "AT_RISK")
                        stats["at_risk"] += 1
        
        # Response SLA Logic (If response breaches before resolution)
        if not sla.response_completed_at and now >= sla.response_due_at:
            if sla.status != SLAStatus.BREACHED:
                 sla.status = SLAStatus.BREACHED
                 sla.breached_at = now
                 await _trigger_sla_notification(session, sla, "BREACHED")
                 stats["breached"] += 1
                 
    await session.commit()

    # 2. Process escalations for breached SLAs
    stats["escalated"] = await _process_sla_breach_escalations(session)
    return stats


async def _trigger_sla_notification(session, sla, event_type):
    if not sla.ticket.assignee_id:
        return
        
    existing_notif = await session.execute(
        select(Notification).where(
            Notification.ticket_id == sla.ticket_id,
            Notification.type == f"SLA_{event_type}"
        )
    )
    if existing_notif.scalars().first():
        return
        
    title = f"SLA {event_type.replace('_', ' ').title()}"
    msg = f"Ticket {sla.ticket.ticket_key} is {event_type.replace('_', ' ').lower()} for its SLA Policy: {sla.policy.name}."
    
    notif = NotificationCreate(
        recipient_id=sla.ticket.assignee_id,
        actor_id=None,
        type=f"SLA_{event_type}",
        title=title,
        message=msg,
        ticket_id=sla.ticket_id,
        project_id=sla.ticket.project_id
    )
    await create_notification(session, notif)


async def _process_sla_breach_escalations(session):
    """Find breached SLAs that haven't been escalated yet and create escalations."""
    from app.services.escalation_service import create_sla_breach_escalation
    escalated_count = 0

    # Find tickets with BREACHED SLA that are NOT yet escalated
    query = (
        select(TicketSLA)
        .join(Ticket)
        .options(
            selectinload(TicketSLA.ticket).selectinload(Ticket.assignee),
            selectinload(TicketSLA.ticket).selectinload(Ticket.sla),
            selectinload(TicketSLA.policy),
        )
        .where(
            TicketSLA.status == SLAStatus.BREACHED,
            Ticket.escalation_status == EscalationStatus.NONE,
            Ticket.status.notin_(["RESOLVED", "CLOSED"]),
        )
    )
    result = await session.execute(query)
    breached_slas = result.scalars().all()

    if breached_slas:
        logger.info(f"Processing {len(breached_slas)} breached SLAs for escalation")

    for sla in breached_slas:
        try:
            await create_sla_breach_escalation(session, sla.ticket, sla)
            escalated_count += 1
        except Exception as e:
            logger.error(f"Failed to escalate ticket {sla.ticket.ticket_key}: {e}")
            await session.rollback()
            continue

    await session.commit()
    return escalated_count
