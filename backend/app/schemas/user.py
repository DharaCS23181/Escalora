from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.user import RoleEnum, UserStatus

class UserBase(BaseModel):
    full_name: str
    email: str
    role: RoleEnum
    status: UserStatus = UserStatus.ACTIVE

class UserCreate(UserBase):
    password: str

class UserInvite(BaseModel):
    full_name: str
    email: str
    role: RoleEnum

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    role: RoleEnum | None = None

class UserStatusUpdate(BaseModel):
    status: UserStatus

class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class User(UserInDBBase):
    pass

class UserChangePassword(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
