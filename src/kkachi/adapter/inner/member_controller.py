from datetime import datetime
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from kkachi.application.home_service import HomeService
from kkachi.application.member_service import MemberService
from kkachi.container import Container

member_router = APIRouter(prefix="/members", tags=["members"])


class MemberCreateRequest(BaseModel):
    name: str
    email: str


class MemberResponse(BaseModel):
    id: UUID
    name: str
    email: str
    created_at: datetime


@member_router.post("", response_model=MemberResponse, status_code=201)
@inject
async def create_member(
    req: MemberCreateRequest,
    svc: MemberService = Depends(Provide[Container.member_service]),
) -> MemberResponse:
    member = await svc.create_member(req.name, req.email)
    return MemberResponse(**vars(member))


@member_router.get("/{member_id}", response_model=MemberResponse)
@inject
async def get_member(
    member_id: UUID,
    svc: MemberService = Depends(Provide[Container.member_service]),
) -> MemberResponse:
    member = await svc.get_member(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return MemberResponse(**vars(member))


@member_router.get("/{member_id}/home")
@inject
async def get_home(
    member_id: UUID,
    svc: HomeService = Depends(Provide[Container.home_service]),
) -> dict:
    """홈 한 장 — 오늘의 나(캐릭터·아침 한 마디) · 오늘 내 사람들(캐릭터·오늘의 궁합) · 이어서 할 것 후보."""
    home = await svc.get_home(member_id)
    if home is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return home


@member_router.delete("/{member_id}", status_code=204)
@inject
async def delete_member(
    member_id: UUID,
    svc: MemberService = Depends(Provide[Container.member_service]),
) -> None:
    member = await svc.get_member(member_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    await svc.delete_member(member_id)
