from dataclasses import asdict
from datetime import datetime

from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from bazi.application.saju_service import SajuService
from bazi.container import Container
from bazi.domain.user import Gender, User

saju_router = APIRouter()


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"


@saju_router.post("/saju/interpret")
@inject
async def interpret(
    req: AnalysisRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> dict:
    try:
        user = User(
            name="",
            gender=req.gender,
            birth_dt=req.birth_dt,
            city=req.city,
        )
        natal, postnatal = saju_svc.analyze(user, req.analysis_year)
        interpretation = saju_svc.interpret(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return asdict(interpretation)
