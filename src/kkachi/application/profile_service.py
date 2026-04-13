from dataclasses import asdict
from datetime import datetime
from uuid import UUID

from kkachi.application.port.analysis_port import AnalysisPort
from kkachi.application.port.payment_port import PaymentPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.saju_service import SajuService
from kkachi.domain.payment import PaymentRequiredError
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender, User


class ProfileService:
    def __init__(
        self,
        profile_port: ProfilePort,
        analysis_port: AnalysisPort,
        saju_service: SajuService,
        payment_port: PaymentPort | None = None,
    ):
        self.profile_port = profile_port
        self.analysis_port = analysis_port
        self.saju_service = saju_service
        self._payment_port = payment_port

    async def create_profile(
        self, member_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str, is_self: bool = False
    ) -> Profile:
        existing = await self.profile_port.list_by_member(member_id)
        if len(existing) >= 10:
            raise ValueError("프로필은 최대 10개까지 저장할 수 있습니다.")
        return await self.profile_port.create(member_id, name, gender, birth_dt, city, is_self=is_self)

    async def get_profile(self, profile_id: UUID) -> Profile | None:
        return await self.profile_port.get(profile_id)

    async def list_profiles(self, member_id: UUID) -> list[Profile]:
        return await self.profile_port.list_by_member(member_id)

    async def delete_profile(self, profile_id: UUID) -> None:
        await self.profile_port.delete(profile_id)

    async def update_profile(
        self, profile_id: UUID, name: str, gender: Gender, birth_dt: datetime, city: str
    ) -> Profile:
        return await self.profile_port.update(profile_id, name, gender, birth_dt, city)

    async def list_analyses(self, profile_id: UUID) -> list[Analysis]:
        return await self.analysis_port.list_by_profile(profile_id)

    async def analyze_profile(self, profile_id: UUID, year: int, member_id: UUID | None = None) -> dict:
        cached = await self.analysis_port.get(profile_id, year)
        if cached:
            return cached.result

        if self._payment_port and member_id:
            credit = await self._payment_port.pop_credit(member_id, "deep_analysis")
            if credit is None:
                raise PaymentRequiredError("심층분석 크레딧이 없습니다.")

        profile = await self.profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")

        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)
        natal, postnatal = self.saju_service.analyze(user, year)
        result = asdict(await self.saju_service.interpret(natal, postnatal, name=profile.name))

        await self.analysis_port.save(profile_id, year, result)
        return result
