from abc import ABC, abstractmethod

from kkachi.domain.interpretation import Interpretation, NatalResult, PostnatalResult
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User


class NatalPort(ABC):
    """선천 분석 포트."""

    @abstractmethod
    def analyze(self, user: User) -> NatalInfo:
        pass


class PostnatalPort(ABC):
    """후천 분석 포트."""

    @abstractmethod
    def analyze(self, user: User, natal: NatalInfo, year: int) -> PostnatalInfo:
        pass


class InterpreterPort(ABC):
    """종합 해석 포트."""

    @abstractmethod
    def interpret_natal(self, natal: NatalInfo) -> NatalResult:
        pass

    @abstractmethod
    def interpret_postnatal(self, natal: NatalInfo, postnatal: PostnatalInfo) -> PostnatalResult:
        pass

    @abstractmethod
    def interpret(self, natal: NatalInfo, postnatal: PostnatalInfo) -> Interpretation:
        pass
