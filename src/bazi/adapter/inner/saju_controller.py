from dataclasses import asdict
from datetime import datetime

from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from bazi.application.saju_service import SajuService
from bazi.container import Container
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

saju_router = APIRouter()


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"


@saju_router.post("/api/analyze")
@inject
async def analyze(
    req: AnalysisRequest,
    saju_service: SajuService = Depends(Provide[Container.saju_service]),
) -> dict:
    try:
        user = User(
            name="",
            gender=req.gender,
            birth_dt=req.birth_dt,
            city=req.city,
        )
        birth_dt = req.birth_dt
        saju = Saju(birth_dt.year, birth_dt.month, birth_dt.day, birth_dt.hour, birth_dt.minute, city=req.city)
        interpretation = saju_service.analyze(saju, user, req.analysis_year)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return asdict(interpretation)
