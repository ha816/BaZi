from abc import ABC, abstractmethod
from uuid import UUID

from kkachi.domain.profile import Analysis


class AnalysisPort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, year: int, result: dict) -> Analysis: ...

    @abstractmethod
    async def get(self, profile_id: UUID, year: int) -> Analysis | None: ...

    @abstractmethod
    async def list_by_profile(self, profile_id: UUID) -> list[Analysis]: ...

    @abstractmethod
    async def delete_by_profile(self, profile_id: UUID) -> None:
        """프로필 출생정보가 바뀌면 연도 캐시를 모두 비운다."""
