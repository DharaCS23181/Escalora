from app.workers.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def health_check_task():
    logger.info("Health check task executed successfully!")
    return "ok"
