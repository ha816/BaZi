from datetime import date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from bazi.adapter.outer.db.models import AnalysisModel, CompatibilityModel, FortuneModel, ProfileModel
from bazi.application.port.compatibility_port import CompatibilityPort
from bazi.application.port.fortune_port import FortunePort
from bazi.application.port.analysis_port import AnalysisPort
from bazi.application.port.profile_port import ProfilePort
from bazi.domain.compatibility import Compatibility
from bazi.domain.fortune import FortuneCache
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


def _to_fortune(m: FortuneModel) -> FortuneCache:
    return FortuneCache(
        id=m.id,
        profile_id=m.profile_id,
        fortune_date=m.fortune_date,
        result=m.result,
        created_at=m.created_at,
    )


class FortuneRepo(FortunePort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def save(self, profile_id: UUID, fortune_date: date, result: dict) -> FortuneCache:
        async with self._sf() as session:
            existing = await session.execute(
                select(FortuneModel).where(
                    FortuneModel.profile_id == profile_id,
                    FortuneModel.fortune_date == fortune_date,
                )
            )
            m = existing.scalar_one_or_none()
            if m:
                m.result = result
            else:
                m = FortuneModel(profile_id=profile_id, fortune_date=fortune_date, result=result)
                session.add(m)
            await session.commit()
            await session.refresh(m)
            return _to_fortune(m)

    async def get(self, profile_id: UUID, fortune_date: date) -> FortuneCache | None:
        async with self._sf() as session:
            result = await session.execute(
                select(FortuneModel).where(
                    FortuneModel.profile_id == profile_id,
                    FortuneModel.fortune_date == fortune_date,
                )
            )
            m = result.scalar_one_or_none()
            return _to_fortune(m) if m else None


def _to_compatibility(m: CompatibilityModel) -> Compatibility:
    return Compatibility(
        id=m.id,
        profile_id_1=m.profile_id_1,
        profile_id_2=m.profile_id_2,
        year=m.year,
        result=m.result,
        created_at=m.created_at,
    )


class CompatibilityRepo(CompatibilityPort):
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]):
        self._sf = session_factory

    async def save(self, pid1: UUID, pid2: UUID, year: int, result: dict) -> Compatibility:
        async with self._sf() as session:
            c = CompatibilityModel(profile_id_1=pid1, profile_id_2=pid2, year=year, result=result)
            session.add(c)
            await session.commit()
            await session.refresh(c)
            return _to_compatibility(c)

    async def get(self, pid1: UUID, pid2: UUID, year: int) -> Compatibility | None:
        async with self._sf() as session:
            result = await session.execute(
                select(CompatibilityModel).where(
                    CompatibilityModel.profile_id_1 == pid1,
                    CompatibilityModel.profile_id_2 == pid2,
                    CompatibilityModel.year == year,
                )
            )
            c = result.scalar_one_or_none()
            return _to_compatibility(c) if c else None
