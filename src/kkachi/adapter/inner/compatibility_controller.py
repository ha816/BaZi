from datetime import datetime
from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from kkachi.application.compatibility_service import CompatibilityService
from kkachi.container import Container
from kkachi.domain.user import Gender, User

compatibility_router = APIRouter(prefix="/compatibility", tags=["compatibility"])


class CompatibilityRequest(BaseModel):
    profile_id_1: UUID
    profile_id_2: UUID
    year: int


@compatibility_router.post("")
@inject
async def analyze_compatibility(
    req: CompatibilityRequest,
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> dict:
    try:
        return await svc.analyze_compatibility(req.profile_id_1, req.profile_id_2, req.year)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class PersonInput(BaseModel):
    name: str
    gender: str  # "male" | "female"
    birth_dt: datetime
    city: str = "Seoul"


class DirectCompatibilityRequest(BaseModel):
    person1: PersonInput
    person2: PersonInput
    year: int


@compatibility_router.post("/direct")
@inject
async def analyze_compatibility_direct(
    req: DirectCompatibilityRequest,
    svc: CompatibilityService = Depends(Provide[Container.compatibility_service]),
) -> dict:
    gender1 = Gender.MALE if req.person1.gender == "male" else Gender.FEMALE
    gender2 = Gender.MALE if req.person2.gender == "male" else Gender.FEMALE
    user1 = User(name=req.person1.name, gender=gender1, birth_dt=req.person1.birth_dt, city=req.person1.city)
    user2 = User(name=req.person2.name, gender=gender2, birth_dt=req.person2.birth_dt, city=req.person2.city)
    return svc.compute_direct(user1, user2, req.year)
