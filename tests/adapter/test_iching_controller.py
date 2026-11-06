from datetime import datetime
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
    """lifespan 없이 — 사주 계산은 실제 어댑터, 프로필은 가짜, LLM은 끊어 둔다."""
    container = Container()
    container.ollama_adapter.override(providers.Object(None))
    container.profile_repo.override(providers.Object(FakeProfiles()))
    yield TestClient(app)
    container.unwire()


def test_question_without_saju_gives_date_hexagram_and_no_cross(client):
    body = client.post("/iching/ask", json={"question": "이직을 해도 될까요?"}).json()
    assert body["identity"] == "date" and body["cross"] is None and body["category"] == "일"
    assert len(body["values"]) == 6 and len(body["hexagram"]["lines"]) == 6 and body["hexagram"]["line"].endswith("요.")
    assert body == client.post("/iching/ask", json={"question": "이직을 해도 될까요?"}).json()  # 같은 날 같은 질문 = 같은 괘


def test_direct_input_adds_cross_two_sentences(client):
    body = client.post("/iching/ask", json={"question": "이직을 해도 될까요?", "birth_dt": "1990-05-03T09:00:00", "gender": "female"}).json()
    assert body["identity"] == "person" and body["cross"].count(". ") == 1 and body["cross"].endswith("요.")
    same = client.post("/iching/ask", json={"question": "이직을 해도 될까요?", "birth_dt": "1990-05-03T09:00:00", "gender": "female", "hour_unknown": True}).json()
    assert same["hexagram"] == body["hexagram"]  # 시간 미상도 같은 사람 카드처럼 같은 괘


def test_member_uses_default_profile_and_unknown_member_has_no_cross(client):
    body = client.post("/iching/ask", json={"question": "이직을 해도 될까요?", "member_id": str(MEMBER_ID)}).json()
    direct = client.post("/iching/ask", json={"question": "이직을 해도 될까요?", "birth_dt": "1990-05-03T09:00:00", "gender": "female"}).json()
    assert body["identity"] == "person" and body["hexagram"] == direct["hexagram"] and body["cross"] == direct["cross"]  # 기본 프로필(나)
    unknown = client.post("/iching/ask", json={"question": "이직을 해도 될까요?", "member_id": str(uuid4())}).json()
    assert unknown["identity"] == "date" and unknown["cross"] is None


def test_category_chip_and_length_limits(client):
    body = client.post("/iching/ask", json={"question": "내일 비 올까", "category": "재물"}).json()
    assert body["category"] == "재물" and body["area"]["label"] == "재물"
    assert client.post("/iching/ask", json={"question": "응?"}).status_code == 422
    assert client.post("/iching/ask", json={"question": "가" * 81}).status_code == 422
    assert client.post("/iching/ask", json={"question": "내일 비 올까", "category": "건강"}).status_code == 422


def test_crisis_question_is_blocked_without_casting(client):
    body = client.post("/iching/ask", json={"question": "죽고 싶은데 어떡하죠"}).json()
    assert body["blocked"] == "crisis" and "hexagram" not in body
    assert {h["number"] for h in body["helplines"]} == {"109", "1577-0199"}
