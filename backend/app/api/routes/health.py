from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings
import redis.asyncio as redis
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
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
        
    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL)
        await r.ping()
        health_status["redis"] = "connected"
        await r.aclose()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["redis"] = "disconnected"

    return health_status
