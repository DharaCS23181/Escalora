from app.workers.celery_app import celery_app
import logging
from app.services.email_service import send_invitation_email_sync, send_project_assignment_email_sync, send_ticket_assignment_email_sync

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
