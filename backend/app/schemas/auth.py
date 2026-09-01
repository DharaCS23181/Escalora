from pydantic import BaseModel, ConfigDict
from uuid import UUID
from app.models.user import RoleEnum, UserStatus

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: RoleEnum
    status: UserStatus

    model_config = ConfigDict(from_attributes=True)

Token.model_rebuild()
