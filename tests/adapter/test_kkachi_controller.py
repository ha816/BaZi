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
    assert client.get(f"/kkachi/shares/{uuid4()}").status_code == 404


def test_share_three_pillars_when_hour_unknown(client):
    body = {"birth_dt": "1990-10-10T12:00:00", "gender": "female", "hour_unknown": True, "name": "가"}
    card = client.get(f"/kkachi/shares/{client.post('/kkachi/shares', json=body).json()['share_id']}").json()
    assert card["hour_unknown"] is True and len(card["pillars"]) == 3
