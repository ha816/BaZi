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

    async def stream_interpret(self, report: str, kind: str = "analysis", prefix: str = "") -> AsyncIterator[str]:
        """prefix: 답의 첫 부분을 미리 채워 이어 쓰게 한다(스트림 맨 앞에 그대로 나온다)."""
        if prefix:
            yield prefix
        yield await self.interpret(report, kind)
