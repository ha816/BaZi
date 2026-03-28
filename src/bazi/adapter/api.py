from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from bazi.adapter.schema import AnalysisRequest, AnalysisResponse, build_response
from bazi.application.interpret import Interpreter
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User

app = FastAPI(title="사주팔자 분석 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

analyze_natal = NatalAnalyzer()
analyze_postnatal = PostnatalAnalyzer()
interpret = Interpreter()


@app.post("/api/analyze", response_model=AnalysisResponse)
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
        natal = analyze_natal(saju)
        postnatal = analyze_postnatal(user, natal, year=req.analysis_year)
        interpretation = interpret(natal, postnatal)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")

    return build_response(natal, postnatal, interpretation)
