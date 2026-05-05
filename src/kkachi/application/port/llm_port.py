from abc import ABC, abstractmethod
from typing import AsyncIterator


class LlmPort(ABC):

    @property
    @abstractmethod
    def available(self) -> bool:
        pass

    @abstractmethod
    async def get_advice(self, params: dict) -> str:
        pass

    @abstractmethod
    async def interpret(self, report: str) -> str:
        pass

    async def stream_interpret(self, report: str) -> AsyncIterator[str]:
        yield await self.interpret(report)
