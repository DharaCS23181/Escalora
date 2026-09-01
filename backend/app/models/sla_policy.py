import uuid
from datetime import datetime, UTC
from sqlalchemy import String, DateTime, Boolean, Integer, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.ticket import TicketPriority

class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    priority: Mapped[TicketPriority] = mapped_column(SQLEnum(TicketPriority, name="ticketpriorityenum", create_type=False), nullable=False, index=True)
    
    response_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    resolution_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    at_risk_threshold_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    ticket_slas: Mapped[list["TicketSLA"]] = relationship("TicketSLA", back_populates="policy")
