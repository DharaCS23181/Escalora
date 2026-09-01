import uuid
from datetime import datetime, UTC
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), index=True, nullable=False)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "CREATED", "STATUS_CHANGED", "ASSIGNED"
    
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Relationships
    ticket: Mapped["Ticket"] = relationship("Ticket", backref="activities")
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_id])
