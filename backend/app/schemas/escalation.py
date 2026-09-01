from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.user import User


class EscalationCreate(BaseModel):
    ticket_id: UUID
    reason: str
    assigned_to_id: UUID | None = None


class EscalationResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    project_id: UUID
    trigger_type: str
    reason: str
    triggered_by_id: UUID | None
    assigned_to_id: UUID | None
    status: str
    created_at: datetime
    acknowledged_at: datetime | None
    resolved_at: datetime | None
    updated_at: datetime

    # Nested relations
    triggered_by: User | None = None
    assigned_to: User | None = None

    # Ticket info (denormalized for list views)
    ticket_key: str | None = None
    ticket_title: str | None = None
    ticket_priority: str | None = None
    ticket_status: str | None = None
    project_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EscalationMetricsResponse(BaseModel):
    open_count: int
    acknowledged_count: int
    resolved_count: int
    today_count: int
