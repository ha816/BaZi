from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from bazi.adapter.outer.db.models import AnalysisModel, ProfileModel
from bazi.application.port.member_port import AnalysisPort, ProfilePort
from bazi.domain.profile import Analysis, Profile
from bazi.domain.user import Gender


def _to_profile(m: ProfileModel) -> Profile:
    return Profile(
        id=m.id,
        member_id=m.member_id,
        name=m.name,
        gender=Gender(m.gender),
        birth_dt=m.birth_dt,
        city=m.city,
        created_at=m.created_at,
    )


def _to_analysis(m: AnalysisModel) -> Analysis:
    return Analysis(id=m.id, profile_id=m.profile_id, year=m.year, result=m.result, created_at=m.created_at)


class ProfileRepo(ProfilePort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def create(self, member_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str) -> Profile:
        async with self._sf() as session:
            p = ProfileModel(member_id=member_id, name=name, gender=gender.value, birth_dt=birth_dt, city=city)
            session.add(p)
            await session.commit()
            await session.refresh(p)
            return _to_profile(p)

    async def get(self, profile_id: UUID) -> Profile | None:
        async with self._sf() as session:
            p = await session.get(ProfileModel, profile_id)
            return _to_profile(p) if p else None

    async def list_by_member(self, member_id: UUID) -> list[Profile]:
        async with self._sf() as session:
            result = await session.execute(
                select(ProfileModel).where(ProfileModel.member_id == member_id).order_by(ProfileModel.created_at.desc())
            )
            return [_to_profile(p) for p in result.scalars()]

    async def delete(self, profile_id: UUID) -> None:
        async with self._sf() as session:
            p = await session.get(ProfileModel, profile_id)
            if p:
                await session.delete(p)
                await session.commit()


class AnalysisRepo(AnalysisPort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def save(self, profile_id: UUID, year: int, result: dict) -> Analysis:
        async with self._sf() as session:
            a = AnalysisModel(profile_id=profile_id, year=year, result=result)
            session.add(a)
            await session.commit()
            await session.refresh(a)
            return _to_analysis(a)

    async def get(self, profile_id: UUID, year: int) -> Analysis | None:
        async with self._sf() as session:
            result = await session.execute(
                select(AnalysisModel).where(
                    AnalysisModel.profile_id == profile_id,
                    AnalysisModel.year == year,
                )
            )
            a = result.scalar_one_or_none()
            return _to_analysis(a) if a else None

    async def list_by_profile(self, profile_id: UUID) -> list[Analysis]:
        async with self._sf() as session:
            result = await session.execute(
                select(AnalysisModel).where(AnalysisModel.profile_id == profile_id).order_by(AnalysisModel.year.desc())
            )
            return [_to_analysis(a) for a in result.scalars()]
