from abc import ABC, abstractmethod

from bazi.domain.natal import NatalInfo, PostnatalInfo, Saju
from bazi.domain.user import User


class NatalPort(ABC):
    """선천 분석 포트."""

    @abstractmethod
    async def analyze(self, saju: Saju) -> NatalInfo:
        pass


class PostnatalPort(ABC):
    """후천 분석 포트."""

    @abstractmethod
    async def analyze(self, user: User, natal: NatalInfo, year: int) -> PostnatalInfo:
        pass


class InterpreterPort(ABC):
    """종합 해석 포트."""

    @abstractmethod
    async def interpret(self, natal: NatalInfo, postnatal: PostnatalInfo) -> dict:
        pass
