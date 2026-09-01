from pydantic import BaseModel, Field
import uuid
from datetime import datetime
from app.models.ticket import TicketPriority
from app.models.ticket_sla import SLAStatus

class SLAPolicyBase(BaseModel):
    name: str = Field(..., max_length=100)
    priority: TicketPriority
    response_time_minutes: int = Field(..., gt=0)
    resolution_time_minutes: int = Field(..., gt=0)
    at_risk_threshold_percent: int = Field(..., ge=1, le=99)
    active: bool = True

class SLAPolicyCreate(SLAPolicyBase):
    pass

class SLAPolicyUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    priority: TicketPriority | None = None
    response_time_minutes: int | None = Field(None, gt=0)
    resolution_time_minutes: int | None = Field(None, gt=0)
    at_risk_threshold_percent: int | None = Field(None, ge=1, le=99)
    active: bool | None = None

class SLAPolicyResponse(SLAPolicyBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TicketSLAResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    policy_id: uuid.UUID
    response_started_at: datetime
    response_due_at: datetime
    response_completed_at: datetime | None
    resolution_started_at: datetime
    resolution_due_at: datetime
    resolution_completed_at: datetime | None
    status: SLAStatus
    paused_at: datetime | None
    total_pause_seconds: int
    breached_at: datetime | None
    created_at: datetime
    updated_at: datetime
    policy: SLAPolicyResponse

    class Config:
        from_attributes = True

class SLAOverviewResponse(BaseModel):
    total_active_tickets: int
    on_track_count: int
    at_risk_count: int
    breached_count: int
    completed_count: int
    response_sla_compliance: float
    resolution_sla_compliance: float
    average_response_minutes: float
    average_resolution_minutes: float
