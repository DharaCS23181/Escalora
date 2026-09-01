from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime
from app.models.project import ProjectStatus
from app.models.user import RoleEnum
from app.schemas.user import User

class ProjectBase(BaseModel):
    name: str
    key: str
    description: str | None = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    project_lead_id: UUID | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: str | None = None
    key: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    project_lead_id: UUID | None = None

class ProjectMemberBase(BaseModel):
    user_id: UUID
    role: RoleEnum

class ProjectMemberCreate(ProjectMemberBase):
    pass

class ProjectMemberInDBBase(ProjectMemberBase):
    id: UUID
    project_id: UUID
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProjectMember(ProjectMemberInDBBase):
    pass

class ProjectMemberDetailed(ProjectMemberInDBBase):
    user: User

class ProjectInDBBase(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None = None
    
    model_config = ConfigDict(from_attributes=True)

class Project(ProjectInDBBase):
    project_lead: User | None = None
    team_size: int = 0

class ProjectDetailed(Project):
    members: list[ProjectMemberDetailed] = []
    creator: User | None = None

