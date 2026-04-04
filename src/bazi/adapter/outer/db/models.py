import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from bazi.adapter.outer.db.base import Base


class MemberModel(Base):
    __tablename__ = "members"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profiles: Mapped[list["ProfileModel"]] = relationship(back_populates="member", cascade="all, delete-orphan")


class ProfileModel(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    birth_dt: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Seoul")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    member: Mapped["MemberModel"] = relationship(back_populates="profiles")
    analyses: Mapped[list["AnalysisModel"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class AnalysisModel(Base):
    __tablename__ = "analyses"
    __table_args__ = (UniqueConstraint("profile_id", "year", name="uq_analyses_profile_year"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped["ProfileModel"] = relationship(back_populates="analyses")
