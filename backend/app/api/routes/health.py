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
    status_code=status.HTTP_200_OK,
    summary="Check API and service health",
    description="Returns the current health status of the Escalora API.",
    tags=["Health"],
    responses={
        200: {"description": "Successful health check"}
    }
)
async def health_check():
    return {"status": "ok"}
