from datetime import datetime

from fastapi import APIRouter, HTTPException

from bazi.adapter.schema import AnalysisRequest, AnalysisResponse, build_response
from bazi.application.interpret import Interpreter
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

router = APIRouter()


@router.post("/api/analyze", response_model=AnalysisResponse)
def analyze(req: AnalysisRequest) -> AnalysisResponse:
    try:
        birth_dt = datetime(
            req.birth_year, req.birth_month, req.birth_day,
            req.birth_hour, req.birth_minute,
        )
        user = User(
            name="",
            gender=Gender.MALE if req.gender == "male" else Gender.FEMALE,
            birth_dt=birth_dt,
            city=req.city,
        )
        saju = Saju(
            req.birth_year, req.birth_month, req.birth_day,
            req.birth_hour, req.birth_minute, city=req.city,
        )
        natal = NatalAnalyzer()(saju)
        postnatal = PostnatalAnalyzer()(user, natal, year=req.analysis_year)
        interpretation = Interpreter()(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return build_response(natal, postnatal, interpretation)
