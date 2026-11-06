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
             city="Seoul", created_at=datetime(2026, 1, 1), is_self=True)  # 1990 경오년 → 午 말띠
FRIEND = Profile(id=uuid4(), member_id=MEMBER_ID, name="친구", gender=Gender.MALE, birth_dt=datetime(1991, 8, 20, 15),
                 city="Seoul", created_at=datetime(2026, 1, 1))


class FakeProfiles:
    async def list_by_member(self, member_id):
        return [FRIEND, ME] if member_id == MEMBER_ID else []


@pytest.fixture
def client():
    """lifespan 없이 — 사주는 실제 어댑터, 프로필은 가짜, LLM은 끊어 둔다."""
    container = Container()
    container.ollama_adapter.override(providers.Object(None))
    container.profile_repo.override(providers.Object(FakeProfiles()))
    yield TestClient(app)
    container.unwire()


def test_general_week_without_params(client):
    body = client.get("/kkachi/zodiac/week").json()
    assert body["me"] is None and body["date"] == date.today().isoformat()
    assert [d["date"] for d in body["days"]] == [(date.today() + timedelta(days=i)).isoformat() for i in range(7)]
    assert body["today"] == {k: v for k, v in client.get("/kkachi/today").json().items() if k not in ("sky", "tarot")}  # 홈 까치 소식과 같은 값
    day = body["days"][2]
    assert set(day) == {"date", "day_pillar", "day_kor", "animal", "son_eomneun_nal", "solar_term", "zodiac"}
    assert len(day["zodiac"]) == 12 and set(day["zodiac"][0]) == {"branch", "relation", "advice"}
    assert sum(z["relation"] == "나" for z in day["zodiac"]) == 1  # 그날 일지와 같은 띠 하나
    assert body["days"][0]["day_pillar"] == body["today"]["day_pillar"]


def test_personal_branch_from_profile_or_direct_input(client):
    body = client.get("/kkachi/zodiac/week", params={"member_id": str(MEMBER_ID)}).json()
    assert body["me"] == {"branch": "午"}  # 기본 프로필(나, 1990 경오년), 친구(1991 신미년) 아님
    direct = client.get("/kkachi/zodiac/week", params={"birth_dt": "1991-08-20T15:00:00", "gender": "male", "days": 3}).json()
    assert direct["me"] == {"branch": "未"} and len(direct["days"]) == 3
    early = client.get("/kkachi/zodiac/week", params={"birth_dt": "1990-01-20T12:00:00", "gender": "male"}).json()
    assert early["me"] == {"branch": "巳"}  # 입춘 전 출생은 전해(기사년) 띠
    assert client.get("/kkachi/zodiac/week", params={"member_id": str(uuid4())}).json()["me"] is None
    assert client.get("/kkachi/zodiac/week", params={"gender": "male"}).json()["me"] is None
    assert client.get("/kkachi/zodiac/week", params={"days": 15}).status_code == 422
