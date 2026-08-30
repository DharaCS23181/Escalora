from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.user import RoleEnum

class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: RoleEnum | None = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class UserInDBBase(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class User(UserInDBBase):
    pass
