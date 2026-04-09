from abc import ABC, abstractmethod
from uuid import UUID

from kkachi.domain.payment import Payment


class PaymentPort(ABC):
    @abstractmethod
    async def create(self, member_id: UUID, feature_type: str, amount: int, order_id: str) -> Payment: ...

    @abstractmethod
    async def get_by_order_id(self, order_id: str) -> Payment | None: ...

    @abstractmethod
    async def mark_paid(self, order_id: str, payment_key: str) -> Payment: ...

    @abstractmethod
    async def pop_credit(self, member_id: UUID, feature_type: str) -> Payment | None:
        """FIFO 방식으로 미사용 크레딧 1개 소진. 없으면 None."""
