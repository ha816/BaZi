from uuid import UUID, uuid4

import pytest
from dependency_injector import providers
from fastapi.testclient import TestClient

from kkachi.application.port.push_port import PushPort, PushSenderPort, PushSubscription
from kkachi.container import Container
from kkachi.fastapi import app

ENDPOINT = "https://push.example.com/send/abcdefghijklmnopqrstuvwxyz"
SUB_BODY = {"member_id": str(uuid4()), "subscription": {"endpoint": ENDPOINT, "keys": {"p256dh": "p256dh-key-value", "auth": "auth-key-value"}}}


class FakeSender(PushSenderPort):
    def __init__(self, configured: bool):
        self._configured = configured

    @property
    def configured(self) -> bool:
        return self._configured

    @property
    def public_key(self) -> str:
        return "BTestPublicKey"

    async def send(self, sub: PushSubscription, payload: dict) -> bool:
        return True


class FakePushRepo(PushPort):
    def __init__(self):
        self.rows: dict[str, PushSubscription] = {}

    async def save(self, member_id: UUID, endpoint: str, p256dh: str, auth: str) -> PushSubscription:
        sub = PushSubscription(id=uuid4(), member_id=member_id, endpoint=endpoint, p256dh=p256dh, auth=auth)
        self.rows[endpoint] = sub
        return sub

    async def delete(self, endpoint: str) -> None:
        self.rows.pop(endpoint, None)

    async def list_all(self) -> list[PushSubscription]:
        return list(self.rows.values())


@pytest.fixture
def make_client():
    """configured 여부별로 컨테이너를 새로 만든다 — lifespan 없이, 발송기·구독 저장소만 가짜."""
    containers: list[Container] = []

    def _make(configured: bool) -> tuple[TestClient, FakePushRepo]:
        container = Container()
        repo = FakePushRepo()
        container.webpush_adapter.override(providers.Object(FakeSender(configured)))
        container.push_repo.override(providers.Object(repo))
        # PushService 생성자가 받기만 하고 컨트롤러 경로에선 안 쓰는 의존성 — 실제 구현은 DB 엔진을 만들려 해서 끊는다
        container.profile_repo.override(providers.Object(None))
        container.fortune_service.override(providers.Object(None))
        containers.append(container)
        return TestClient(app), repo

    yield _make
    for c in containers:
        c.unwire()


def test_unconfigured_vapid_returns_503_for_key_and_subscribe(make_client):
    client, repo = make_client(configured=False)
    assert client.get("/push/vapid-public-key").status_code == 503
    assert client.post("/push/subscriptions", json=SUB_BODY).status_code == 503
    assert repo.rows == {}


def test_subscribe_and_unsubscribe_roundtrip(make_client):
    client, repo = make_client(configured=True)
    assert client.get("/push/vapid-public-key").json() == {"public_key": "BTestPublicKey"}
    res = client.post("/push/subscriptions", json=SUB_BODY)
    assert res.status_code == 201 and res.json() == {"success": True}
    assert repo.rows[ENDPOINT].member_id == UUID(SUB_BODY["member_id"]) and repo.rows[ENDPOINT].p256dh == "p256dh-key-value"
    assert client.request("DELETE", "/push/subscriptions", json={"endpoint": ENDPOINT}).status_code == 204
    assert repo.rows == {}


def test_subscribe_rejects_non_https_endpoint(make_client):
    client, repo = make_client(configured=True)
    bad = {**SUB_BODY, "subscription": {**SUB_BODY["subscription"], "endpoint": "http://push.example.com/send/abcdefghijklmnop"}}
    assert client.post("/push/subscriptions", json=bad).status_code == 422
    assert repo.rows == {}
