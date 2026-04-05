from abc import ABC, abstractmethod
from datetime import date
from uuid import UUID

from bazi.domain.fortune import FortuneCache


class FortunePort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, fortune_date: date, result: dict) -> FortuneCache: ...

    @abstractmethod
    async def get(self, profile_id: UUID, fortune_date: date) -> FortuneCache | None: ...
