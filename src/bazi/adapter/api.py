from dataclasses import asdict
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from bazi.application.interpret import Interpreter
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

router = APIRouter()


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: str = "male"
    analysis_year: int = 2026
    city: str = "Seoul"


@router.post("/api/analyze")
def analyze(req: AnalysisRequest) -> dict:
    try:
        dt = req.birth_dt
        user = User(
            name="",
            gender=Gender.MALE if req.gender == "male" else Gender.FEMALE,
            birth_dt=dt,
            city=req.city,
        )
        saju = Saju(dt.year, dt.month, dt.day, dt.hour, dt.minute, city=req.city)
        natal = NatalAnalyzer()(saju)
        postnatal = PostnatalAnalyzer()(user, natal, year=req.analysis_year)
        interpretation = Interpreter()(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return asdict(interpretation)
