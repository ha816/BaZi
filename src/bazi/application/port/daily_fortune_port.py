from abc import ABC, abstractmethod
from datetime import date
from uuid import UUID

from bazi.domain.daily_fortune import DailyFortuneCache


class DailyFortunePort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, fortune_date: date, result: dict) -> DailyFortuneCache: ...

    @abstractmethod
    async def get(self, profile_id: UUID, fortune_date: date) -> DailyFortuneCache | None: ...
