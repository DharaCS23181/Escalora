import uuid
from datetime import datetime, UTC
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from app.db.base import Base

class TicketType(str, Enum):
    BUG = "BUG"
    INCIDENT = "INCIDENT"
    MAINTENANCE = "MAINTENANCE"
    TASK = "TASK"
    CHANGE_REQUEST = "CHANGE_REQUEST"

class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class EscalationStatus(str, Enum):
    NONE = "NONE"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"

class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_key: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), index=True, nullable=False)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    type: Mapped[TicketType] = mapped_column(SQLEnum(TicketType, name="tickettypeenum"), nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(SQLEnum(TicketPriority, name="ticketpriorityenum"), nullable=False)
    status: Mapped[TicketStatus] = mapped_column(SQLEnum(TicketStatus, name="ticketstatusenum"), nullable=False, default=TicketStatus.OPEN)
    
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # SLA Fields
    sla_policy_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    sla_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sla_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Escalation Fields
    escalation_status: Mapped[EscalationStatus] = mapped_column(SQLEnum(EscalationStatus, name="escalationstatusenum"), nullable=False, default=EscalationStatus.NONE)
    escalated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    escalated_to_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", backref="tickets")
    assignee: Mapped["User"] = relationship("User", foreign_keys=[assignee_id])
    created_by: Mapped["User"] = relationship("User", foreign_keys=[created_by_id])
    escalated_to: Mapped["User"] = relationship("User", foreign_keys=[escalated_to_id])
