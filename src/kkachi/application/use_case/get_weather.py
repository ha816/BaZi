from kkachi.application.port.weather_port import WeatherPort


class GetWeatherUseCase:
    def __init__(self, weather_port: WeatherPort):
        self._weather = weather_port

    async def execute(self, city: str) -> dict:
        forecasts = await self._weather.get_forecast(city, days=1)
        if not forecasts:
            return {"error": "날씨 정보를 가져올 수 없습니다."}
        today = forecasts[0]
        element_korean = {
            "木": "목(나무)", "火": "화(불)", "土": "토(흙)", "金": "금(쇠)", "水": "수(물)",
        }
        return {
            "condition": today.get("condition"),
            "element": today.get("element"),
            "temperature": today.get("temperature"),
            "element_korean": element_korean.get(today.get("element", ""), today.get("element", "")),
        }
