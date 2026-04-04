from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from bazi.application.compatibility_service import CompatibilityService
from bazi.container import Container

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
