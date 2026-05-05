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


class ChatRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"
    name: str = ""
    messages: list[dict]  # [{"role": "user"|"assistant", "content": "..."}]


_CHAT_SYSTEM = """\
당신은 한국 사주명리 전문가 상담사입니다.
아래 상담자의 사주 정보를 바탕으로 질문에 친근하고 구체적으로 답해주세요.
- 답변은 300자 이내, 존댓말 사용
- 사주 데이터에 근거한 조언 위주
- "사주에 따르면" 같은 표현 금지
- 모르는 내용은 솔직하게 모른다고 할 것

[상담자 사주]
{context}"""


@saju_router.post("/saju/chat")
@inject
async def chat(
    req: ChatRequest,
    saju_svc: SajuService = Depends(Provide[Container.saju_service]),
) -> StreamingResponse:
    user = User(name="", gender=req.gender, birth_dt=req.birth_dt, city=req.city)
    natal_info, postnatal_info = saju_svc.analyze(user, req.analysis_year)
    context = saju_svc.build_chat_context(natal_info, postnatal_info, user, req.name)
    system_prompt = _CHAT_SYSTEM.format(context=context)

    messages = [{"role": "system", "content": system_prompt}] + req.messages[-10:]

    async def generate():
        if saju_svc._llm_port and saju_svc._llm_port.available:
            async for chunk in saju_svc._llm_port.stream_chat(messages):
                yield chunk

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")


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
