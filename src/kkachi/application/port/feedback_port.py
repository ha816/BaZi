from abc import ABC, abstractmethod
from uuid import UUID


class FeedbackPort(ABC):
    @abstractmethod
    async def save(self, profile_id: UUID, tab_id: str, rating: int) -> None: ...
