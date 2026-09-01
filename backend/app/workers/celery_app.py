from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Default to the 'celery' queue for all tasks
# celery_app.conf.task_routes = {"app.workers.tasks.*": "main-queue"}
# Example celery beat schedule config for the future
celery_app.conf.beat_schedule = {
    'health_check_every_hour': {
        'task': 'app.workers.tasks.health_check_task',
        'schedule': 3600.0, # Run every hour instead of every 10 seconds
    },
}
