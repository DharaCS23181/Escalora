import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from datetime import datetime, UTC

async def create_notification(session: AsyncSession, notification_in: NotificationCreate) -> Notification:
    db_notification = Notification(**notification_in.model_dump())
    session.add(db_notification)
    await session.commit()
    await session.refresh(db_notification)
    return db_notification

async def get_user_notifications(session: AsyncSession, user_id: uuid.UUID, skip: int = 0, limit: int = 50) -> list[Notification]:
    result = await session.execute(
        select(Notification)
        .where(Notification.recipient_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())

async def get_unread_count(session: AsyncSession, user_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count(Notification.id))
        .where(Notification.recipient_id == user_id, Notification.is_read == False)
    )
    return result.scalar_one()

async def mark_as_read(session: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> Notification:
    result = await session.execute(
        select(Notification)
        .where(Notification.id == notification_id, Notification.recipient_id == user_id)
    )
    notification = result.scalars().first()
    
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        
    notification.is_read = True
    notification.read_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(notification)
    return notification

async def mark_all_as_read(session: AsyncSession, user_id: uuid.UUID):
    result = await session.execute(
        select(Notification)
        .where(Notification.recipient_id == user_id, Notification.is_read == False)
    )
    notifications = result.scalars().all()
    
    now = datetime.now(UTC)
    for n in notifications:
        n.is_read = True
        n.read_at = now
        
    await session.commit()
    return {"message": f"Marked {len(notifications)} notifications as read"}
