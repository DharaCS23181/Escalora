from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    key: str
    description: str | None = None
    is_active: bool = True
    project_lead_id: UUID | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: str | None = None
    key: str | None = None
    description: str | None = None
    is_active: bool | None = None
    project_lead_id: UUID | None = None

class ProjectInDBBase(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Project(ProjectInDBBase):
    pass

class ProjectMemberBase(BaseModel):
    user_id: UUID

class ProjectMemberCreate(ProjectMemberBase):
    pass

class ProjectMemberInDBBase(ProjectMemberBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ProjectMember(ProjectMemberInDBBase):
    pass
