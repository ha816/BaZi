from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from kkachi.application.payment_service import PaymentService
from kkachi.container import Container

payment_router = APIRouter(prefix="/payments", tags=["payments"])


class PrepareRequest(BaseModel):
    member_id: UUID
    feature_type: str


class ConfirmRequest(BaseModel):
    payment_key: str
    order_id: str
    amount: int


@payment_router.post("/prepare")
@inject
async def prepare_payment(
    req: PrepareRequest,
    svc: PaymentService = Depends(Provide[Container.payment_service]),
) -> dict:
    if req.feature_type not in ("deep_analysis", "daily_fortune", "compatibility"):
        raise HTTPException(status_code=400, detail="잘못된 feature_type")
    return await svc.prepare(req.member_id, req.feature_type)


@payment_router.post("/confirm")
@inject
async def confirm_payment(
    req: ConfirmRequest,
    svc: PaymentService = Depends(Provide[Container.payment_service]),
) -> dict:
    try:
        return await svc.confirm(req.payment_key, req.order_id, req.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
