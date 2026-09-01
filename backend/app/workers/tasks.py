from app.workers.celery_app import celery_app
import logging
from app.services.email_service import send_invitation_email_sync, send_project_assignment_email_sync, send_ticket_assignment_email_sync, send_escalation_email_sync

logger = logging.getLogger(__name__)

@celery_app.task
def health_check_task():
    logger.info("Health check task executed successfully!")
    return "ok"

@celery_app.task(bind=True, max_retries=3)
def send_invitation_email(self, email: str, name: str, pin: str):
    logger.info(f"Executing Celery task: send_invitation_email to {email}")
    try:
        success = send_invitation_email_sync(email, name, pin)
        if not success:
            raise Exception("SMTP dispatch failed")
    except Exception as exc:
        logger.error(f"Failed to send email to {email}: {exc}")
        self.retry(exc=exc, countdown=60)

@celery_app.task(bind=True, max_retries=3)
def send_project_assignment_email(self, email: str, name: str, project_name: str, role: str):
    logger.info(f"Executing Celery task: send_project_assignment_email to {email}")
    try:
        success = send_project_assignment_email_sync(email, name, project_name, role)
        if not success:
            raise Exception("SMTP dispatch failed")
    except Exception as exc:
        logger.error(f"Failed to send email to {email}: {exc}")
        self.retry(exc=exc, countdown=60)

@celery_app.task(bind=True, max_retries=3)
def send_ticket_assignment_email(self, email: str, name: str, ticket_key: str, ticket_title: str, project_name: str, priority: str, assigned_by_name: str):
    logger.info(f"Executing Celery task: send_ticket_assignment_email to {email}")
    try:
        success = send_ticket_assignment_email_sync(email, name, ticket_key, ticket_title, project_name, priority, assigned_by_name)
        if not success:
            raise Exception("SMTP dispatch failed")
    except Exception as exc:
        logger.error(f"Failed to send email to {email}: {exc}")
        self.retry(exc=exc, countdown=60)

@celery_app.task(bind=True, max_retries=3)
def send_escalation_email(self, email: str, name: str, ticket_key: str, ticket_title: str, project_name: str, priority: str, reason: str, escalated_to_name: str):
    logger.info(f"Executing Celery task: send_escalation_email to {email}")
    try:
        success = send_escalation_email_sync(email, name, ticket_key, ticket_title, project_name, priority, reason, escalated_to_name)
        if not success:
            raise Exception("SMTP dispatch failed")
    except Exception as exc:
        logger.error(f"Failed to send escalation email to {email}: {exc}")
        self.retry(exc=exc, countdown=60)

import asyncio
from datetime import datetime, UTC
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.ticket_sla import TicketSLA, SLAStatus
from app.models.ticket import Ticket, EscalationStatus
from app.models.sla_policy import SLAPolicy
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from app.services.notification_service import create_notification

@celery_app.task
def check_sla_status():
    logger.info("Executing Celery task: check_sla_status")
    asyncio.run(check_sla_status_async())

async def check_sla_status_async():
    now = datetime.now(UTC)
    async with AsyncSessionLocal() as session:
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
        
        for sla in slas:
            # Resolution SLA logic
            if not sla.resolution_completed_at:
                if now >= sla.resolution_due_at:
                    if sla.status != SLAStatus.BREACHED:
                        sla.status = SLAStatus.BREACHED
                        sla.breached_at = now
                        await trigger_sla_notification(session, sla, "BREACHED")
                else:
                    threshold = sla.policy.resolution_time_minutes * (sla.policy.at_risk_threshold_percent / 100.0)
                    if (sla.resolution_due_at - now).total_seconds() / 60 <= threshold:
                        if sla.status != SLAStatus.AT_RISK:
                            sla.status = SLAStatus.AT_RISK
                            await trigger_sla_notification(session, sla, "AT_RISK")
            
            # Response SLA Logic (If response breaches before resolution)
            if not sla.response_completed_at and now >= sla.response_due_at:
                if sla.status != SLAStatus.BREACHED:
                     sla.status = SLAStatus.BREACHED
                     sla.breached_at = now
                     await trigger_sla_notification(session, sla, "BREACHED")
                     
        await session.commit()

    # Phase 6: Process escalations for breached SLAs
    await process_sla_breach_escalations()

async def trigger_sla_notification(session, sla, event_type):
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


async def process_sla_breach_escalations():
    """Find breached SLAs that haven't been escalated yet and create escalations."""
    from app.services.escalation_service import create_sla_breach_escalation

    async with AsyncSessionLocal() as session:
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
            except Exception as e:
                logger.error(f"Failed to escalate ticket {sla.ticket.ticket_key}: {e}")
                await session.rollback()
                continue

        await session.commit()
        logger.info("Escalation processing complete")
