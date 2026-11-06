from datetime import date, datetime
from typing import Literal
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from kkachi.application.fortune_rules import compute_fortune
from kkachi.application.iching_rules import (
    CRISIS_MESSAGE,
    HELPLINES,
    QUESTION_MAX,
    QUESTION_MIN,
    ask,
    check_question,
    cross_line,
)
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.profile_port import ProfilePort
from kkachi.container import Container
from kkachi.domain.user import Gender, User

iching_router = APIRouter()


class IchingAskRequest(BaseModel):
    question: str = Field(min_length=QUESTION_MIN, max_length=QUESTION_MAX)
    category: Literal["연애", "일", "재물", "기타"] | None = None  # 없으면 질문에서 감지
    member_id: UUID | None = None  # 있으면 그 회원의 기본 프로필로 사주 교차
    birth_dt: datetime | None = None
    gender: Gender | None = None
    hour_unknown: bool = False
    city: str = "Seoul"


@iching_router.post("/ask")
@inject
async def ask_iching(
    req: IchingAskRequest,
    saju_svc: KkachiService = Depends(Provide[Container.kkachi_service]),
    profile_port: ProfilePort = Depends(Provide[Container.profile_repo]),
) -> dict:
    """질문 괘(V11-1, 로그인 불필요) — 질문 → 3동전 여섯 번 → 본괘·변효·지괘 → 지금/앞으로 한 줄 + 영역 한 줄.
    member_id(기본 프로필) 또는 birth_dt&gender가 있으면 용신·오늘 일진과의 교차 두 문장(cross)을 붙인다. 저장 없음.
    위기 신호면 괘를 뽑지 않고 200 {blocked:"crisis", message, helplines}."""
    if check_question(req.question) == "crisis":
        return {"blocked": "crisis", "message": CRISIS_MESSAGE, "helplines": list(HELPLINES)}
    today = date.today()
    user = None
    if req.member_id is not None:
        me = next((p for p in await profile_port.list_by_member(req.member_id) if p.is_self), None)
        user = me.to_user() if me else None
    elif req.birth_dt is not None and req.gender is not None:
        user = User(name="", gender=req.gender, birth_dt=req.birth_dt, city=req.city, hour_unknown=req.hour_unknown)
    out = ask(req.question, today, user, req.category)
    if user is not None:
        natal = saju_svc.analyze_natal(user)
        out["cross"] = cross_line(out, natal.yongshin, compute_fortune(natal, today).level)
    return out
