from dataclasses import asdict
from datetime import date, datetime
from uuid import UUID

from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.analysis_port import AnalysisPort
from kkachi.application.port.payment_port import PaymentPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender, User


class ProfileService:
    def __init__(
        self,
        profile_port: ProfilePort,
        analysis_port: AnalysisPort,
        saju_service: KkachiService,
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
        profile = await self.profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")
        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)

        cached = await self.analysis_port.get(profile_id, year)
        summary = (cached.result.get("postnatal") or {}).get("summary") if cached else None
        if cached and summary:
            # 연도 캐시는 유효하지만 요약의 '오늘' 줄은 날짜가 지나면 낡는다 → 그 줄만 갱신
            if summary.get("today_date") != date.today().isoformat():
                natal, postnatal = self.saju_service.analyze(user, year)
                summary.update(self.saju_service.today_summary(natal, postnatal, profile.name))
                await self.analysis_port.save(profile_id, year, cached.result)
            return cached.result

        # 캐시 없음 또는 summary 없는 옛 캐시 → 전체 재계산
        natal, postnatal = self.saju_service.analyze(user, year)
        result = asdict(await self.saju_service.interpret(natal, postnatal, user=user, name=profile.name))
        await self.analysis_port.save(profile_id, year, result)
        return result
