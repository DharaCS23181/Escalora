import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services import notification_service

router = APIRouter(tags=["Notifications"])

@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 50
):
    """
    Get user notifications.
    """
    return await notification_service.get_user_notifications(session, current_user.id, skip=skip, limit=limit)

@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get unread notification count.
    """
    count = await notification_service.get_unread_count(session, current_user.id)
    return {"count": count}

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Mark a specific notification as read.
    """
    return await notification_service.mark_as_read(session, notification_id, current_user.id)

@router.patch("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Mark all unread notifications as read.
    """
    return await notification_service.mark_all_as_read(session, current_user.id)
