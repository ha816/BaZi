from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from kkachi.adapter.outer.db.models import CompatInviteModel

_TTL_DAYS = 30


class InviteRepo:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def create(self, payload: dict) -> UUID:
        async with self._sf() as session:
            m = CompatInviteModel(payload=payload, expires_at=datetime.utcnow() + timedelta(days=_TTL_DAYS))
            session.add(m)
            await session.commit()
            await session.refresh(m)
            return m.id

    async def get(self, invite_id: UUID) -> dict | None:
        async with self._sf() as session:
            m = (await session.execute(
                select(CompatInviteModel).where(CompatInviteModel.id == invite_id)
            )).scalar_one_or_none()
        if m is None or m.expires_at < datetime.utcnow():
            return None
        return m.payload
