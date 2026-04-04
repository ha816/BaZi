from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from bazi.adapter.outer.db.models import MemberModel
from bazi.application.port.member_port import MemberPort
from bazi.domain.member import Member


class MemberRepo(MemberPort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    def _to_domain(self, m: MemberModel) -> Member:
        return Member(id=m.id, name=m.name, email=m.email, created_at=m.created_at)

    async def create(self, name: str, email: str) -> Member:
        async with self._sf() as session:
            m = MemberModel(name=name, email=email)
            session.add(m)
            await session.commit()
            await session.refresh(m)
            return self._to_domain(m)

    async def get(self, member_id: UUID) -> Member | None:
        async with self._sf() as session:
            m = await session.get(MemberModel, member_id)
            return self._to_domain(m) if m else None

    async def get_by_email(self, email: str) -> Member | None:
        async with self._sf() as session:
            result = await session.execute(select(MemberModel).where(MemberModel.email == email))
            m = result.scalar_one_or_none()
            return self._to_domain(m) if m else None
