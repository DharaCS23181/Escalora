from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.services.auth_service import authenticate_user
from app.api.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(tags=["Authentication"])

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
