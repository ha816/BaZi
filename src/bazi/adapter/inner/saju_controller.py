from dataclasses import asdict
from datetime import datetime

from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from bazi.adapter.outer.weather_adapter import WeatherAdapter
from bazi.application.saju_service import SajuService
from bazi.container import Container
from bazi.domain.user import Gender, User

saju_router = APIRouter()


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"


def _make_user(req: AnalysisRequest) -> User:
    return User(name="", gender=req.gender, birth_dt=req.birth_dt, city=req.city)



@saju_router.get("/weather")
@inject
async def get_weather(
    city: str = "Seoul",
    weather_adapter: WeatherAdapter = Depends(Provide[Container.weather_adapter]),
) -> dict:
    forecast = await weather_adapter.get_forecast(city, days=3)
    if not forecast:
        fallback = {"temperature": 15.0, "element": "土", "condition": "흐림 15°C"}
        return {"city": city, "days": [fallback, fallback, fallback]}
    return {
        "city": city,
        "days": [
            {
                "date": d["date"],
                "temperature": d["temperature"],
                "element": d["element"],
                "condition": d["condition"],
                "hours": d.get("hours", []),
            }
            for d in forecast[:3]
        ],
    }


@saju_router.post("/saju/interpret")
@inject
async def interpret(
    req: AnalysisRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> dict:
    try:
        user = _make_user(req)
        natal_info, postnatal_info = saju_svc.analyze(user, req.analysis_year)
        result = saju_svc.interpret(natal_info, postnatal_info)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")
    return asdict(result)
