from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from kkachi.domain.profile import Profile
from kkachi.domain.user import Gender


class ProfilePort(ABC):
    @abstractmethod
    async def create(
        self, member_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str,
        is_self: bool = False, birth_hour_unknown: bool = False,
    ) -> Profile: ...

    @abstractmethod
    async def get(self, profile_id: UUID) -> Profile | None: ...

    @abstractmethod
    async def list_by_member(self, member_id: UUID) -> list[Profile]: ...

    @abstractmethod
    async def delete(self, profile_id: UUID) -> None: ...

    @abstractmethod
    async def set_self(self, member_id: UUID, profile_id: UUID) -> Profile:
        """이 프로필을 회원의 기본 프로필(나)로. 같은 회원의 다른 프로필은 is_self=False."""

    @abstractmethod
    async def update(
        self, profile_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str,
        birth_hour_unknown: bool = False,
    ) -> Profile: ...
