from abc import ABC, abstractmethod
from uuid import UUID

from bazi.domain.member import Member


class MemberPort(ABC):
    @abstractmethod
    async def create(self, name: str, email: str) -> Member: ...

    @abstractmethod
    async def get(self, member_id: UUID) -> Member | None: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Member | None: ...

    @abstractmethod
    async def delete(self, member_id: UUID) -> None: ...
