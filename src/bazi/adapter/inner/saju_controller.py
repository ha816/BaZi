from dataclasses import asdict
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from bazi.application.interpreter import Interpreter
from bazi.application.natal_service import NatalAnalyzer, PostnatalAnalyzer
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

router = APIRouter()


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"


@router.post("/api/analyze")
def analyze(req: AnalysisRequest) -> dict:
    try:
        user = User(
            name="",
            gender=req.gender,
            birth_dt=req.birth_dt,
            city=req.city,
        )
        birth_dt = req.birth_dt
        saju = Saju(birth_dt.year, birth_dt.month, birth_dt.day, birth_dt.hour, birth_dt.minute, city=req.city)
        natal = NatalAnalyzer()(saju)
        postnatal = PostnatalAnalyzer()(user, natal, year=req.analysis_year)
        interpretation = Interpreter()(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return asdict(interpretation)
