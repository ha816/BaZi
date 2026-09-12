from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from kkachi.adapter.outer.db.models import PushSubscriptionModel
from kkachi.application.port.push_port import PushPort, PushSubscription


def _to_sub(m: PushSubscriptionModel) -> PushSubscription:
    return PushSubscription(id=m.id, member_id=m.member_id, endpoint=m.endpoint, p256dh=m.p256dh, auth=m.auth)


class PushRepo(PushPort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def save(self, member_id: UUID, endpoint: str, p256dh: str, auth: str) -> PushSubscription:
        stmt = (
            pg_insert(PushSubscriptionModel)
            .values(member_id=member_id, endpoint=endpoint, p256dh=p256dh, auth=auth)
            .on_conflict_do_update(
                index_elements=[PushSubscriptionModel.endpoint],
                set_={"member_id": member_id, "p256dh": p256dh, "auth": auth},
            )
            .returning(PushSubscriptionModel)
        )
        async with self._sf() as session:
            m = (await session.execute(stmt)).scalar_one()
            await session.commit()
            return _to_sub(m)

    async def delete(self, endpoint: str) -> None:
        async with self._sf() as session:
            await session.execute(delete(PushSubscriptionModel).where(PushSubscriptionModel.endpoint == endpoint))
            await session.commit()

    async def list_all(self) -> list[PushSubscription]:
        async with self._sf() as session:
            rows = (await session.execute(select(PushSubscriptionModel))).scalars().all()
            return [_to_sub(m) for m in rows]
