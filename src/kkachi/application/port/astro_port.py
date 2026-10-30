from abc import ABC, abstractmethod
from datetime import datetime


class AstroPort(ABC):
    @abstractmethod
    def positions(self, at_utc: datetime, city: str | None = None) -> dict[str, float]:
        """열대 황경(도, 0 ≤ x < 360) — 키 sun·moon, city가 있으면 asc(상승점). 동기(1ms 미만)."""
