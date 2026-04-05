from abc import ABC, abstractmethod
from uuid import UUID

from bazi.domain.compatibility import Compatibility


class CompatibilityPort(ABC):
    @abstractmethod
    async def save(self, pid1: UUID, pid2: UUID, year: int, result: dict) -> Compatibility: ...

    @abstractmethod
    async def get(self, pid1: UUID, pid2: UUID, year: int) -> Compatibility | None: ...
