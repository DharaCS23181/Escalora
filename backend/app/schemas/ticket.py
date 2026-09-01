from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.ticket import TicketType, TicketPriority, TicketStatus, EscalationStatus
from app.schemas.user import User
from typing import Optional, ForwardRef

TicketSLAResponse = ForwardRef('TicketSLAResponse')

class TicketBase(BaseModel):
    title: str
    description: str | None = None
    type: TicketType
    priority: TicketPriority

class TicketCreate(TicketBase):
    project_id: UUID
    assignee_id: UUID | None = None

class TicketUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    type: TicketType | None = None
    priority: TicketPriority | None = None

class TicketStatusUpdate(BaseModel):
    status: TicketStatus

class TicketAssignUpdate(BaseModel):
    assignee_id: UUID | None

class TicketPriorityUpdate(BaseModel):
    priority: TicketPriority

class TicketInDBBase(TicketBase):
    id: UUID
    ticket_key: str
    project_id: UUID
    status: TicketStatus
    assignee_id: UUID | None
    created_by_id: UUID | None
    
    # SLA fields removed in Phase 5
    
    escalation_status: EscalationStatus
    escalated_at: datetime | None
    escalated_to_id: UUID | None
    
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    
    model_config = ConfigDict(from_attributes=True)

class TicketResponse(TicketInDBBase):
    assignee: User | None = None
    created_by: User | None = None
    sla: Optional[TicketSLAResponse] = None

class TicketActivityBase(BaseModel):
    ticket_id: UUID
    action: str
    old_value: str | None = None
    new_value: str | None = None
    metadata_json: dict | None = None

class TicketActivityResponse(TicketActivityBase):
    id: UUID
    actor_id: UUID | None
    created_at: datetime
    actor: User | None = None
    
    model_config = ConfigDict(from_attributes=True)

from app.schemas.sla import TicketSLAResponse
TicketResponse.model_rebuild()
