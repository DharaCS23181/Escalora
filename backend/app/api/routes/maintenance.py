import logging
import hmac
from typing import Dict
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.config import settings
from app.services.sla_monitor import check_and_process_sla

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/sla-check", response_model=Dict[str, int | str])
async def trigger_sla_maintenance_check(
    x_maintenance_secret: str = Header(None),
    session: AsyncSession = Depends(get_db)
):
    """
    Internal endpoint to trigger SLA processing.
    Requires X-Maintenance-Secret header to match SLA_MAINTENANCE_SECRET.
    """
    if not x_maintenance_secret:
        logger.warning("Maintenance endpoint called without secret header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
        
    expected_secret = settings.SLA_MAINTENANCE_SECRET.encode('utf-8')
    provided_secret = x_maintenance_secret.encode('utf-8')
    
    if not hmac.compare_digest(expected_secret, provided_secret):
        logger.warning("Maintenance endpoint called with incorrect secret")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized"
        )
        
    try:
        stats = await check_and_process_sla(session)
        return {"status": "ok", **stats}
    except Exception as e:
        logger.error(f"SLA maintenance check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during maintenance check"
        )
