import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserStatusUpdate
from app.core.security import hash_password

async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalars().first()

async def create_user(session: AsyncSession, user_in: UserCreate) -> User:
    existing_user = await get_user_by_email(session, user_in.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
    hashed_password = hash_password(user_in.password)
    user_data = user_in.model_dump(exclude={"password"})
    user_data["password_hash"] = hashed_password
    
    db_user = User(**user_data)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def get_users(session: AsyncSession, skip: int = 0, limit: int = 100) -> list[User]:
    result = await session.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())

async def update_user(session: AsyncSession, user_id: uuid.UUID, user_in: UserUpdate) -> User:
    db_user = await get_user_by_id(session, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != db_user.email:
        existing_user = await get_user_by_email(session, update_data["email"])
        if existing_user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    for field, value in update_data.items():
        setattr(db_user, field, value)
        
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def update_user_status(session: AsyncSession, user_id: uuid.UUID, status_in: UserStatusUpdate) -> User:
    db_user = await get_user_by_id(session, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    db_user.is_active = status_in.is_active
    await session.commit()
    await session.refresh(db_user)
    return db_user
