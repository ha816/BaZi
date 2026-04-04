from dataclasses import asdict
from datetime import datetime
from uuid import UUID

from bazi.application.port.member_port import AnalysisPort, ProfilePort
from bazi.application.saju_service import SajuService
from bazi.domain.profile import Analysis, Profile
from bazi.domain.user import Gender, User


class ProfileService:
    def __init__(
        self,
        profile_port: ProfilePort,
        analysis_port: AnalysisPort,
        saju_service: SajuService,
    ):
        self.profile_port = profile_port
        self.analysis_port = analysis_port
        self.saju_service = saju_service

    async def create_profile(
        self, member_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str
    ) -> Profile:
        return await self.profile_port.create(member_id, name, gender, birth_dt, city)

    async def get_profile(self, profile_id: UUID) -> Profile | None:
        return await self.profile_port.get(profile_id)

    async def list_profiles(self, member_id: UUID) -> list[Profile]:
        return await self.profile_port.list_by_member(member_id)

    async def delete_profile(self, profile_id: UUID) -> None:
        await self.profile_port.delete(profile_id)

    async def list_analyses(self, profile_id: UUID) -> list[Analysis]:
        return await self.analysis_port.list_by_profile(profile_id)

    async def analyze_profile(self, profile_id: UUID, year: int) -> dict:
        cached = await self.analysis_port.get(profile_id, year)
        if cached:
            return cached.result

        profile = await self.profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")

        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)
        natal, postnatal = self.saju_service.analyze(user, year)
        result = asdict(self.saju_service.interpret(natal, postnatal))

        await self.analysis_port.save(profile_id, year, result)
        return result
