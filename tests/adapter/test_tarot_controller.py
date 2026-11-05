from pathlib import Path

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.container import Container
from kkachi.fastapi import app

ART_DIR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "kkachi" / "tarot"


@pytest.fixture
def client():
    """lifespan 없이 — 사주 계산은 실제 어댑터, LLM은 끊어 둔다."""
    container = Container()
    container.ollama_adapter.override(providers.Object(None))
    yield TestClient(app)
    container.unwire()


def test_date_only_card_without_params(client):
    body = client.get("/tarot/today").json()
    assert body["identity"] == "date" and body["cross"] is None
    assert body["card"]["orientation"] in ("정방향", "역방향") and len(body["card"]["keywords"]) == 3
    assert body == client.get("/tarot/today").json()  # 같은 날은 같은 카드


def test_person_card_has_cross_line_and_art_file(client):
    body = client.get("/tarot/today", params={"birth_dt": "1990-05-03T09:00:00", "gender": "female"}).json()
    assert body["identity"] == "person" and body["cross"].endswith("요.")
    assert (ART_DIR / f"{body['card']['key']}.webp").exists()  # 1909 클래식 덱 그림이 실제로 있다
    # 시간 미상도 같은 식으로(정오 저장값) — 생년월일·성별이 같으면 같은 카드
    same = client.get("/tarot/today", params={"birth_dt": "1990-05-03T09:00:00", "gender": "female", "hour_unknown": "true"}).json()
    assert same["card"] == body["card"]


def test_gender_alone_falls_back_to_date_card(client):
    body = client.get("/tarot/today", params={"gender": "male"}).json()
    assert body["identity"] == "date" and body["cross"] is None
    assert client.get("/tarot/today", params={"birth_dt": "not-a-date", "gender": "male"}).status_code == 422


def test_guest_today_feed_includes_date_card(client):
    today = client.get("/kkachi/today").json()
    assert today["tarot"]["identity"] == "date" and today["tarot"]["card"]["name"]
    assert "cross" not in today["tarot"]
