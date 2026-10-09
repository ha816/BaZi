from datetime import datetime
from uuid import UUID, uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.container import Container
from kkachi.domain.profile import Profile
from kkachi.domain.user import Gender
from kkachi.fastapi import app

OWNER = uuid4()
STRANGER = uuid4()
P1 = Profile(id=uuid4(), member_id=OWNER, name="승민", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30), city="Seoul", created_at=datetime(2026, 1, 1), is_self=True)
P2 = Profile(id=uuid4(), member_id=OWNER, name="하늘", gender=Gender.FEMALE, birth_dt=datetime(1992, 3, 5, 9), city="Seoul", created_at=datetime(2026, 1, 1))
PERSON1 = {"name": "승민", "gender": "male", "birth_dt": "1990-10-10T14:30:00"}
PERSON2 = {"name": "하늘", "gender": "female", "birth_dt": "1992-03-05T09:00:00"}


class FakeProfileRepo:
    async def get(self, profile_id: UUID) -> Profile | None:
        return {P1.id: P1, P2.id: P2}.get(profile_id)


class FakeCompatRepo:
    def __init__(self):
        self.saved: list[tuple] = []

    async def get(self, lo, hi, year):
        return None

    async def save(self, lo, hi, year, result):
        self.saved.append((lo, hi, year))


class FakeKvRepo:
    """invite_repo·share_repo 공용 — create(payload)→id, get(id)→payload"""

    def __init__(self):
        self.rows: dict[UUID, dict] = {}

    async def create(self, payload: dict) -> UUID:
        sid = uuid4()
        self.rows[sid] = payload
        return sid

    async def get(self, key: UUID) -> dict | None:
        return self.rows.get(key)


@pytest.fixture
def client():
    """lifespan 없이 — 저장소만 가짜, 사주·궁합 계산은 실제. LLM은 끊어 둔다."""
    container = Container()
    compat_repo = FakeCompatRepo()
    container.profile_repo.override(providers.Object(FakeProfileRepo()))
    container.compatibility_repo.override(providers.Object(compat_repo))
    container.invite_repo.override(providers.Object(FakeKvRepo()))
    container.share_repo.override(providers.Object(FakeKvRepo()))
    container.ollama_adapter.override(providers.Object(None))
    c = TestClient(app)
    c.compat_repo = compat_repo  # type: ignore[attr-defined]
    yield c
    container.unwire()


def test_direct_returns_full_result_with_summary_character_zodiac(client):
    res = client.post("/compatibility/direct", json={"person1": PERSON1, "person2": PERSON2, "year": 2026, "relation_type": "friend"})
    assert res.status_code == 200
    body = res.json()
    assert 0 <= body["total_score"] <= 100 and body["label"]
    assert body["character"]["title"].endswith("콤비") and body["character"]["key"]
    assert set(body["summary"]) >= {"pillars", "element", "strength", "domain"}
    assert body["zodiac"]["p1"] and len(body["zodiac"]["years"]) == 4
    assert {"연애", "결혼", "재물", "직업"} <= set(body["domain_scores"])
    # 주오행 土→金 상생 — 조사는 한글 읽기 기준("土이 金를"이 아니라)
    assert body["description"].startswith("흙(土)이 쇠(金)를 키워주는 상생 관계로")


def test_direct_hour_unknown_drops_hour_pillar_for_that_person(client):
    res = client.post("/compatibility/direct", json={"person1": {**PERSON1, "hour_unknown": True}, "person2": PERSON2, "year": 2026})
    body = res.json()
    assert body["pillar1_snapshot"]["hour_unknown"] is True and len(body["pillar1_snapshot"]["pillars"]) == 3
    assert body["pillar2_snapshot"]["hour_unknown"] is False and len(body["pillar2_snapshot"]["pillars"]) == 4


def test_by_profiles_computes_saves_and_404s_unknown(client):
    res = client.post("/compatibility", json={"profile_id_1": str(P1.id), "profile_id_2": str(P2.id), "year": 2026, "relation_type": "lover"})
    assert res.status_code == 200 and res.json()["character"]["title"].endswith("커플")
    lo, hi = sorted([str(P1.id), str(P2.id)])
    assert client.compat_repo.saved == [(UUID(lo), UUID(hi), 2026)]
    assert client.post("/compatibility", json={"profile_id_1": str(P1.id), "profile_id_2": str(uuid4()), "year": 2026}).status_code == 404


def test_share_roundtrip_exposes_card_with_character_only(client):
    res = client.post("/compatibility/shares", json={"person1": PERSON1, "person2": PERSON2, "year": 2026, "relation_type": "family"})
    assert res.status_code == 201
    card = client.get(f"/kkachi/shares/{res.json()['share_id']}").json()
    assert card["kind"] == "compat" and card["relation_label"] == "가족" and card["name1"] == "승민"
    assert card["character"]["title"].endswith("가족") and "{p1}" not in card["character"]["desc"]
    assert card["p1"]["stem"] and card["p1"]["element"] in {"木", "火", "土", "金", "水"}
    assert not {"birth_dt", "gender", "pillar1_snapshot", "pillar_relations", "narrative"} & set(card)


def test_invite_hides_birth_info_and_resolves(client):
    res = client.post("/compatibility/invites", json={"person1": PERSON1, "relation_type": "friend"})
    assert res.status_code == 201
    invite_id = res.json()["invite_id"]
    assert client.get(f"/compatibility/invites/{invite_id}").json() == {"name": "승민", "relation_type": "friend"}
    resolved = client.post(f"/compatibility/invites/{invite_id}/resolve", json={"person2": PERSON2, "year": 2026})
    assert resolved.status_code == 200 and resolved.json()["character"]["title"].endswith("콤비")  # 초대자가 고른 관계 유형
    assert client.get(f"/compatibility/invites/{uuid4()}").status_code == 404
    assert client.post(f"/compatibility/invites/{uuid4()}/resolve", json={"person2": PERSON2, "year": 2026}).status_code == 404


def test_daily_is_owner_only(client):
    res = client.get("/compatibility/daily", params={"member_id": str(OWNER), "p1": str(P1.id), "p2": str(P2.id)})
    assert res.status_code == 200
    assert set(res.json()) >= {"date", "day_pillar", "score", "level", "headline"}
    assert client.get("/compatibility/daily", params={"member_id": str(STRANGER), "p1": str(P1.id), "p2": str(P2.id)}).status_code == 403
    assert client.get("/compatibility/daily", params={"member_id": str(OWNER), "p1": str(P1.id), "p2": str(uuid4())}).status_code == 404
