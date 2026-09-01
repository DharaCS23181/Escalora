import uuid
from datetime import datetime, UTC
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum as SQLEnum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from app.db.base import Base


class EscalationTriggerType(str, Enum):
    SLA_BREACH = "SLA_BREACH"
    MANUAL = "MANUAL"


class EscalationStatusEnum(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)

    trigger_type: Mapped[EscalationTriggerType] = mapped_column(SQLEnum(EscalationTriggerType, name="escalationtriggertypeenum"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)

    triggered_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    status: Mapped[EscalationStatusEnum] = mapped_column(SQLEnum(EscalationStatusEnum, name="escalationstatusenumenum"), nullable=False, default=EscalationStatusEnum.OPEN)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="escalations", foreign_keys=[ticket_id])
    project: Mapped["Project"] = relationship("Project", foreign_keys=[project_id])
    triggered_by: Mapped["User"] = relationship("User", foreign_keys=[triggered_by_id])
    assigned_to: Mapped["User"] = relationship("User", foreign_keys=[assigned_to_id])

    __table_args__ = (
        # Partial unique index: only one active (OPEN or ACKNOWLEDGED) escalation per ticket
        Index(
            "uq_active_escalation_per_ticket",
            ticket_id,
            unique=True,
            postgresql_where=(status.in_([EscalationStatusEnum.OPEN, EscalationStatusEnum.ACKNOWLEDGED]))
        ),
    )
