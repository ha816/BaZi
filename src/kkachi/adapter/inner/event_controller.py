from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from kkachi.application.port.event_port import EventPort
from kkachi.container import Container

event_router = APIRouter(prefix="/events", tags=["events"])


class EventRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=64)
    name: str = Field(min_length=1, max_length=50, pattern=r"^[a-z][a-z0-9_]*$")
    member_id: UUID | None = None
    props: dict = Field(default_factory=dict)


@event_router.post("", status_code=202)
@inject
async def track_event(
    req: EventRequest,
    repo: EventPort = Depends(Provide[Container.event_repo]),
) -> dict:
    await repo.save(req.session_id, req.member_id, req.name, req.props)
    return {}
