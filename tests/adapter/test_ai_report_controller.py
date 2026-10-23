"""AI 풀이·AI 해석 스트림 엔드포인트 — Ollama가 없으면 503, 캐시된 글은 LLM 없이 그대로, 소유자 검증."""
from datetime import datetime
from uuid import uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.application.report_builder import REPORT_PROMPT_VERSION
from kkachi.container import Container
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender
from kkachi.fastapi import app

OWNER, STRANGER = uuid4(), uuid4()
PROFILE = Profile(id=uuid4(), member_id=OWNER, name="테스트", gender=Gender.MALE,
                  birth_dt=datetime(1990, 1, 1, 12), city="Seoul", created_at=datetime(2026, 1, 1), is_self=True)
BODY = {"birth_dt": "1990-10-10T14:30:00", "gender": "male", "analysis_year": 2026, "name": "승민"}
COMPAT_BODY = {
    "person1": {"name": "철수", "gender": "male", "birth_dt": "1995-06-15T12:00:00"},
    "person2": {"name": "영희", "gender": "female", "birth_dt": "1992-11-02T08:30:00"},
    "year": 2026, "relation_type": "lover",
}


class FakeProfileService:
    async def get_profile(self, profile_id):
        return PROFILE if profile_id == PROFILE.id else None


class FakeAnalysisRepo:
    def __init__(self, ai_report=None):
        result = {"version": 10}
        if ai_report:
            result["ai_report"] = ai_report
        self.row = Analysis(id=uuid4(), profile_id=PROFILE.id, year=2026, result=result, created_at=datetime(2026, 1, 1))

    async def get(self, profile_id, year):
        return self.row if (profile_id, year) == (PROFILE.id, 2026) else None

    async def save(self, profile_id, year, result):
        self.row.result = result
        return self.row


class FakeCompatRepo:
    async def get(self, pid1, pid2, year):
        return None

    async def save(self, pid1, pid2, year, result):
        return None


class FakeLlm:
    available = True
    model = "fake"

    async def get_advice(self, params):
        return ""

    async def interpret(self, report, kind="analysis"):
        return "까치 풀이"

    async def stream_interpret(self, report, kind="analysis", prefix=""):
        for c in ("까치 ", "풀이"):
            yield c


def _client(llm=None, analysis_repo=None):
    container = Container()
    container.profile_service.override(providers.Object(FakeProfileService()))
    container.profile_repo.override(providers.Object(None))  # compatibility_service가 끌고 오는 DB 의존성 차단
    container.analysis_repo.override(providers.Object(analysis_repo or FakeAnalysisRepo()))
    container.compatibility_repo.override(providers.Object(FakeCompatRepo()))
    container.ollama_adapter.override(providers.Object(llm))
    return container, TestClient(app)


@pytest.fixture
def no_llm():
    container, c = _client(llm=None)
    yield c
    container.unwire()


@pytest.fixture
def with_llm():
    container, c = _client(llm=FakeLlm())
    yield c
    container.unwire()


def test_stream_report_is_503_without_llm(no_llm):
    res = no_llm.post("/kkachi/stream-report", json=BODY)
    assert res.status_code == 503 and "Ollama" in res.json()["detail"]


def test_narrative_is_503_without_llm(no_llm):
    assert no_llm.post("/compatibility/narrative", json=COMPAT_BODY).status_code == 503


def test_stream_report_streams_text_and_repeats_from_memory(with_llm):
    res = with_llm.post("/kkachi/stream-report", json=BODY)
    assert res.status_code == 200 and res.text == "까치 풀이"
    assert res.headers["content-type"].startswith("text/plain")
    assert with_llm.post("/kkachi/stream-report", json=BODY).text == "까치 풀이"


def test_narrative_streams_text(with_llm):
    res = with_llm.post("/compatibility/narrative", json=COMPAT_BODY)
    assert res.status_code == 200 and res.text == "까치 풀이"


def test_profile_ai_report_serves_cached_text_without_llm_and_is_owner_only():
    repo = FakeAnalysisRepo(ai_report={"text": "저장된 풀이", "version": REPORT_PROMPT_VERSION})
    container, c = _client(llm=None, analysis_repo=repo)
    try:
        assert c.post(f"/members/{STRANGER}/profiles/{PROFILE.id}/ai-report", json={"year": 2026}).status_code == 404
        res = c.post(f"/members/{OWNER}/profiles/{PROFILE.id}/ai-report", json={"year": 2026})
        assert res.status_code == 200 and res.text == "저장된 풀이"
        # 옛 버전 글은 쓰지 않는다 → LLM이 없으니 503
        repo.row.result["ai_report"]["version"] = REPORT_PROMPT_VERSION - 1
        assert c.post(f"/members/{OWNER}/profiles/{PROFILE.id}/ai-report", json={"year": 2026}).status_code == 503
    finally:
        container.unwire()


def test_profile_ai_report_generates_and_saves_into_analyses_cache():
    repo = FakeAnalysisRepo()
    container, c = _client(llm=FakeLlm(), analysis_repo=repo)
    try:
        res = c.post(f"/members/{OWNER}/profiles/{PROFILE.id}/ai-report", json={"year": 2026})
        assert res.status_code == 200 and res.text == "까치 풀이"
        assert repo.row.result["ai_report"]["text"] == "까치 풀이"
    finally:
        container.unwire()
