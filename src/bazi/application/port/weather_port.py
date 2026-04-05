from abc import ABC, abstractmethod


class WeatherPort(ABC):
    @abstractmethod
    async def get_forecast(self, city: str, days: int = 7) -> list[dict] | None: ...