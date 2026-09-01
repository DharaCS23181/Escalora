import uuid
from datetime import datetime, UTC
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from app.db.base import Base

class ProjectStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(SQLEnum(ProjectStatus, name="projectstatusenum"), nullable=False, default=ProjectStatus.ACTIVE)
    project_lead_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    # Relationships
    project_lead: Mapped["User"] = relationship("User", foreign_keys=[project_lead_id], back_populates="led_projects")
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    members: Mapped[list["ProjectMember"]] = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
