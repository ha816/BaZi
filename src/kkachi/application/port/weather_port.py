from abc import ABC, abstractmethod


class WeatherPort(ABC):
    @abstractmethod
    async def get_forecast(
        self, city: str, days: int = 7,
        lat: float | None = None, lon: float | None = None,
    ) -> list[dict] | None: ...