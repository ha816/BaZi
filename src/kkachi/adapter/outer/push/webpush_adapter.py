import asyncio
import json
import os

from pywebpush import WebPushException, webpush

from kkachi.application.port.push_port import PushSenderPort, PushSubscription


class WebPushAdapter(PushSenderPort):
    """VAPID 키는 환경변수로만 받는다 (local.toml에 비밀키를 커밋하지 않기 위해).
    KKACHI_VAPID_PUBLIC_KEY · KKACHI_VAPID_PRIVATE_KEY (URL-safe base64 raw) · KKACHI_VAPID_SUBJECT (mailto:…)
    생성: uv run python scripts/vapid_keygen.py
    """

    def __init__(self) -> None:
        self._public = os.getenv("KKACHI_VAPID_PUBLIC_KEY", "")
        self._private = os.getenv("KKACHI_VAPID_PRIVATE_KEY", "")
        self._subject = os.getenv("KKACHI_VAPID_SUBJECT", "mailto:admin@example.com")

    @property
    def configured(self) -> bool:
        return bool(self._public and self._private)

    @property
    def public_key(self) -> str:
        return self._public

    async def send(self, sub: PushSubscription, payload: dict) -> bool:
        info = {"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}}
        try:
            await asyncio.to_thread(
                webpush,
                subscription_info=info,
                data=json.dumps(payload, ensure_ascii=False),
                vapid_private_key=self._private,
                vapid_claims={"sub": self._subject},
                ttl=60 * 60 * 6,
            )
            return True
        except WebPushException as e:
            status = getattr(e.response, "status_code", None)
            if status in (404, 410):
                return False
            raise
