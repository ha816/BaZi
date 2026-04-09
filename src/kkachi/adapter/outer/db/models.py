import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


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
    fortunes: Mapped[list["FortuneModel"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class AnalysisModel(Base):
    __tablename__ = "analyses"
    __table_args__ = (UniqueConstraint("profile_id", "year", name="uq_analyses_profile_year"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped["ProfileModel"] = relationship(back_populates="analyses")


class FortuneModel(Base):
    __tablename__ = "fortunes"
    __table_args__ = (UniqueConstraint("profile_id", "fortune_date", name="uq_fortune_profile_date"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    fortune_date: Mapped[date] = mapped_column(Date, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    profile: Mapped["ProfileModel"] = relationship(back_populates="fortunes")


class CompatibilityModel(Base):
    __tablename__ = "compatibilities"
    __table_args__ = (UniqueConstraint("profile_id_1", "profile_id_2", "year", name="uq_compat_profiles_year"),)

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id_1: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    profile_id_2: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InterpretFeedbackModel(Base):
    __tablename__ = "interpret_feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    tab_id: Mapped[str] = mapped_column(String(50), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
