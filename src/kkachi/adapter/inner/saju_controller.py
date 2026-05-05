from dataclasses import asdict
from datetime import datetime

from dependency_injector.wiring import inject, Provide
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from kkachi.application.report_builder import LlmReportBuilder
from kkachi.application.saju_service import SajuService
from kkachi.container import Container
from kkachi.domain.user import Gender, User

saju_router = APIRouter()


class BasicRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    city: str = "Seoul"
    longitude: float | None = None
    year: int = 2026


class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"
    longitude: float | None = None
    name: str = ""


def _make_user(req: BasicRequest | AnalysisRequest) -> User:
    return User(name="", gender=req.gender, birth_dt=req.birth_dt, city=req.city, longitude=req.longitude)



@saju_router.post("/saju/basic")
@inject
async def basic(
    req: BasicRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> dict:
    try:
        return saju_svc.basic_analyze(_make_user(req), req.year)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")


@saju_router.post("/saju/interpret")
@inject
async def interpret(
    req: AnalysisRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> dict:
    try:
        user = _make_user(req)
        natal_info, postnatal_info = saju_svc.analyze(user, req.analysis_year)
        result = await saju_svc.interpret(natal_info, postnatal_info, user=user, name=req.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")
    return asdict(result)


@saju_router.post("/saju/report")
@inject
async def report(
    req: AnalysisRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> dict:
    try:
        user = _make_user(req)
        return await saju_svc.build_report(user, req.analysis_year, req.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"레포트 생성 중 오류: {e}")


@saju_router.post("/saju/stream-report")
@inject
async def stream_report(
    req: AnalysisRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> StreamingResponse:
    user = _make_user(req)
    natal_info, postnatal_info = saju_svc.analyze(user, req.analysis_year)
    interpretation = await saju_svc.interpret(natal_info, postnatal_info, user=user, name=req.name)
    report_md = LlmReportBuilder().build(interpretation.natal, interpretation.postnatal, user, req.name)

    async def generate():
        if saju_svc._llm_port and saju_svc._llm_port.available:
            async for chunk in saju_svc._llm_port.stream_interpret(report_md):
                yield chunk

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
