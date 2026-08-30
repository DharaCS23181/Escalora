import uuid
from datetime import datetime, UTC
from enum import Enum
from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    PROJECT_LEAD = "PROJECT_LEAD"
    SENIOR_DEVELOPER = "SENIOR_DEVELOPER"
    DEVELOPER = "DEVELOPER"

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SQLEnum(RoleEnum, name="roleenum"), nullable=False, default=RoleEnum.DEVELOPER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    project_memberships: Mapped[list["ProjectMember"]] = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")
    led_projects: Mapped[list["Project"]] = relationship("Project", back_populates="project_lead")
