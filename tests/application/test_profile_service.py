import asyncio
from datetime import date, datetime
from uuid import UUID, uuid4

from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.profile_service import ProfileService
from kkachi.application.report_builder import REPORT_PROMPT_VERSION
from kkachi.domain.interpretation import INTERPRETATION_VERSION
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender

MEMBER = uuid4()


class _MemoryProfilePort(ProfilePort):
    """기본 프로필 자동 규칙을 검증하기 위한 in-memory 포트."""

    def __init__(self):
        self.rows: dict[UUID, Profile] = {}

    async def create(self, member_id, name, gender, birth_dt, city, is_self=False, birth_hour_unknown=False):
        p = Profile(id=uuid4(), member_id=member_id, name=name, gender=gender, birth_dt=birth_dt, city=city,
                    created_at=datetime(2026, 1, 1), is_self=is_self, birth_hour_unknown=birth_hour_unknown)
        self.rows[p.id] = p
        return p

    async def get(self, profile_id):
        return self.rows.get(profile_id)

    async def list_by_member(self, member_id):
        return [p for p in self.rows.values() if p.member_id == member_id]

    async def delete(self, profile_id):
        self.rows.pop(profile_id, None)

    async def update(self, profile_id, name, gender, birth_dt, city, birth_hour_unknown=False):
        raise NotImplementedError

    async def set_self(self, member_id, profile_id):
        for p in self.rows.values():
            if p.member_id == member_id:
                p.is_self = p.id == profile_id
        return self.rows[profile_id]


def _svc(port):
    return ProfileService(profile_port=port, analysis_port=None, saju_service=None)  # type: ignore[arg-type]


def _create(svc, name, is_self=False):
    return asyncio.run(svc.create_profile(MEMBER, name, Gender.MALE, datetime(1990, 1, 1, 12), "Seoul", is_self=is_self))


def test_first_profile_becomes_default_even_without_flag():
    port = _MemoryProfilePort()
    svc = _svc(port)
    first = _create(svc, "나")
    second = _create(svc, "동생")
    assert first.is_self is True and second.is_self is False


def test_deleting_down_to_one_profile_makes_it_default():
    port = _MemoryProfilePort()
    svc = _svc(port)
    me = _create(svc, "나")
    other = _create(svc, "동생")
    asyncio.run(port.set_self(MEMBER, other.id))          # 동생을 기본으로 바꾼 뒤
    asyncio.run(svc.delete_profile(other.id))             # 기본이던 동생을 지우면
    remaining = asyncio.run(port.list_by_member(MEMBER))
    assert [p.id for p in remaining] == [me.id] and remaining[0].is_self is True


class _OneAnalysisPort:
    def __init__(self, result):
        self.result = result

    async def get(self, profile_id, year):
        return Analysis(id=uuid4(), profile_id=profile_id, year=year, result=self.result, created_at=datetime(2026, 1, 1))


def _cached_analysis(ai_report):
    today = date.today().isoformat()
    return {"version": INTERPRETATION_VERSION, "natal": {}, "postnatal": {"summary": {"today_date": today}}, "ai_report": ai_report}


def test_analyze_cache_hit_drops_ai_report_from_old_prompt_version():
    """옛 프롬프트로 쓴 AI 풀이는 응답에서 빼고, 지금 버전 글은 그대로 싣는다."""
    port = _MemoryProfilePort()
    profile = _create(_svc(port), "나")

    old = {"text": "옛 글", "version": REPORT_PROMPT_VERSION - 1}
    svc = ProfileService(profile_port=port, analysis_port=_OneAnalysisPort(_cached_analysis(old)), saju_service=None)  # type: ignore[arg-type]
    assert "ai_report" not in asyncio.run(svc.analyze_profile(profile.id, 2026))

    fresh = {"text": "새 글", "version": REPORT_PROMPT_VERSION}
    svc = ProfileService(profile_port=port, analysis_port=_OneAnalysisPort(_cached_analysis(fresh)), saju_service=None)  # type: ignore[arg-type]
    assert asyncio.run(svc.analyze_profile(profile.id, 2026))["ai_report"]["text"] == "새 글"
