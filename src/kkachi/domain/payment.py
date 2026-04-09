from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Payment:
    id: UUID
    member_id: UUID
    feature_type: str   # 'deep_analysis' | 'daily_fortune' | 'compatibility'
    amount: int
    toss_order_id: str
    toss_payment_key: str | None
    status: str         # 'pending' | 'paid' | 'failed' | 'cancelled'
    used_at: datetime | None
    created_at: datetime


class PaymentRequiredError(Exception):
    """크레딧 없을 때 발생."""
