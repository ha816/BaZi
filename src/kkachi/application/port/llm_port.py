from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


class LlmPort(ABC):

    @property
    @abstractmethod
    def available(self) -> bool:
        pass

    @property
    def model(self) -> str:
        return ""

    @abstractmethod
    async def get_advice(self, params: dict) -> str:
        pass

    @abstractmethod
    async def interpret(self, report: str, kind: str = "analysis") -> str:
        """kind: analysis(AI 풀이) | compat(궁합 AI 해석)"""

    async def stream_interpret(self, report: str, kind: str = "analysis") -> AsyncIterator[str]:
        yield await self.interpret(report, kind)
