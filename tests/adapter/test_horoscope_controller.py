from datetime import date, datetime, timedelta
from uuid import uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.container import Container
from kkachi.domain.profile import Profile
from kkachi.domain.user import Gender
from kkachi.fastapi import app

MEMBER_ID = uuid4()
ME = Profile(id=uuid4(), member_id=MEMBER_ID, name="나", gender=Gender.FEMALE, birth_dt=datetime(1990, 5, 3, 9),
             city="Seoul", created_at=datetime(2026, 1, 1), is_self=True)
FRIEND = Profile(id=uuid4(), member_id=MEMBER_ID, name="친구", gender=Gender.MALE, birth_dt=datetime(1991, 8, 20, 15),
                 city="Seoul", created_at=datetime(2026, 1, 1))


class FakeProfiles:
    async def list_by_member(self, member_id):
        return [FRIEND, ME] if member_id == MEMBER_ID else []


@pytest.fixture
def client():
    """lifespan 없이 — 황경은 실제 ephem 어댑터, 프로필은 가짜, LLM은 끊어 둔다."""
    container = Container()
    container.ollama_adapter.override(providers.Object(None))
    container.profile_repo.override(providers.Object(FakeProfiles()))
    yield TestClient(app)
    container.unwire()


def test_general_week_without_params(client):
    body = client.get("/horoscope/week").json()
    assert body["me"] is None and body["date"] == date.today().isoformat()
    assert len(body["days"]) == 7 and [d["date"] for d in body["days"]] == [(date.today() + timedelta(days=i)).isoformat() for i in range(7)]
    assert len(body["today"]["signs"]) == 12 and body["today"]["signs"][0]["headline"].endswith("요.")
    day = body["days"][3]
    assert set(day) == {"date", "sun", "moon", "moon_phase", "signs"} and set(day["signs"][0]) == {"key", "relation", "score", "level"}
    assert body["days"][0]["moon"] == body["today"]["moon"]  # 첫날 = 오늘


def test_direct_input_adds_personal_days_with_name(client):
    body = client.get("/horoscope/week", params={"birth_dt": "1990-05-03T09:00:00", "gender": "female", "name": "승민", "days": 3}).json()
    me = body["me"]
    assert me["chart"]["sun"] == "taurus" and me["chart"]["asc_signs"] == ["cancer", "leo"] and me["chart"]["uncertain"] == ["asc"]
    assert len(me["days"]) == 3 and len(body["days"]) == 3
    assert all(d["headline"].startswith("승민님, ") and d["lucky_item"] and d["level"] for d in me["days"])
    unknown = client.get("/horoscope/week", params={"birth_dt": "1990-05-03T12:00:00", "gender": "female", "hour_unknown": "true"}).json()
    assert unknown["me"]["chart"]["asc"] is None and unknown["me"]["chart"]["asc_signs"] == []


def test_member_uses_default_profile_and_unknown_member_is_general(client):
    body = client.get("/horoscope/week", params={"member_id": str(MEMBER_ID)}).json()
    assert body["me"]["chart"]["sun"] == "taurus" and body["me"]["days"][0]["headline"].startswith("나님, ")  # 기본 프로필(나), 친구 아님
    assert client.get("/horoscope/week", params={"member_id": str(uuid4())}).json()["me"] is None
    assert client.get("/horoscope/week", params={"days": 20}).status_code == 422
    assert client.get("/horoscope/week", params={"gender": "male"}).json()["me"] is None  # 성별만으로는 개인판 없음
