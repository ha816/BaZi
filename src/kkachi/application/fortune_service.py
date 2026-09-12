from dataclasses import asdict
from datetime import date, timedelta
from uuid import UUID

from kkachi.application.fortune_rules import compute_fortune
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.fortune_port import FortunePort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.port.weather_port import WeatherPort
from kkachi.domain.user import User


class FortuneService:
    def __init__(
        self,
        profile_port: ProfilePort,
        fortune_port: FortunePort,
        saju_service: KkachiService,
        weather_adapter: WeatherPort | None = None,
    ):
        self._profile_port = profile_port
        self._fortune_port = fortune_port
        self._saju_service = saju_service
        self._weather = weather_adapter

    async def get_fortune(self, profile_id: UUID, today: date | None = None) -> dict:
        if today is None:
            today = date.today()

        cached = await self._fortune_port.get(profile_id, today)
        # 날씨 어댑터가 있는데 캐시에 날씨가 없거나, 아침 한 마디(headline)가 없는 옛 캐시면 재계산
        if cached and cached.result.get("headline") and (self._weather is None or cached.result.get("weather") is not None):
            return cached.result

        profile = await self._profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")

        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)
        natal, postnatal = self._saju_service.analyze(user, today.year)
        weather_map = await self._get_weather_map(profile.city, days=1)
        weather = weather_map.get(today.isoformat())

        fortune = compute_fortune(natal, today, weather, postnatal, name=profile.name)
        result = asdict(fortune)
        await self._fortune_port.save(profile_id, today, result)
        return result

    async def get_forecast(self, profile_id: UUID, days: int = 7, start_date: date | None = None) -> list[dict]:
        if start_date is None:
            today = date.today()
        else:
            today = start_date

        profile = await self._profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")

        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)
        # Note: Weather adapter currently only fetches future data.
        # For past dates, weather_map will be empty for those dates.
        weather_map = await self._get_weather_map(profile.city, days=days)

        results = []
        for i in range(days):
            target = today + timedelta(days=i)
            target_str = target.isoformat()
            weather = weather_map.get(target_str)

            cached = await self._fortune_port.get(profile_id, target)
            # 캐시 재사용 조건: headline 있고 (오늘 날씨가 없거나 캐시에 이미 날씨 있음)
            if cached and cached.result.get("headline") and (weather is None or cached.result.get("weather") is not None):
                results.append(cached.result)
                continue

            natal, postnatal = self._saju_service.analyze(user, target.year)
            fortune = compute_fortune(natal, target, weather, postnatal, name=profile.name)
            result = asdict(fortune)
            await self._fortune_port.save(profile_id, target, result)
            results.append(result)

        return results

    async def _get_weather_map(self, city: str, days: int) -> dict[str, dict]:
        """날짜 문자열 → 날씨 dict 맵 반환. 실패 시 빈 dict."""
        if self._weather is None:
            return {}
        forecast = await self._weather.get_forecast(city, days=days)
        if not forecast:
            return {}
        return {w["date"]: w for w in forecast}
