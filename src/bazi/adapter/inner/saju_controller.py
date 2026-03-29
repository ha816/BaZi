from dataclasses import asdict
from datetime import datetime

from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from bazi.application.natal_service import NatalAnalyzer, PostnatalAnalyzer
from bazi.application.saju_service import Interpreter
from bazi.container import Container
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

router = APIRouter()


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"


@router.post("/api/analyze")
@inject
def analyze(
    req: AnalysisRequest,
    natal_analyzer: NatalAnalyzer = Depends(Provide[Container.natal_analyzer]),
    postnatal_analyzer: PostnatalAnalyzer = Depends(Provide[Container.postnatal_analyzer]),
    interpreter: Interpreter = Depends(Provide[Container.interpreter]),
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
        natal = natal_analyzer(saju)
        postnatal = postnatal_analyzer(user, natal, year=req.analysis_year)
        interpretation = interpreter(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return asdict(interpretation)
