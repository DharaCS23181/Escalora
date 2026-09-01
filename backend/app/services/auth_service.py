from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.services.user_service import get_user_by_email
from app.core.security import verify_password, create_access_token
from datetime import datetime, UTC
from app.models.user import UserStatus

async def authenticate_user(session: AsyncSession, login_in: LoginRequest) -> Token:
    user = await get_user_by_email(session, login_in.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        
    if not verify_password(login_in.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        
    if user.status == UserStatus.INACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
        
    # Update last login
    user.last_login_at = datetime.now(UTC)
    await session.commit()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )
