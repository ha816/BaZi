from datetime import datetime
from uuid import uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.container import Container
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender
from kkachi.fastapi import app

OWNER = uuid4()
STRANGER = uuid4()
PROFILE = Profile(
    id=uuid4(), member_id=OWNER, name="테스트", gender=Gender.MALE,
    birth_dt=datetime(1990, 1, 1, 12), city="Seoul", created_at=datetime(2026, 1, 1), is_self=True,
)


class FakeProfileService:
    async def get_profile(self, profile_id):
        return PROFILE if profile_id == PROFILE.id else None

    async def list_analyses(self, profile_id):
        return [Analysis(id=uuid4(), profile_id=profile_id, year=y, result={}, created_at=datetime(2026, 1, 1)) for y in (2026, 2025)]


class FakeFeedbackRepo:
    def __init__(self):
        self.saved: list[tuple] = []

    async def save(self, profile_id, tab_id, rating):
        self.saved.append((profile_id, tab_id, rating))

    async def list_by_profile(self, profile_id, prefix):
        return {"daily:2026-09-17": 1}

    async def summary(self):
        return []


@pytest.fixture
def client():
    """lifespan 없이(DB 연결 없이) 컨트롤러만 — 컨테이너 provider를 가짜로 덮고 wiring."""
    container = Container()
    fb = FakeFeedbackRepo()
    container.profile_service.override(providers.Object(FakeProfileService()))
    container.feedback_repo.override(providers.Object(fb))
    c = TestClient(app)
    c.fake_feedback = fb  # type: ignore[attr-defined]
    yield c
    container.unwire()


def test_owner_can_read_profile_stranger_gets_404(client):
    assert client.get(f"/members/{OWNER}/profiles/{PROFILE.id}").status_code == 200
    assert client.get(f"/members/{STRANGER}/profiles/{PROFILE.id}").status_code == 404
    assert client.get(f"/members/{OWNER}/profiles/{uuid4()}").status_code == 404


def test_list_analyses_returns_cached_years(client):
    res = client.get(f"/members/{OWNER}/profiles/{PROFILE.id}/analyses")
    assert res.status_code == 200
    assert [r["year"] for r in res.json()] == [2026, 2025]
    assert client.get(f"/members/{STRANGER}/profiles/{PROFILE.id}/analyses").status_code == 404


def test_daily_feedback_roundtrip_is_owner_only(client):
    res = client.post(f"/members/{OWNER}/profiles/{PROFILE.id}/feedback", json={"tab_id": "daily:2026-09-17", "rating": 1})
    assert res.status_code == 200 and res.json() == {"success": True}
    assert client.fake_feedback.saved == [(PROFILE.id, "daily:2026-09-17", 1)]

    res = client.get(f"/members/{OWNER}/profiles/{PROFILE.id}/feedback", params={"prefix": "daily:"})
    assert res.json() == {"daily:2026-09-17": 1}

    assert client.post(f"/members/{STRANGER}/profiles/{PROFILE.id}/feedback", json={"tab_id": "natal", "rating": 1}).status_code == 404
    assert len(client.fake_feedback.saved) == 1


def test_admin_requires_token_only_when_configured(client, monkeypatch):
    monkeypatch.delenv("KKACHI_ADMIN_TOKEN", raising=False)
    assert client.get("/admin/feedback/summary").status_code == 200

    monkeypatch.setenv("KKACHI_ADMIN_TOKEN", "secret")
    assert client.get("/admin/feedback/summary").status_code == 401
    assert client.get("/admin/feedback/summary", headers={"X-Admin-Token": "wrong"}).status_code == 401
    assert client.get("/admin/feedback/summary", headers={"X-Admin-Token": "secret"}).status_code == 200
