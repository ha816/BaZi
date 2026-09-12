import os
from dataclasses import asdict
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Header, HTTPException

from kkachi.application.port.event_port import EventPort
from kkachi.application.port.feedback_port import FeedbackPort
from kkachi.application.push_service import PushService
from kkachi.container import Container

admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.get("/feedback/summary")
@inject
async def feedback_summary(
    repo: FeedbackPort = Depends(Provide[Container.feedback_repo]),
) -> list[dict]:
    summaries = await repo.summary()
    summaries.sort(key=lambda s: (s.positive_rate, -s.total))
    return [asdict(s) for s in summaries]


@admin_router.get("/events/summary")
@inject
async def events_summary(
    days: int = 7,
    repo: EventPort = Depends(Provide[Container.event_repo]),
) -> list[dict]:
    return [asdict(s) for s in await repo.summary(min(max(days, 1), 90))]


@admin_router.post("/push/send-daily")
@inject
async def push_send_daily(
    dry_run: bool = True,
    member_id: UUID | None = None,
    x_admin_token: str | None = Header(default=None),
    svc: PushService = Depends(Provide[Container.push_service]),
) -> list[dict]:
    """아침 알림 발송. 기본은 dry_run(페이로드 미리보기). 실발송은 KKACHI_ADMIN_TOKEN 헤더 일치 시에만."""
    if not dry_run:
        expected = os.getenv("KKACHI_ADMIN_TOKEN")
        if not expected:
            raise HTTPException(status_code=503, detail="KKACHI_ADMIN_TOKEN 미설정 — 실발송은 scripts/send_daily_push.py 사용")
        if x_admin_token != expected:
            raise HTTPException(status_code=401, detail="관리자 토큰 불일치")
    return await svc.send_daily(dry_run=dry_run, only_member=member_id)
