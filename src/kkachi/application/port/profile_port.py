from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from kkachi.domain.profile import Profile
from kkachi.domain.user import Gender


class ProfilePort(ABC):
    @abstractmethod
    async def create(self, member_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str) -> Profile: ...

    @abstractmethod
    async def get(self, profile_id: UUID) -> Profile | None: ...

    @abstractmethod
    async def list_by_member(self, member_id: UUID) -> list[Profile]: ...

    @abstractmethod
    async def delete(self, profile_id: UUID) -> None: ...
