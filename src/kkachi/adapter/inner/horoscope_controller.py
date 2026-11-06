from datetime import date, datetime
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Query

from kkachi.application.horoscope_rules import build_week
from kkachi.application.port.astro_port import AstroPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.container import Container
from kkachi.domain.user import Gender, User

horoscope_router = APIRouter()


@horoscope_router.get("/week")
@inject
async def get_horoscope_week(
    days: int = Query(7, ge=1, le=14),
    member_id: UUID | None = None,
    birth_dt: datetime | None = None,
    gender: Gender | None = None,
    hour_unknown: bool = False,
    city: str = "Seoul",
    name: str = "",
    astro: AstroPort = Depends(Provide[Container.astro_adapter]),
    profile_port: ProfilePort = Depends(Provide[Container.profile_repo]),
) -> dict:
    """별자리 상세(/stars, 로그인 불필요, 2026-11-06) — 오늘 12별자리 전체 + 오늘부터 days일 달의 길.
    member_id가 있으면 그 회원의 기본 프로필로, 아니면 birth_dt&gender 직접 입력으로 개인판 me(출생 차트 + 날마다 개인판).
    둘 다 없거나 기본 프로필이 없으면 me null(일반판만). 계산 규칙은 specs/home/horoscope.md §4."""
    today = date.today()
    user = None
    if member_id is not None:
        me = next((p for p in await profile_port.list_by_member(member_id) if p.is_self), None)
        user = me.to_user() if me else None
    elif birth_dt is not None and gender is not None:
        user = User(name=name, gender=gender, birth_dt=birth_dt, city=city, hour_unknown=hour_unknown)
    return {"date": today.isoformat(), **build_week(astro, today, days, user)}
