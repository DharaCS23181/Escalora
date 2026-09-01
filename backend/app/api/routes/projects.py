import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.project import Project, ProjectCreate, ProjectUpdate, ProjectMemberCreate, ProjectDetailed, ProjectMemberDetailed
from app.schemas.user import User as UserSchema
from app.models.user import User, RoleEnum
from app.api.dependencies import get_current_active_user, RequireRole, check_project_access
from app.services import project_service

router = APIRouter(tags=["Projects"])

admin_required = RequireRole([RoleEnum.ADMIN])
admin_or_lead = RequireRole([RoleEnum.ADMIN, RoleEnum.PROJECT_LEAD])

@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Create a new project. Admin only.
    """
    return await project_service.create_project(session, project_in, current_user)

@router.get("", response_model=list[Project])
async def get_projects(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get projects accessible to the current user.
    Admins see all. Project Leads see assigned projects. Devs see joined projects.
    """
    return await project_service.get_projects(session, current_user)

@router.get("/eligible-leads", response_model=list[UserSchema])
async def get_eligible_leads(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Get all eligible project leads. Admin only.
    """
    return await project_service.get_eligible_leads(session)

@router.get("/eligible-members", response_model=list[UserSchema])
async def get_eligible_members(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_or_lead)]
):
    """
    Get all eligible developers and senior developers.
    """
    return await project_service.get_eligible_members(session)

@router.get("/{project_id}", response_model=ProjectDetailed)
async def get_project(
    project_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get project details. Must have access to the project.
    """
    await check_project_access(project_id, current_user, session)
    return await project_service.get_project_by_id(session, project_id)

@router.patch("/{project_id}", response_model=Project)
async def update_project(
    project_id: uuid.UUID,
    project_in: ProjectUpdate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Update project details. Admin or Project Lead.
    """
    if current_user.role == RoleEnum.PROJECT_LEAD:
        await check_project_access(project_id, current_user, session)
    elif current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return await project_service.update_project(session, project_id, project_in, current_user)

@router.patch("/{project_id}/archive", response_model=Project)
async def archive_project(
    project_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Archive a project. Admin only.
    """
    return await project_service.archive_project(session, project_id, current_user)

@router.patch("/{project_id}/lead", response_model=Project)
async def change_project_lead(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_required)]
):
    """
    Change the Project Lead for a project. Admin only.
    """
    return await project_service.change_lead(session, project_id, user_id, current_user)

@router.post("/{project_id}/members", response_model=ProjectMemberDetailed, status_code=status.HTTP_201_CREATED)
async def add_project_member(
    project_id: uuid.UUID,
    member_in: ProjectMemberCreate,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_or_lead)]
):
    """
    Add a user to a project. Admin or the assigned Project Lead.
    """
    if current_user.role == RoleEnum.PROJECT_LEAD:
        await check_project_access(project_id, current_user, session)
        
    return await project_service.add_project_member(session, project_id, member_in, current_user)

@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(admin_or_lead)]
):
    """
    Remove a user from a project. Admin or the assigned Project Lead.
    """
    if current_user.role == RoleEnum.PROJECT_LEAD:
        await check_project_access(project_id, current_user, session)
        
    await project_service.remove_project_member(session, project_id, user_id, current_user)

@router.get("/{project_id}/activity")
async def get_project_activity(
    project_id: uuid.UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get project activity. Must have access to the project.
    """
    await check_project_access(project_id, current_user, session)
    return await project_service.get_activity(session, project_id)
