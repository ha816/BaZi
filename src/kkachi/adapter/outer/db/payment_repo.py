from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from kkachi.adapter.outer.db.models import PaymentModel
from kkachi.application.port.payment_port import PaymentPort
from kkachi.domain.payment import Payment


def _to_domain(m: PaymentModel) -> Payment:
    return Payment(
        id=m.id,
        member_id=m.member_id,
        feature_type=m.feature_type,
        amount=m.amount,
        toss_order_id=m.toss_order_id,
        toss_payment_key=m.toss_payment_key,
        status=m.status,
        used_at=m.used_at,
        created_at=m.created_at,
    )


class PaymentRepo(PaymentPort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def create(self, member_id: UUID, feature_type: str, amount: int, order_id: str) -> Payment:
        async with self._sf() as session:
            p = PaymentModel(
                id=uuid4(),
                member_id=member_id,
                feature_type=feature_type,
                amount=amount,
                toss_order_id=order_id,
            )
            session.add(p)
            await session.commit()
            await session.refresh(p)
            return _to_domain(p)

    async def get_by_order_id(self, order_id: str) -> Payment | None:
        async with self._sf() as session:
            result = await session.execute(
                select(PaymentModel).where(PaymentModel.toss_order_id == order_id)
            )
            m = result.scalar_one_or_none()
            return _to_domain(m) if m else None

    async def mark_paid(self, order_id: str, payment_key: str) -> Payment:
        async with self._sf() as session:
            result = await session.execute(
                select(PaymentModel).where(PaymentModel.toss_order_id == order_id)
            )
            m = result.scalar_one()
            m.toss_payment_key = payment_key
            m.status = "paid"
            await session.commit()
            await session.refresh(m)
            return _to_domain(m)

    async def pop_credit(self, member_id: UUID, feature_type: str) -> Payment | None:
        async with self._sf() as session:
            stmt = (
                select(PaymentModel)
                .where(
                    PaymentModel.member_id == member_id,
                    PaymentModel.feature_type == feature_type,
                    PaymentModel.status == "paid",
                    PaymentModel.used_at.is_(None),
                )
                .order_by(PaymentModel.created_at.asc())
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            result = await session.execute(stmt)
            row = result.scalar_one_or_none()
            if row is None:
                return None
            row.used_at = datetime.utcnow()
            await session.commit()
            return _to_domain(row)
