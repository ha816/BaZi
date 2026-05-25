from abc import ABC, abstractmethod
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class FeedbackSummary:
    tab_id: str
    total: int
    positive: int
    negative: int
    positive_rate: float  # positive / total, total==0 인 경우 0.0


class FeedbackPort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, tab_id: str, rating: int) -> None: ...

    @abstractmethod
    async def summary(self) -> list[FeedbackSummary]: ...
