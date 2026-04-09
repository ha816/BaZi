from datetime import datetime
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from kkachi.application.fortune_service import FortuneService
from kkachi.application.port.feedback_port import FeedbackPort
from kkachi.application.profile_service import ProfileService
from kkachi.container import Container
from kkachi.domain.user import Gender

profile_router = APIRouter(prefix="/members/{member_id}/profiles", tags=["profiles"])


class ProfileCreateRequest(BaseModel):
    name: str
    gender: Gender
    birth_dt: datetime
    city: str = "Seoul"


class ProfileResponse(BaseModel):
    id: UUID
    member_id: UUID
    name: str
    gender: Gender
    birth_dt: datetime
    city: str
    created_at: datetime


class AnalyzeRequest(BaseModel):
    year: int = 2026


@profile_router.post("", response_model=ProfileResponse, status_code=201)
@inject
async def create_profile(
    member_id: UUID,
    req: ProfileCreateRequest,
    svc: ProfileService = Depends(Provide[Container.profile_service]),
) -> ProfileResponse:
    profile = await svc.create_profile(member_id, req.name, req.gender, req.birth_dt, req.city)
    return ProfileResponse(**vars(profile))


@profile_router.get("", response_model=list[ProfileResponse])
@inject
async def list_profiles(
    member_id: UUID,
    svc: ProfileService = Depends(Provide[Container.profile_service]),
) -> list[ProfileResponse]:
    profiles = await svc.list_profiles(member_id)
    return [ProfileResponse(**vars(p)) for p in profiles]


@profile_router.get("/{profile_id}", response_model=ProfileResponse)
@inject
async def get_profile(
    member_id: UUID,
    profile_id: UUID,
    svc: ProfileService = Depends(Provide[Container.profile_service]),
) -> ProfileResponse:
    profile = await svc.get_profile(profile_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse(**vars(profile))


@profile_router.delete("/{profile_id}", status_code=204)
@inject
async def delete_profile(
    member_id: UUID,
    profile_id: UUID,
    svc: ProfileService = Depends(Provide[Container.profile_service]),
) -> None:
    await svc.delete_profile(profile_id)


@profile_router.post("/{profile_id}/analyze")
@inject
async def analyze_profile(
    member_id: UUID,
    profile_id: UUID,
    req: AnalyzeRequest,
    svc: ProfileService = Depends(Provide[Container.profile_service]),
) -> dict:
    try:
        return await svc.analyze_profile(profile_id, req.year)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@profile_router.get("/{profile_id}/daily")
@inject
async def get_fortune(
    member_id: UUID,
    profile_id: UUID,
    svc: FortuneService = Depends(Provide[Container.fortune_service]),
) -> dict:
    try:
        return await svc.get_fortune(profile_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@profile_router.get("/{profile_id}/forecast")
@inject
async def get_forecast(
    member_id: UUID,
    profile_id: UUID,
    days: int = 7,
    svc: FortuneService = Depends(Provide[Container.fortune_service]),
) -> list[dict]:
    try:
        return await svc.get_forecast(profile_id, days=min(days, 14))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class FeedbackRequest(BaseModel):
    tab_id: str
    rating: int


@profile_router.post("/{profile_id}/feedback")
@inject
async def post_feedback(
    member_id: UUID,
    profile_id: UUID,
    req: FeedbackRequest,
    repo: FeedbackPort = Depends(Provide[Container.feedback_repo]),
) -> dict:
    await repo.save(profile_id, req.tab_id, req.rating)
    return {"success": True}
