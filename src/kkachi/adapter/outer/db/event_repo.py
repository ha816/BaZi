from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from kkachi.adapter.outer.db.models import EventModel
from kkachi.application.port.event_port import EventPort, EventSummary


class EventRepo(EventPort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def save(self, session_id: str, member_id: UUID | None, name: str, props: dict) -> None:
        async with self._sf() as session:
            session.add(EventModel(session_id=session_id, member_id=member_id, name=name, props=props))
            await session.commit()

    async def summary(self, days: int) -> list[EventSummary]:
        since = datetime.utcnow() - timedelta(days=days)
        stmt = (
            select(EventModel.name, func.count(), func.count(func.distinct(EventModel.session_id)))
            .where(EventModel.created_at >= since)
            .group_by(EventModel.name)
            .order_by(func.count().desc())
        )
        async with self._sf() as session:
            rows = (await session.execute(stmt)).all()
        return [EventSummary(name=r[0], count=r[1], sessions=r[2]) for r in rows]
