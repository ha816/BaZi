from abc import ABC, abstractmethod
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class EventSummary:
    name: str
    count: int
    sessions: int  # distinct session_id


class EventPort(ABC):
    @abstractmethod
    async def save(self, session_id: str, member_id: UUID | None, name: str, props: dict) -> None: ...

    @abstractmethod
    async def summary(self, days: int) -> list[EventSummary]: ...
