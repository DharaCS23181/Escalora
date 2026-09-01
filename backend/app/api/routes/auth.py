from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.services.auth_service import authenticate_user
from app.api.dependencies import get_current_active_user
from app.models.user import User

from pydantic import BaseModel

class SetPasswordRequest(BaseModel):
    new_password: str

router = APIRouter(tags=["Authentication"])

@router.post("/set-password", status_code=200)
async def set_password(
    data: SetPasswordRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Set a new password. Usually called after a PENDING user logs in with their temporary PIN.
    """
    from app.core.security import hash_password
    from app.models.user import UserStatus
    
    current_user.password_hash = hash_password(data.new_password)
    current_user.activation_pin = None
    current_user.status = UserStatus.ACTIVE
    
    await session.commit()
    return {"message": "Password updated successfully"}
@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Authenticate a user and return a JWT token.
    """
    return await authenticate_user(session, login_data)

@router.post("/logout", status_code=204)
async def logout():
    """
    Logout the current user. Since we use stateless JWTs, this endpoint primarily serves
    as a signal for any potential future session tracking, but currently just returns success.
    The client must discard the token.
    """
    return None

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get the currently authenticated user's details.
    """
    return current_user
