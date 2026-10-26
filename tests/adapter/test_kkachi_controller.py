from uuid import UUID, uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.container import Container
from kkachi.fastapi import app


class FakeShareRepo:
    def __init__(self):
        self.rows: dict[UUID, dict] = {}

    async def create(self, payload: dict) -> UUID:
        sid = uuid4()
        self.rows[sid] = payload
        return sid

    async def get(self, share_id: UUID) -> dict | None:
        return self.rows.get(share_id)


@pytest.fixture
def client():
    """lifespan 없이 — share_repo만 가짜, 사주 계산은 실제 어댑터. LLM은 끊어 둔다."""
    container = Container()
    container.share_repo.override(providers.Object(FakeShareRepo()))
    container.ollama_adapter.override(providers.Object(None))
    yield TestClient(app)
    container.unwire()


def test_share_roundtrip_exposes_card_only(client):
    body = {"birth_dt": "1990-10-10T14:30:00", "gender": "male", "analysis_year": 2026, "name": "승민"}
    res = client.post("/kkachi/shares", json=body)
    assert res.status_code == 201
    card = client.get(f"/kkachi/shares/{res.json()['share_id']}").json()
    assert card["name"] == "승민" and len(card["pillars"]) == 4 and card["summary"]["me"]
    assert "birth_dt" not in card and "gender" not in card
    # 나의 캐릭터(V4) — 戊 일간·신강 → 무_강. 자연물 비유 이름·세부 수치는 카드에 안 실음
    assert card["character"]["key"] == "무_강" and card["character"]["title"] == "든든한 수호자"
    assert card["character"]["jobs"] and "name" not in card["character"] and "strength_pct" not in card["character"]
    assert client.get(f"/kkachi/shares/{uuid4()}").status_code == 404


def test_share_three_pillars_when_hour_unknown(client):
    body = {"birth_dt": "1990-10-10T12:00:00", "gender": "female", "hour_unknown": True, "name": "가"}
    card = client.get(f"/kkachi/shares/{client.post('/kkachi/shares', json=body).json()['share_id']}").json()
    assert card["hour_unknown"] is True and len(card["pillars"]) == 3


def test_today_is_public(client):
    r = client.get("/kkachi/today")
    assert r.status_code == 200
    body = r.json()
    assert len(body["zodiac"]) == 12 and all(z["advice"] for z in body["zodiac"])
