import asyncio
from datetime import datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.adapter.outer.postnatal_adapter import PostnatalAdapter
from kkachi.application.ai_report_service import AiReportService, LlmUnavailableError
from kkachi.application.compatibility_prompt import NARRATIVE_PROMPT_VERSION
from kkachi.application.compatibility_service import CompatibilityService
from kkachi.application.kkachi_service import KkachiService, NatalService, PostnatalService
from kkachi.application.llm_stream_hub import LlmStreamHub
from kkachi.application.report_builder import REPORT_PROMPT_VERSION
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender, User

_na, _pa = NatalAdapter(), PostnatalAdapter()
KK = KkachiService(natal_svc=NatalService(natal_port=_na), postnatal_svc=PostnatalService(natal_port=_na, postnatal_port=_pa))
CS = CompatibilityService(profile_port=None, compatibility_port=None, saju_service=KK, llm_port=None)
YEAR = 2026


class FakeLlm:
    available = True
    model = "fake-llm"

    def __init__(self):
        self.calls: list[tuple[str, str]] = []  # (kind, prompt)

    async def get_advice(self, params):
        return ""

    async def interpret(self, report, kind="analysis"):
        return "까치 풀이"

    async def stream_interpret(self, report, kind="analysis", prefix=""):
        self.calls.append((kind, report))
        for c in ("까치 ", "풀이 ", f"#{len(self.calls)}"):
            await asyncio.sleep(0)
            yield c


class FakeAnalysisPort:
    def __init__(self):
        self.rows: dict[tuple, Analysis] = {}

    async def save(self, profile_id, year, result):
        a = Analysis(id=uuid4(), profile_id=profile_id, year=year, result=result, created_at=datetime(2026, 1, 1))
        self.rows[(profile_id, year)] = a
        return a

    async def get(self, profile_id, year):
        return self.rows.get((profile_id, year))

    async def list_by_profile(self, profile_id):
        return []

    async def delete_by_profile(self, profile_id):
        pass


class FakeCompatPort:
    def __init__(self):
        self.rows: dict[tuple, SimpleNamespace] = {}
        self.updates: list[tuple] = []

    async def save(self, pid1, pid2, year, result):
        self.rows[(pid1, pid2, year)] = SimpleNamespace(result=result)

    async def get(self, pid1, pid2, year):
        return self.rows.get((pid1, pid2, year))

    async def update_result(self, pid1, pid2, year, result):
        self.updates.append((pid1, pid2, year))
        self.rows[(pid1, pid2, year)] = SimpleNamespace(result=result)


def _profile(name="영희"):
    return Profile(id=uuid4(), member_id=uuid4(), name=name, gender=Gender.FEMALE,
                   birth_dt=datetime(1992, 11, 2, 8, 30), city="Seoul", created_at=datetime(2026, 1, 1))


def _user(name="철수", hour_unknown=False):
    return User(name=name, gender=Gender.MALE, birth_dt=datetime(1995, 6, 15, 12), city="Seoul", hour_unknown=hour_unknown)


def _svc(llm=None, analysis_port=None, compat_port=None):
    return AiReportService(saju_service=KK, compatibility_service=CS, analysis_port=analysis_port,
                           compatibility_port=compat_port, llm_port=llm, hub=LlmStreamHub())


async def _text(agen):
    return "".join([c async for c in agen])


async def _settle():
    for _ in range(50):
        await asyncio.sleep(0.01)


def test_profile_report_streams_then_is_served_from_analyses_cache():
    async def main():
        llm, ap = FakeLlm(), FakeAnalysisPort()
        p = _profile()
        await ap.save(p.id, YEAR, {"version": 10, "natal": {}})  # analyze가 먼저 만든 연도 캐시
        svc = _svc(llm, ap)
        first = await _text(svc.stream_profile_analysis(p, YEAR))
        await _settle()
        entry = ap.rows[(p.id, YEAR)].result["ai_report"]
        assert first == "까치 풀이 #1" and entry["text"] == first
        assert entry["version"] == REPORT_PROMPT_VERSION and entry["model"] == "fake-llm" and entry["created_at"]
        second = await _text(svc.stream_profile_analysis(p, YEAR))
        assert second == first and len(llm.calls) == 1
        assert llm.calls[0][0] == "analysis" and "영희" in llm.calls[0][1]

    asyncio.run(main())


