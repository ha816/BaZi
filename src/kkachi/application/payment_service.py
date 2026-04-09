import base64
from time import time
from uuid import UUID

import httpx

from kkachi.application.port.payment_port import PaymentPort
from kkachi.domain.payment import Payment

FEATURE_AMOUNTS = {
    "deep_analysis": 1900,
    "daily_fortune": 990,
    "compatibility": 1500,
}

FEATURE_NAMES = {
    "deep_analysis": "사주까치 심층분석",
    "daily_fortune": "사주까치 오늘의 운세",
    "compatibility": "사주까치 궁합 분석",
}


class PaymentService:
    def __init__(self, payment_port: PaymentPort, toss_secret_key: str):
        self._port = payment_port
        self._secret_key = toss_secret_key

    async def prepare(self, member_id: UUID, feature_type: str) -> dict:
        amount = FEATURE_AMOUNTS[feature_type]
        order_id = f"{feature_type}_{str(member_id)[:8]}_{int(time() * 1000)}"
        await self._port.create(member_id, feature_type, amount, order_id)
        return {
            "order_id": order_id,
            "amount": amount,
            "feature_type": feature_type,
            "order_name": FEATURE_NAMES[feature_type],
        }

    async def confirm(self, payment_key: str, order_id: str, amount: int) -> dict:
        payment = await self._port.get_by_order_id(order_id)
        if not payment or payment.amount != amount:
            raise ValueError("잘못된 결제 정보입니다.")
        await _confirm_with_toss(payment_key, order_id, amount, self._secret_key)
        await self._port.mark_paid(order_id, payment_key)
        return {"success": True}


def _toss_auth_header(secret_key: str) -> str:
    return "Basic " + base64.b64encode(f"{secret_key}:".encode()).decode()


async def _confirm_with_toss(payment_key: str, order_id: str, amount: int, secret_key: str) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.tosspayments.com/v1/payments/confirm",
            json={"paymentKey": payment_key, "orderId": order_id, "amount": amount},
            headers={
                "Authorization": _toss_auth_header(secret_key),
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
    if resp.status_code != 200:
        raise ValueError(f"Toss confirm failed [{resp.status_code}]: {resp.text}")
