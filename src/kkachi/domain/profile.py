from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from kkachi.domain.user import Gender, User


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
    birth_hour_unknown: bool = False  # 출생시간 미상 → 세 기둥 분석

    def to_user(self) -> User:
        """사주·별자리 계산 입력 — 서비스마다 같은 변환을 되풀이하지 않게 한 곳에(2026-10-30)."""
        return User(name=self.name, gender=self.gender, birth_dt=self.birth_dt, city=self.city, hour_unknown=self.birth_hour_unknown)


@dataclass
class Analysis:
    """Profile의 연도별 분석 결과 스냅샷."""

    id: UUID
    profile_id: UUID
    year: int
    result: dict
    created_at: datetime
