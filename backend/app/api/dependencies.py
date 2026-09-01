import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User, RoleEnum, UserStatus
from app.models.project import Project
from app.services.user_service import get_user_by_id
from app.services.project_service import get_project_by_id

security = HTTPBearer()

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID")
        
    user = await get_user_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.status == UserStatus.INACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return current_user

class RequireRole:
    def __init__(self, allowed_roles: list[RoleEnum]):
        self.allowed_roles = allowed_roles
        
    def __call__(self, current_user: Annotated[User, Depends(get_current_active_user)]) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user

async def check_project_access(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_db)]
) -> Project:
    project = await get_project_by_id(session, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if current_user.role == RoleEnum.ADMIN:
        return project
        
    if current_user.role == RoleEnum.PROJECT_LEAD:
        if project.project_lead_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions for this project")
        return project
        
    # Check ProjectMember for SENIOR_DEVELOPER and DEVELOPER
    from sqlalchemy import select
    from app.models.project_member import ProjectMember
    result = await session.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user.id)
    )
    if not result.scalars().first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions for this project")
        
    return project
