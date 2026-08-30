from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
from app.schemas.health import HealthResponse
import redis.asyncio as redis
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
import redis.asyncio as redis
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Check API and service health",
    description="Returns the current health status of the Escalora API and its required infrastructure services.",
    tags=["Health"],
    responses={
        200: {"description": "Successful health check"},
        503: {"description": "Service unavailable"}
    }
)
async def health_check(response: Response, db: AsyncSession = Depends(get_db)):
    health_status = {
        "status": "ok",
        "database": "unknown",
        "redis": "unknown"
    }
    
    # Check Database
    try:
        await db.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["database"] = "disconnected"
        health_status["status"] = "degraded"
        
    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        health_status["redis"] = "connected"
        await r.aclose()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["redis"] = "disconnected"
        health_status["status"] = "degraded"

    if health_status["status"] == "degraded":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return health_status
