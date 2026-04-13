from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from kkachi.domain.user import Gender


@dataclass
class Profile:
    """사주 분석 대상 — Member가 소유하는 인물 프로필."""

    id: UUID
    member_id: UUID
    name: str
    gender: Gender
    birth_dt: datetime
    city: str
    created_at: datetime
    is_self: bool = False


@dataclass
class Analysis:
    """Profile의 연도별 분석 결과 스냅샷."""

    id: UUID
    profile_id: UUID
    year: int
    result: dict
    created_at: datetime