def test_profile_report_regenerates_when_prompt_version_is_old():
    async def main():
        llm, ap = FakeLlm(), FakeAnalysisPort()
        p = _profile()
        await ap.save(p.id, YEAR, {"version": 10, "ai_report": {"text": "옛 글", "version": REPORT_PROMPT_VERSION - 1}})
        text = await _text(_svc(llm, ap).stream_profile_analysis(p, YEAR))
        await _settle()
        assert text == "까치 풀이 #1" and ap.rows[(p.id, YEAR)].result["ai_report"]["text"] == text

    asyncio.run(main())


def test_direct_report_is_remembered_in_memory_per_input_and_name():
    async def main():
        llm = FakeLlm()
        svc = _svc(llm)
        a = await _text(svc.stream_analysis(_user("철수"), "철수", YEAR))
        await _settle()
        b = await _text(svc.stream_analysis(_user("철수"), "철수", YEAR))
        c = await _text(svc.stream_analysis(_user("철수"), "영수", YEAR))
        assert a == b == "까치 풀이 #1" and c == "까치 풀이 #2" and len(llm.calls) == 2

    asyncio.run(main())


def test_missing_llm_raises_before_any_text():
    async def main():
        with pytest.raises(LlmUnavailableError):
            await _text(_svc(None).stream_analysis(_user(), "철수", YEAR))

    asyncio.run(main())


def test_compat_pair_report_is_saved_per_relation_type():
    async def main():
        llm, cp = FakeLlm(), FakeCompatPort()
        p1, p2 = uuid4(), uuid4()
        lo, hi = (p1, p2) if str(p1) < str(p2) else (p2, p1)
        await cp.save(lo, hi, YEAR, {"total_score": 70})
        svc = _svc(llm, compat_port=cp)
        u1, u2 = _user("철수"), User(name="영희", gender=Gender.FEMALE, birth_dt=datetime(1992, 11, 2, 8, 30), city="Seoul")
        lover = await _text(svc.stream_compat(u1, u2, YEAR, "lover", (p1, p2)))
        await _settle()
        assert cp.updates == [(lo, hi, YEAR)]
        saved = cp.rows[(lo, hi, YEAR)].result["narratives"]["lover"]
        assert saved["text"] == lover and saved["version"] == NARRATIVE_PROMPT_VERSION
        assert await _text(svc.stream_compat(u1, u2, YEAR, "lover", (p2, p1))) == lover  # 순서 바뀌어도 같은 쌍
        friend = await _text(svc.stream_compat(u1, u2, YEAR, "friend", (p1, p2)))
        await _settle()
        assert friend != lover and len(llm.calls) == 2 and llm.calls[1][0] == "compat"
        assert set(cp.rows[(lo, hi, YEAR)].result["narratives"]) == {"lover", "friend"}

    asyncio.run(main())


def test_compat_without_pair_uses_memory_only():
    async def main():
        llm, cp = FakeLlm(), FakeCompatPort()
        svc = _svc(llm, compat_port=cp)
        u1, u2 = _user("철수"), User(name="영희", gender=Gender.FEMALE, birth_dt=datetime(1992, 11, 2, 8, 30), city="Seoul")
        a = await _text(svc.stream_compat(u1, u2, YEAR, "lover"))
        await _settle()
        b = await _text(svc.stream_compat(u1, u2, YEAR, "lover"))
        assert a == b and len(llm.calls) == 1 and cp.updates == []

    asyncio.run(main())
