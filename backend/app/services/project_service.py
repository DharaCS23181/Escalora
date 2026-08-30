import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User, RoleEnum
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectMemberCreate

async def get_project_by_key(session: AsyncSession, key: str) -> Project | None:
    result = await session.execute(select(Project).where(Project.key == key))
    return result.scalars().first()

async def get_project_by_id(session: AsyncSession, project_id: uuid.UUID) -> Project | None:
    result = await session.execute(select(Project).where(Project.id == project_id))
    return result.scalars().first()

async def create_project(session: AsyncSession, project_in: ProjectCreate) -> Project:
    existing_project = await get_project_by_key(session, project_in.key)
    if existing_project:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project key already exists")
    
    # If a project_lead_id is provided, ensure they are actually a PROJECT_LEAD
    if project_in.project_lead_id:
        result = await session.execute(select(User).where(User.id == project_in.project_lead_id))
        lead_user = result.scalars().first()
        if not lead_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned Project Lead not found")
        if lead_user.role != RoleEnum.PROJECT_LEAD:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned user is not a PROJECT_LEAD")
    
    db_project = Project(**project_in.model_dump())
    session.add(db_project)
    await session.commit()
    await session.refresh(db_project)
    return db_project

async def get_projects(session: AsyncSession, user: User) -> list[Project]:
    # Admin sees all
    if user.role == RoleEnum.ADMIN:
        result = await session.execute(select(Project))
        return list(result.scalars().all())
    
    # Project Lead sees led projects
    if user.role == RoleEnum.PROJECT_LEAD:
        result = await session.execute(select(Project).where(Project.project_lead_id == user.id))
        return list(result.scalars().all())
        
    # Developers and Senior Developers see projects they are members of
    result = await session.execute(
        select(Project)
        .join(ProjectMember)
        .where(ProjectMember.user_id == user.id)
    )
    return list(result.scalars().all())

async def update_project(session: AsyncSession, project_id: uuid.UUID, project_in: ProjectUpdate) -> Project:
    db_project = await get_project_by_id(session, project_id)
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    update_data = project_in.model_dump(exclude_unset=True)
    
    if "key" in update_data and update_data["key"] != db_project.key:
        existing = await get_project_by_key(session, update_data["key"])
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project key already exists")
            
    if "project_lead_id" in update_data and update_data["project_lead_id"] is not None:
        result = await session.execute(select(User).where(User.id == update_data["project_lead_id"]))
        lead_user = result.scalars().first()
        if not lead_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned Project Lead not found")
        if lead_user.role != RoleEnum.PROJECT_LEAD:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned user is not a PROJECT_LEAD")
            
    for field, value in update_data.items():
        setattr(db_project, field, value)
        
    await session.commit()
    await session.refresh(db_project)
    return db_project

async def add_project_member(session: AsyncSession, project_id: uuid.UUID, member_in: ProjectMemberCreate) -> ProjectMember:
    # Verify project
    project = await get_project_by_id(session, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Verify user
    result = await session.execute(select(User).where(User.id == member_in.user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Verify not already member
    result = await session.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == member_in.user_id)
    )
    existing_membership = result.scalars().first()
    if existing_membership:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a member of this project")
        
    db_member = ProjectMember(project_id=project_id, user_id=member_in.user_id)
    session.add(db_member)
    await session.commit()
    await session.refresh(db_member)
    return db_member

async def remove_project_member(session: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await session.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    )
    db_member = result.scalars().first()
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project membership not found")
        
    await session.delete(db_member)
    await session.commit()
