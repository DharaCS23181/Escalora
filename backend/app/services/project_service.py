import uuid
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.project import Project, ProjectStatus
from app.models.project_member import ProjectMember
from app.models.project_activity import ProjectActivity
from app.models.user import User, RoleEnum
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectMemberCreate

async def log_activity(session: AsyncSession, project_id: uuid.UUID, actor_id: uuid.UUID, action: str, target_user_id: uuid.UUID | None = None, metadata_json: str | None = None):
    activity = ProjectActivity(
        project_id=project_id,
        actor_id=actor_id,
        action=action,
        target_user_id=target_user_id,
        metadata_json=metadata_json
    )
    session.add(activity)

async def _attach_team_info(session: AsyncSession, project: Project) -> Project:
    # Get team size
    result = await session.execute(
        select(func.count(ProjectMember.id)).where(ProjectMember.project_id == project.id)
    )
    project.team_size = result.scalar() or 0
    return project

async def _attach_team_info_list(session: AsyncSession, projects: list[Project]) -> list[Project]:
    if not projects:
        return []
    project_ids = [p.id for p in projects]
    result = await session.execute(
        select(ProjectMember.project_id, func.count(ProjectMember.id))
        .where(ProjectMember.project_id.in_(project_ids))
        .group_by(ProjectMember.project_id)
    )
    counts = dict(result.all())
    for p in projects:
        p.team_size = counts.get(p.id, 0)
    return projects

async def get_project_by_key(session: AsyncSession, key: str) -> Project | None:
    result = await session.execute(select(Project).where(Project.key == key))
    return result.scalars().first()

async def get_project_by_id(session: AsyncSession, project_id: uuid.UUID) -> Project | None:
    result = await session.execute(
        select(Project)
        .options(
            selectinload(Project.project_lead),
            selectinload(Project.creator),
            selectinload(Project.members).selectinload(ProjectMember.user)
        )
        .where(Project.id == project_id)
    )
    return result.scalars().first()

async def create_project(session: AsyncSession, project_in: ProjectCreate, current_user: User) -> Project:
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
    
    db_project = Project(**project_in.model_dump(), created_by=current_user.id)
    session.add(db_project)
    await session.flush()

    await log_activity(session, db_project.id, current_user.id, "created project")

    await session.commit()
    await session.refresh(db_project)
    
    # Needs lead explicitly loaded for response if provided
    result = await session.execute(
        select(Project).options(selectinload(Project.project_lead)).where(Project.id == db_project.id)
    )
    db_project = result.scalars().first()
    return await _attach_team_info(session, db_project)

async def get_projects(session: AsyncSession, user: User) -> list[Project]:
    query = select(Project).options(selectinload(Project.project_lead)).order_by(Project.created_at.desc())
    
    # Admin sees all
    if user.role == RoleEnum.ADMIN:
        result = await session.execute(query)
        projects = list(result.scalars().all())
    # Project Lead sees led projects
    elif user.role == RoleEnum.PROJECT_LEAD:
        result = await session.execute(query.where(Project.project_lead_id == user.id))
        projects = list(result.scalars().all())
    # Developers and Senior Developers see projects they are members of
    else:
        result = await session.execute(
            query.join(ProjectMember).where(ProjectMember.user_id == user.id)
        )
        projects = list(result.scalars().all())
        
    return await _attach_team_info_list(session, projects)

async def update_project(session: AsyncSession, project_id: uuid.UUID, project_in: ProjectUpdate, current_user: User) -> Project:
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
        
    await log_activity(session, project_id, current_user.id, "updated project details")
        
    await session.commit()
    await session.refresh(db_project)
    return await _attach_team_info(session, db_project)

async def archive_project(session: AsyncSession, project_id: uuid.UUID, current_user: User) -> Project:
    db_project = await get_project_by_id(session, project_id)
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    db_project.status = ProjectStatus.ARCHIVED
    await log_activity(session, project_id, current_user.id, "archived project")
    await session.commit()
    await session.refresh(db_project)
    return await _attach_team_info(session, db_project)

from app.workers.tasks import send_project_assignment_email

async def change_lead(session: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, current_user: User) -> Project:
    db_project = await get_project_by_id(session, project_id)
    if not db_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    result = await session.execute(select(User).where(User.id == user_id))
    lead_user = result.scalars().first()
    if not lead_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned Project Lead not found")
    if lead_user.role != RoleEnum.PROJECT_LEAD:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned user is not a PROJECT_LEAD")
        
    db_project.project_lead_id = user_id
    await log_activity(session, project_id, current_user.id, "changed project lead", target_user_id=user_id)
    await session.commit()
    await session.refresh(db_project)
    
    send_project_assignment_email.delay(lead_user.email, lead_user.full_name, db_project.name, "PROJECT LEAD")
    
    return await _attach_team_info(session, db_project)

async def add_project_member(session: AsyncSession, project_id: uuid.UUID, member_in: ProjectMemberCreate, current_user: User) -> ProjectMember:
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
        
    # Verify role being added is Developer or Senior Developer
    if member_in.role not in [RoleEnum.DEVELOPER, RoleEnum.SENIOR_DEVELOPER]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Developers and Senior Developers can be added as team members")
        
    if user.role != member_in.role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User role mismatch")
        
    db_member = ProjectMember(project_id=project_id, user_id=member_in.user_id, role=member_in.role)
    session.add(db_member)
    
    await log_activity(session, project_id, current_user.id, "added team member", target_user_id=member_in.user_id)
    
    await session.commit()
    await session.refresh(db_member)
    
    send_project_assignment_email.delay(user.email, user.full_name, project.name, user.role.value)
    
    # Reload with user relation
    result = await session.execute(
        select(ProjectMember).options(selectinload(ProjectMember.user)).where(ProjectMember.id == db_member.id)
    )
    return result.scalars().first()

async def remove_project_member(session: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, current_user: User) -> None:
    result = await session.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
    )
    db_member = result.scalars().first()
    if not db_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project membership not found")
        
    await session.delete(db_member)
    await log_activity(session, project_id, current_user.id, "removed team member", target_user_id=user_id)
    await session.commit()

async def get_eligible_leads(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).where(User.role == RoleEnum.PROJECT_LEAD))
    return list(result.scalars().all())

async def get_eligible_members(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).where(User.role.in_([RoleEnum.DEVELOPER, RoleEnum.SENIOR_DEVELOPER])))
    return list(result.scalars().all())

async def get_activity(session: AsyncSession, project_id: uuid.UUID) -> list[ProjectActivity]:
    result = await session.execute(
        select(ProjectActivity)
        .options(selectinload(ProjectActivity.actor), selectinload(ProjectActivity.target_user))
        .where(ProjectActivity.project_id == project_id)
        .order_by(ProjectActivity.created_at.desc())
    )
    return list(result.scalars().all())
