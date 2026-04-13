from collections import Counter

import httpx

from kkachi.application.port.weather_port import WeatherPort
from kkachi.domain.ganji import Oheng

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# WMO 코드 → 오행
WMO_OHENG: dict[int, Oheng] = {
    0: Oheng.火, 1: Oheng.火,               # 맑음
    2: Oheng.土, 3: Oheng.金,               # 구름많음 / 흐림
    45: Oheng.土, 48: Oheng.土,             # 안개
    51: Oheng.水, 53: Oheng.水, 55: Oheng.水,  # 이슬비
    61: Oheng.水, 63: Oheng.水, 65: Oheng.水,  # 비
    71: Oheng.水, 73: Oheng.水, 75: Oheng.水, 77: Oheng.水,  # 눈
    80: Oheng.水, 81: Oheng.水, 82: Oheng.水,  # 소나기
    85: Oheng.水, 86: Oheng.水,             # 눈 소나기
    95: Oheng.水, 96: Oheng.水, 99: Oheng.水,  # 뇌우
}

WMO_LABEL: dict[int, str] = {
    0: "맑음", 1: "대체로 맑음", 2: "구름많음", 3: "흐림",
    45: "안개", 48: "결빙 안개",
    51: "이슬비", 53: "이슬비", 55: "이슬비",
    61: "비", 63: "비", 65: "폭우",
    71: "눈", 73: "눈", 75: "폭설", 77: "싸락눈",
    80: "소나기", 81: "소나기", 82: "강한 소나기",
    85: "눈 소나기", 86: "눈 소나기",
    95: "뇌우", 96: "뇌우(우박)", 99: "뇌우(폭우)",
}

# 도시 이름 → (lat, lon) 캐시 (프로세스 수명 동안 유지)
_geo_cache: dict[str, tuple[float, float]] = {
    "Seoul": (37.5665, 126.9780),
    "서울": (37.5665, 126.9780),
}


async def _resolve_latlon(city: str) -> tuple[float, float]:
    if city in _geo_cache:
        return _geo_cache[city]
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(GEOCODING_URL, params={"name": city, "count": 1, "language": "ko"})
            resp.raise_for_status()
            results = resp.json().get("results")
            if results:
                lat, lon = results[0]["latitude"], results[0]["longitude"]
                _geo_cache[city] = (lat, lon)
                return lat, lon
    except Exception:
        pass
    return _geo_cache["Seoul"]  # fallback


_SHOW_HOURS = {0, 3, 6, 9, 12, 15, 18, 21}


class WeatherAdapter(WeatherPort):
    async def get_forecast(
        self, city: str, days: int = 7,
        lat: float | None = None, lon: float | None = None,
    ) -> list[dict] | None:
        """도시명 또는 좌표로 days일치 날씨 반환. 실패 시 None."""
        if lat is not None and lon is not None:
            pass  # 좌표 직접 사용
        else:
            lat, lon = await _resolve_latlon(city)
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min",
            "hourly": "temperature_2m,weather_code",
            "timezone": "Asia/Seoul",
            "forecast_days": min(days, 16),
        }
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(FORECAST_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception:
            return None

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        codes = daily.get("weather_code", [])
        t_max = daily.get("temperature_2m_max", [])
        t_min = daily.get("temperature_2m_min", [])

        hourly = data.get("hourly", {})
        h_times = hourly.get("time", [])
        h_temps = hourly.get("temperature_2m", [])
        h_codes = hourly.get("weather_code", [])

        hours_by_date: dict[str, list[dict]] = {}
        raw_codes_by_date: dict[str, list[int]] = {}
        for i, ts in enumerate(h_times):
            date_part, time_part = ts.split("T")
            hour = int(time_part.split(":")[0])
            if hour not in _SHOW_HOURS:
                continue
            code = int(h_codes[i]) if i < len(h_codes) else 0
            temp = h_temps[i] if i < len(h_temps) else 15.0
            hours_by_date.setdefault(date_part, []).append({
                "hour": f"{hour:02d}시",
                "temperature": round(temp, 1),
                "condition": WMO_LABEL.get(code, "흐림"),
                "element": WMO_OHENG.get(code, Oheng.土).name,
            })
            raw_codes_by_date.setdefault(date_part, []).append(code)

        result = []
        for i, date_str in enumerate(dates):
            mx = t_max[i] if i < len(t_max) and t_max[i] is not None else None
            mn = t_min[i] if i < len(t_min) and t_min[i] is not None else None
            temp = (mx + mn) / 2 if mx is not None and mn is not None else (mx or mn or 15.0)
            day_raw_codes = raw_codes_by_date.get(date_str)
            code = Counter(day_raw_codes).most_common(1)[0][0] if day_raw_codes else (int(codes[i]) if i < len(codes) else 0)
            element = WMO_OHENG.get(code, Oheng.土)
            label = WMO_LABEL.get(code, "흐림")
            result.append({
                "date": date_str,
                "temperature": round(temp, 1),
                "temp_max": round(mx, 1) if mx is not None else None,
                "temp_min": round(mn, 1) if mn is not None else None,
                "weather_code": code,
                "element": element.name,
                "condition": f"{label} {temp:.0f}°C",
                "hours": hours_by_date.get(date_str, []),
            })
        return result
