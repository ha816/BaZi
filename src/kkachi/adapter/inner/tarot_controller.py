from datetime import date, datetime

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends

from kkachi.application.fortune_rules import compute_fortune
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.tarot_rules import cross_line, draw_daily
from kkachi.container import Container
from kkachi.domain.user import Gender, User

tarot_router = APIRouter()


@tarot_router.get("/today")
@inject
async def get_tarot_today(
    birth_dt: datetime | None = None,
    gender: Gender | None = None,
    hour_unknown: bool = False,
    city: str = "Seoul",
    saju_svc: KkachiService = Depends(Provide[Container.kkachi_service]),
) -> dict:
    """오늘의 카드(V9-1, 로그인 불필요) — 생년월일시·성별이 둘 다 있으면 그 사람 카드 + 오늘 일진과의 교차 한 줄,
    아니면 날짜 카드(모두 같은 카드, cross 없음). 로그인 사용자의 카드는 GET /members/{id}/home 의 me.tarot."""
    today = date.today()
    if birth_dt is None or gender is None:
        return {**draw_daily(today), "cross": None}
    user = User(name="", gender=gender, birth_dt=birth_dt, city=city, hour_unknown=hour_unknown)
    out = draw_daily(today, user)
    level = compute_fortune(saju_svc.analyze_natal(user), today).level
    return {**out, "cross": cross_line(out["card"], level, today)}
