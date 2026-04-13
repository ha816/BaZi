from fastapi import APIRouter, Depends
from dependency_injector.wiring import Provide, inject

from kkachi.application.port.weather_port import WeatherPort
from kkachi.container import Container

weather_router = APIRouter(prefix="/weather", tags=["weather"])


@weather_router.get("")
@inject
async def get_weather(
    city: str = "Seoul",
    days: int = 7,
    lat: float | None = None,
    lon: float | None = None,
    port: WeatherPort = Depends(Provide[Container.weather_adapter]),
) -> list[dict]:
    result = await port.get_forecast(city, days=min(days, 14), lat=lat, lon=lon)
    return result or []
