import math
from datetime import UTC, datetime

import ephem

from kkachi.adapter.outer.natal_adapter import CITY_LATLON
from kkachi.application.port.astro_port import AstroPort


class AstroAdapter(AstroPort):
    """ephem(libastro) — 태양·달은 그날 분점 기준 열대 황경, 상승점은 지방 항성시·황도경사·위도 공식.
    ephemeris 파일이 없고 한 번에 1ms 미만이라 캐시하지 않는다."""

    def positions(self, at_utc: datetime, city: str | None = None) -> dict[str, float]:
        d = ephem.Date(at_utc.astimezone(UTC).replace(tzinfo=None))  # ephem.Date는 tzinfo를 무시한다
        out = {
            k: math.degrees(ephem.Ecliptic(body, epoch=d).lon) % 360  # epoch=d — 빠지면 J2000 분점 기준
            for k, body in (("sun", ephem.Sun(d)), ("moon", ephem.Moon(d)))
        }
        if city is not None:
            lat, lon = CITY_LATLON.get(city.strip().lower(), CITY_LATLON["seoul"])
            obs = ephem.Observer()
            obs.lat, obs.lon, obs.date = math.radians(lat), math.radians(lon), d  # float 대입은 라디안
            ramc = float(obs.sidereal_time())
            eps = math.radians(23.439291 - 0.0130042 * (d - ephem.J2000) / 36525)
            asc = math.atan2(math.cos(ramc), -(math.sin(ramc) * math.cos(eps) + math.tan(math.radians(lat)) * math.sin(eps)))
            out["asc"] = math.degrees(asc) % 360
        return out
