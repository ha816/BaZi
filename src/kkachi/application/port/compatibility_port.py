from abc import ABC, abstractmethod
from uuid import UUID

from kkachi.domain.compatibility import Compatibility


class CompatibilityPort(ABC):
    @abstractmethod
    async def save(self, pid1: UUID, pid2: UUID, year: int, result: dict) -> Compatibility: ...

    @abstractmethod
    async def get(self, pid1: UUID, pid2: UUID, year: int) -> Compatibility | None: ...

    async def update_result(self, pid1: UUID, pid2: UUID, year: int, result: dict) -> None:
        """있는 행의 result만 바꾼다(AI 해석 글 저장). 기본은 아무것도 하지 않는다 — DB 리포만 구현."""
        return None
