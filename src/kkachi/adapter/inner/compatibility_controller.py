from datetime import datetime
from typing import Literal
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from kkachi.application.compatibility_service import CompatibilityService
from kkachi.container import Container
from kkachi.domain.user import Gender, User

RelationTypeStr = Literal["lover", "friend", "family"]

compatibility_router = APIRouter(prefix="/compatibility", tags=["compatibility"])


class PersonInput(BaseModel):
    name: str
    gender: str  # "male" | "female"
    birth_dt: datetime
    city: str = "Seoul"


def _to_user(p: PersonInput) -> User:
    gender = Gender.MALE if p.gender == "male" else Gender.FEMALE
    return User(name=p.name, gender=gender, birth_dt=p.birth_dt, city=p.city)


class CompatibilityRequest(BaseModel):
    profile_id_1: UUID
    profile_id_2: UUID
    year: int
    relation_type: RelationTypeStr = "lover"


@compatibility_router.post("")
@inject
async def analyze_compatibility(
    req: CompatibilityRequest,
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> dict:
    try:
        return await svc.analyze_compatibility(
            req.profile_id_1, req.profile_id_2, req.year, req.relation_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class DirectCompatibilityRequest(BaseModel):
    person1: PersonInput
    person2: PersonInput
    year: int
    relation_type: RelationTypeStr = "lover"


@compatibility_router.post("/direct")
@inject
async def analyze_compatibility_direct(
    req: DirectCompatibilityRequest,
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> dict:
    user1 = _to_user(req.person1)
    user2 = _to_user(req.person2)
    return await svc.compute_direct(user1, user2, req.year, req.relation_type)


_CHAT_SYSTEM = """\
당신은 한국 사주명리 전문가 상담사입니다.
아래 두 분의 사주와 궁합 분석 데이터를 바탕으로 두 분의 관계에 대한 질문에 답해주세요.
- 답변은 225자 이내, 친근한 존댓말 사용
- 데이터에 근거한 구체적 조언 위주, 강점·약점 모두 솔직하게
- "사주에 따르면" 같은 표현 금지
- 모르는 내용은 솔직하게 모른다고 할 것

[두 분의 사주·궁합 데이터]
{context}"""


class CompatibilityChatRequest(BaseModel):
    person1: PersonInput
    person2: PersonInput
    year: int
    messages: list[dict]
    relation_type: RelationTypeStr = "lover"


@compatibility_router.post("/chat")
@inject
async def compatibility_chat(
    req: CompatibilityChatRequest,
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> StreamingResponse:
    user1 = _to_user(req.person1)
    user2 = _to_user(req.person2)
    context = svc.build_chat_context(
        user1, user2, req.year, req.person1.name, req.person2.name, req.relation_type,
    )
    system_prompt = _CHAT_SYSTEM.format(context=context)
    messages = [{"role": "system", "content": system_prompt}] + req.messages[-10:]

    async def generate():
        llm = svc._llm_port
        if llm and llm.available:
            async for chunk in llm.stream_chat(messages):
                yield chunk

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")


class CompatibilityNarrativeRequest(BaseModel):
    person1: PersonInput
    person2: PersonInput
    year: int
    relation_type: RelationTypeStr = "lover"


@compatibility_router.post("/narrative")
@inject
async def compatibility_narrative(
    req: CompatibilityNarrativeRequest,
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> StreamingResponse:
    user1 = _to_user(req.person1)
    user2 = _to_user(req.person2)
    prompt = svc.build_narrative_prompt(user1, user2, req.year, req.relation_type)

    async def generate():
        llm = svc._llm_port
        if llm and llm.available:
            async for chunk in llm.stream_interpret(prompt):
                yield chunk

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
