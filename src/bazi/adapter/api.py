from dataclasses import asdict
from datetime import datetime

from fastapi import APIRouter, HTTPException

from bazi.application.interpret import Interpreter
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

router = APIRouter()


@router.post("/api/analyze")
def analyze(
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    birth_minute: int = 0,
    gender: str = "male",
    analysis_year: int = 2026,
    city: str = "Seoul",
) -> dict:
    try:
        birth_dt = datetime(birth_year, birth_month, birth_day, birth_hour, birth_minute)
        user = User(
            name="",
            gender=Gender.MALE if gender == "male" else Gender.FEMALE,
            birth_dt=birth_dt,
            city=city,
        )
        saju = Saju(birth_year, birth_month, birth_day, birth_hour, birth_minute, city=city)
        natal = NatalAnalyzer()(saju)
        postnatal = PostnatalAnalyzer()(user, natal, year=analysis_year)
        interpretation = Interpreter()(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return asdict(interpretation)
