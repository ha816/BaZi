from dataclasses import asdict

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends

from kkachi.application.port.feedback_port import FeedbackPort
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
