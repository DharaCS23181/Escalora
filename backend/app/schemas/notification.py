from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    ticket_id: UUID | None = None
    project_id: UUID | None = None

class NotificationCreate(NotificationBase):
    recipient_id: UUID
    actor_id: UUID | None = None

class NotificationResponse(NotificationBase):
    id: UUID
    recipient_id: UUID
    actor_id: UUID | None
    is_read: bool
    created_at: datetime
    read_at: datetime | None
    
    model_config = ConfigDict(from_attributes=True)

class UnreadCountResponse(BaseModel):
    count: int
