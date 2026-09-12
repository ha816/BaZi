from abc import ABC, abstractmethod
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class PushSubscription:
    id: UUID
    member_id: UUID
    endpoint: str
    p256dh: str
    auth: str


class PushPort(ABC):
    """구독 저장소."""

    @abstractmethod
    async def save(self, member_id: UUID, endpoint: str, p256dh: str, auth: str) -> PushSubscription: ...

    @abstractmethod
    async def delete(self, endpoint: str) -> None: ...

    @abstractmethod
    async def list_all(self) -> list[PushSubscription]: ...


class PushSenderPort(ABC):
    """실제 발송기 (Web Push)."""

    @property
    @abstractmethod
    def configured(self) -> bool: ...

    @property
    @abstractmethod
    def public_key(self) -> str: ...

    @abstractmethod
    async def send(self, sub: PushSubscription, payload: dict) -> bool:
        """전송 성공 True. 구독이 소멸(404/410)했으면 False — 호출자가 구독을 지운다. 그 외 오류는 예외."""
