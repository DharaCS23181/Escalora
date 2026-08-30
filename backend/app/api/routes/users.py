import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate, UserStatusUpdate
from app.models.user import User, RoleEnum
from app.api.dependencies import RequireRole
from app.services import user_service

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
