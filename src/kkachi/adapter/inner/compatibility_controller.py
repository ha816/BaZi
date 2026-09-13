from datetime import date, datetime
from typing import Literal
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from kkachi.application.compatibility_daily import compute_daily_compat
from kkachi.application.compatibility_service import CompatibilityService
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.profile_port import ProfilePort
from kkachi.container import Container
from kkachi.domain.user import Gender, User

RelationTypeStr = Literal["lover", "friend", "family"]

compatibility_router = APIRouter(prefix="/compatibility", tags=["compatibility"])


class PersonInput(BaseModel):
    name: str
    gender: str  # "male" | "female"
    birth_dt: datetime
    city: str = "Seoul"
    hour_unknown: bool = False


def _to_user(p: PersonInput) -> User:
    gender = Gender.MALE if p.gender == "male" else Gender.FEMALE
    return User(name=p.name, gender=gender, birth_dt=p.birth_dt, city=p.city, hour_unknown=p.hour_unknown)


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
- 반드시 한국어(한글)로만 작성. 중국어·일본어·영어 단어 사용 금지 (고유명사·전문용어 제외)
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


class InviteCreateRequest(BaseModel):
    person1: PersonInput
    relation_type: RelationTypeStr = "lover"


@compatibility_router.post("/invites", status_code=201)
@inject
async def create_invite(
    req: InviteCreateRequest,
    invite_repo=Depends(Provide[Container.invite_repo]),
) -> dict:
    """초대자 정보를 저장하고 invite id 반환. 상대는 /compatibility?invite=<id> 로 열어 자기 정보만 넣는다."""
    payload = {
        "name": req.person1.name,
        "gender": req.person1.gender,
        "birth_dt": req.person1.birth_dt.isoformat(),
        "city": req.person1.city,
        "hour_unknown": req.person1.hour_unknown,
        "relation_type": req.relation_type,
    }
    invite_id = await invite_repo.create(payload)
    return {"invite_id": str(invite_id)}


@compatibility_router.get("/invites/{invite_id}")
@inject
async def get_invite(
    invite_id: UUID,
    invite_repo=Depends(Provide[Container.invite_repo]),
) -> dict:
    """초대자 표시 정보만 반환 (생년월일·도시 등 민감정보는 제외)."""
    payload = await invite_repo.get(invite_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="초대 링크가 만료되었거나 존재하지 않습니다.")
    return {"name": payload["name"], "relation_type": payload["relation_type"]}


class InviteResolveRequest(BaseModel):
    person2: PersonInput
    year: int


@compatibility_router.post("/invites/{invite_id}/resolve")
@inject
async def resolve_invite(
    invite_id: UUID,
    req: InviteResolveRequest,
    invite_repo=Depends(Provide[Container.invite_repo]),
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> dict:
    """상대가 자기 정보를 넣으면 초대자 정보와 합쳐 궁합 결과 반환."""
    payload = await invite_repo.get(invite_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="초대 링크가 만료되었거나 존재하지 않습니다.")
    user1 = User(
        name=payload["name"],
        gender=Gender.MALE if payload["gender"] == "male" else Gender.FEMALE,
        birth_dt=datetime.fromisoformat(payload["birth_dt"]),
        city=payload["city"],
        hour_unknown=payload.get("hour_unknown", False),
    )
    user2 = _to_user(req.person2)
    return await svc.compute_direct(user1, user2, req.year, payload["relation_type"])


@compatibility_router.get("/daily")
@inject
async def daily_compat(
    member_id: UUID,
    p1: UUID,
    p2: UUID,
    profile_port: ProfilePort = Depends(Provide[Container.profile_repo]),
    saju_svc: KkachiService = Depends(Provide[Container.kkachi_service]),
) -> dict:
    """두 프로필의 오늘 궁합 한 줄. 홈 피드 배지용."""
    prof1 = await profile_port.get(p1)
    prof2 = await profile_port.get(p2)
    if prof1 is None or prof2 is None:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다.")
    if prof1.member_id != member_id or prof2.member_id != member_id:
        raise HTTPException(status_code=403, detail="본인 프로필만 조회할 수 있습니다.")
    u1 = User(name=prof1.name, gender=prof1.gender, birth_dt=prof1.birth_dt, city=prof1.city, hour_unknown=prof1.birth_hour_unknown)
    u2 = User(name=prof2.name, gender=prof2.gender, birth_dt=prof2.birth_dt, city=prof2.city, hour_unknown=prof2.birth_hour_unknown)
    natal1, _ = saju_svc.analyze(u1, date.today().year)
    natal2, _ = saju_svc.analyze(u2, date.today().year)
    return compute_daily_compat(natal1, natal2, date.today(), prof1.name, prof2.name)
