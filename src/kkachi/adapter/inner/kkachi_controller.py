from dataclasses import asdict
from datetime import datetime

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from kkachi.application.kkachi_service import KkachiService
from kkachi.application.report_builder import LlmReportBuilder
from kkachi.container import Container
from kkachi.domain.user import Gender, User

kkachi_router = APIRouter()

class AnalysisRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"
    longitude: float | None = None
    name: str = ""
    hour_unknown: bool = False


def _make_user(req: AnalysisRequest) -> User:
    return User(name="", gender=req.gender, birth_dt=req.birth_dt, city=req.city, longitude=req.longitude, hour_unknown=req.hour_unknown)


@kkachi_router.post("/interpret")
@inject
async def interpret(
    req: AnalysisRequest,
    saju_svc: KkachiService = Depends(Provide[Container.kkachi_service]),
) -> dict:
    try:
        user = _make_user(req)
        natal_info, postnatal_info = saju_svc.analyze(user, req.analysis_year)
        result = await saju_svc.interpret(natal_info, postnatal_info, user=user, name=req.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"분석 중 오류: {e}")
    return asdict(result)


class ChatRequest(BaseModel):
    birth_dt: datetime
    gender: Gender = Gender.MALE
    analysis_year: int = 2026
    city: str = "Seoul"
    name: str = ""
    hour_unknown: bool = False
    messages: list[dict]  # [{"role": "user"|"assistant", "content": "..."}]


_CHAT_SYSTEM = """\
당신은 한국 사주명리 전문가 상담사입니다.
아래 상담자의 사주 정보를 바탕으로 질문에 친근하고 구체적으로 답해주세요.
- 반드시 한국어(한글)로만 작성. 중국어·일본어·영어 단어 사용 금지 (고유명사·전문용어 제외)
- 답변은 225자 이내, 존댓말 사용
- 사주 데이터에 근거한 조언 위주
- "사주에 따르면" 같은 표현 금지
- 모르는 내용은 솔직하게 모른다고 할 것

[상담자 사주]
{context}"""


@kkachi_router.post("/chat")
@inject
async def chat(
    req: ChatRequest,
    saju_svc: KkachiService = Depends(Provide[Container.kkachi_service]),
) -> StreamingResponse:
    user = User(name="", gender=req.gender, birth_dt=req.birth_dt, city=req.city, hour_unknown=req.hour_unknown)
    natal_info, postnatal_info = saju_svc.analyze(user, req.analysis_year)
    interpretation = await saju_svc.interpret(natal_info, postnatal_info, user=user, name=req.name)
    context = saju_svc.build_chat_context(interpretation, user, req.name)
    system_prompt = _CHAT_SYSTEM.format(context=context)

    messages = [{"role": "system", "content": system_prompt}] + req.messages[-10:]

    async def generate():
        if saju_svc._llm_port and saju_svc._llm_port.available:
            async for chunk in saju_svc._llm_port.stream_chat(messages):
                yield chunk

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")


@kkachi_router.post("/stream-report")
@inject
async def stream_report(
    req: AnalysisRequest,
    saju_svc: KkachiService = Depends(Provide[Container.kkachi_service]),
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
