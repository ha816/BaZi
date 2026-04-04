from datetime import datetime
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from bazi.application.profile_service import ProfileService
from bazi.container import Container
from bazi.domain.user import Gender

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
