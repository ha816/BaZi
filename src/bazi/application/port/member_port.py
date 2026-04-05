from abc import ABC, abstractmethod
from datetime import date, datetime
from uuid import UUID

from bazi.domain.compatibility import Compatibility
from bazi.domain.daily_fortune import DailyFortuneCache
from bazi.domain.member import Member
from bazi.domain.profile import Analysis, Profile
from bazi.domain.user import Gender


class MemberPort(ABC):
    @abstractmethod
    async def create(self, name: str, email: str) -> Member: ...

    @abstractmethod
    async def get(self, member_id: UUID) -> Member | None: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Member | None: ...


class ProfilePort(ABC):
    @abstractmethod
    async def create(self, member_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str) -> Profile: ...

    @abstractmethod
    async def get(self, profile_id: UUID) -> Profile | None: ...

    @abstractmethod
    async def list_by_member(self, member_id: UUID) -> list[Profile]: ...

    @abstractmethod
    async def delete(self, profile_id: UUID) -> None: ...


class AnalysisPort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, year: int, result: dict) -> Analysis: ...

    @abstractmethod
    async def get(self, profile_id: UUID, year: int) -> Analysis | None: ...

    @abstractmethod
    async def list_by_profile(self, profile_id: UUID) -> list[Analysis]: ...


class CompatibilityPort(ABC):
    @abstractmethod
    async def save(self, pid1: UUID, pid2: UUID, year: int, result: dict) -> Compatibility: ...

    @abstractmethod
    async def get(self, pid1: UUID, pid2: UUID, year: int) -> Compatibility | None: ...


class DailyFortunePort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, fortune_date: date, result: dict) -> DailyFortuneCache: ...

    @abstractmethod
    async def get(self, profile_id: UUID, fortune_date: date) -> DailyFortuneCache | None: ...
