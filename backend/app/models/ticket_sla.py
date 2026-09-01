import uuid
from datetime import datetime, UTC
from sqlalchemy import String, DateTime, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from app.db.base import Base

class SLAStatus(str, Enum):
    ON_TRACK = "ON_TRACK"
    AT_RISK = "AT_RISK"
    BREACHED = "BREACHED"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class TicketSLA(Base):
    __tablename__ = "ticket_slas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    policy_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sla_policies.id"), nullable=False)

    response_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    response_due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    response_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    resolution_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolution_due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolution_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[SLAStatus] = mapped_column(SQLEnum(SLAStatus, name="slastatusenum"), nullable=False, default=SLAStatus.ON_TRACK)

    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_pause_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    breached_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="sla")
    policy: Mapped["SLAPolicy"] = relationship("SLAPolicy", back_populates="ticket_slas")
