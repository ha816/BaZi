from abc import ABC, abstractmethod
from datetime import date
from uuid import UUID

from kkachi.domain.fortune import FortuneCache


class FortunePort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, fortune_date: date, result: dict) -> FortuneCache: ...

    @abstractmethod
    async def get(self, profile_id: UUID, fortune_date: date) -> FortuneCache | None: ...

    @abstractmethod
    async def delete_by_profile(self, profile_id: UUID) -> None:
        """프로필 출생정보가 바뀌면 일진 캐시를 모두 비운다."""
