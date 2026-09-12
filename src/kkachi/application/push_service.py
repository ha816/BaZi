import logging
from datetime import date
from uuid import UUID

from kkachi.application.fortune_service import FortuneService
from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.port.push_port import PushPort, PushSenderPort

_log = logging.getLogger(__name__)

PUSH_URL = "/siun?src=push"


def build_push_payload(fortune: dict) -> dict:
    """일진 dict → 알림 페이로드. 제목은 헤드라인(이름 접두 제거), 본문은 할 것·피할 것."""
    headline = fortune.get("headline") or fortune.get("description") or "오늘의 기운을 확인해보세요."
    if "님, " in headline[:12]:
        headline = headline.split("님, ", 1)[1]
    lines = []
    if fortune.get("action"):
        lines.append(f"✦ {fortune['action']}")
    if fortune.get("caution"):
        lines.append(f"✕ {fortune['caution']}")
    return {
        "title": f"🐦 {headline}",
        "body": "\n".join(lines) or f"{fortune.get('level', '')} · {fortune.get('total_score', '')}점",
        "url": PUSH_URL,
        "tag": f"kkachi-daily-{fortune.get('date', date.today().isoformat())}",
    }


class PushService:
    def __init__(
        self,
        push_port: PushPort,
        sender: PushSenderPort,
        profile_port: ProfilePort,
        fortune_service: FortuneService,
    ):
        self._push_port = push_port
        self._sender = sender
        self._profile_port = profile_port
        self._fortune_service = fortune_service

    @property
    def configured(self) -> bool:
        return self._sender.configured

    @property
    def public_key(self) -> str:
        return self._sender.public_key

    async def subscribe(self, member_id: UUID, endpoint: str, p256dh: str, auth: str) -> None:
        await self._push_port.save(member_id, endpoint, p256dh, auth)

    async def unsubscribe(self, endpoint: str) -> None:
        await self._push_port.delete(endpoint)

    async def send_daily(self, dry_run: bool = True, only_member: UUID | None = None) -> list[dict]:
        """구독별로 회원의 is_self 프로필(없으면 첫 프로필) 오늘 일진을 만들어 발송. 결과 요약 리스트 반환."""
        results: list[dict] = []
        for sub in await self._push_port.list_all():
            if only_member and sub.member_id != only_member:
                continue
            profiles = await self._profile_port.list_by_member(sub.member_id)
            profile = next((p for p in profiles if p.is_self), profiles[0] if profiles else None)
            if profile is None:
                results.append({"member_id": str(sub.member_id), "status": "skip:no_profile"})
                continue
            fortune = await self._fortune_service.get_fortune(profile.id)
            payload = build_push_payload(fortune)
            entry = {"member_id": str(sub.member_id), "profile": profile.name, "title": payload["title"], "body": payload["body"]}
            if dry_run:
                entry["status"] = "dry_run"
            else:
                try:
                    alive = await self._sender.send(sub, payload)
                except Exception as e:  # noqa: BLE001 — 한 구독 실패가 전체 발송을 막지 않게
                    _log.warning("push failed for %s: %s", sub.endpoint[:40], e)
                    entry["status"] = f"error:{e.__class__.__name__}"
                    results.append(entry)
                    continue
                if not alive:
                    await self._push_port.delete(sub.endpoint)
                    entry["status"] = "gone:deleted"
                else:
                    entry["status"] = "sent"
            results.append(entry)
        return results
