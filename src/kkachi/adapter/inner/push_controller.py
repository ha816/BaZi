from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from kkachi.application.push_service import PushService
from kkachi.container import Container

push_router = APIRouter(prefix="/push", tags=["push"])


class SubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=10, max_length=255)
    auth: str = Field(min_length=10, max_length=255)


class SubscriptionInput(BaseModel):
    endpoint: str = Field(min_length=20, max_length=1024, pattern=r"^https://")
    keys: SubscriptionKeys


class SubscribeRequest(BaseModel):
    member_id: UUID
    subscription: SubscriptionInput


class UnsubscribeRequest(BaseModel):
    endpoint: str = Field(min_length=20, max_length=1024)


@push_router.get("/vapid-public-key")
@inject
async def vapid_public_key(svc: PushService = Depends(Provide[Container.push_service])) -> dict:
    if not svc.configured:
        raise HTTPException(status_code=503, detail="푸시 알림이 설정되지 않았습니다 (KKACHI_VAPID_* 미설정)")
    return {"public_key": svc.public_key}


@push_router.post("/subscriptions", status_code=201)
@inject
async def subscribe(req: SubscribeRequest, svc: PushService = Depends(Provide[Container.push_service])) -> dict:
    if not svc.configured:
        raise HTTPException(status_code=503, detail="푸시 알림이 설정되지 않았습니다")
    await svc.subscribe(req.member_id, req.subscription.endpoint, req.subscription.keys.p256dh, req.subscription.keys.auth)
    return {"success": True}


@push_router.delete("/subscriptions", status_code=204)
@inject
async def unsubscribe(req: UnsubscribeRequest, svc: PushService = Depends(Provide[Container.push_service])) -> None:
    await svc.unsubscribe(req.endpoint)
