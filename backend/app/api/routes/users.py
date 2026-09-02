import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate, UserStatusUpdate, UserInvite
from app.models.user import User, RoleEnum, UserStatus
from app.api.dependencies import RequireRole
from app.services import user_service
from app.core.config import settings
from app.workers.tasks import send_invitation_email
from app.services.email_service import send_invitation_email_sync
from app.core.security import hash_password
import random
import string

router = APIRouter(tags=["Users"])

# Require ADMIN role for all user management
admin_required = RequireRole([RoleEnum.ADMIN])

@router.post("", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Create a new user. Admin only.
    """
    return await user_service.create_user(session, user_in)

from fastapi import BackgroundTasks

@router.post("/invite", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def invite_user(
    user_in: UserInvite,
    background_tasks: BackgroundTasks,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Invite a new user (PENDING status, sends PIN email). Admin only.
    """
    return await user_service.invite_user(session, user_in, background_tasks)

@router.post("/{user_id}/resend-invite", status_code=status.HTTP_200_OK)
async def resend_invite(
    user_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Resend invitation to a PENDING user. Admin only.
    """
    user = await user_service.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user.status != UserStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only resend invitations to PENDING users")
        
    pin = ''.join(random.choices(string.digits, k=6))
    user.password_hash = hash_password(pin)
    user.activation_pin = pin
    await session.commit()
    
    if settings.CELERY_ENABLED:
        send_invitation_email.delay(user.email, user.full_name, pin)
    else:
        background_tasks.add_task(send_invitation_email_sync, user.email, user.full_name, pin)
        
    return {"message": "Invitation resent"}

@router.get("", response_model=list[UserSchema])
async def get_users(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)],
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve users. Admin only.
    """
    return await user_service.get_users(session, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Get user by ID. Admin only.
    """
    user = await user_service.get_user_by_id(session, user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Update user details (name, email, role). Admin only.
    """
    return await user_service.update_user(session, user_id, user_in)

@router.patch("/{user_id}/status", response_model=UserSchema)
async def update_user_status(
    user_id: uuid.UUID,
    status_in: UserStatusUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Activate/deactivate user. Admin only.
    """
    return await user_service.update_user_status(session, user_id, status_in)
