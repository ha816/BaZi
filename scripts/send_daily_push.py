"""아침 알림 발송. cron/launchd에서 07:00에 실행.
사용: uv run python scripts/send_daily_push.py [--dry-run] [--member <uuid>]
환경: KKACHI_VAPID_* (필수), KKACHI_DB_URL (선택, 없으면 local.toml)
"""
import argparse
import asyncio
import os
import tomllib
from pathlib import Path
from uuid import UUID

from kkachi.container import Container

ROOT = Path(__file__).resolve().parent.parent


async def _main(dry_run: bool, member: UUID | None) -> int:
    container = Container()
    with open(ROOT / "src" / "kkachi" / "resource" / "local.toml", "rb") as f:
        container.config.from_dict(tomllib.load(f))
    if db_url := os.getenv("KKACHI_DB_URL"):
        container.config.db.url.from_value(db_url)
    svc = container.push_service()
    if not svc.configured and not dry_run:
        print("✖ KKACHI_VAPID_PUBLIC_KEY / KKACHI_VAPID_PRIVATE_KEY 미설정 — scripts/vapid_keygen.py 로 생성")
        return 1
    results = await svc.send_daily(dry_run=dry_run, only_member=member)
    for r in results:
        print(f"[{r['status']}] {r.get('profile', '-')}: {r.get('title', '')} | {r.get('body', '').replace(chr(10), ' ')}")
    print(f"총 {len(results)}건 · sent {sum(r['status'] == 'sent' for r in results)} · dry_run {sum(r['status'] == 'dry_run' for r in results)}")
    await container.db_engine().dispose()
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="발송하지 않고 페이로드만 출력")
    ap.add_argument("--member", type=UUID, default=None, help="특정 회원만")
    args = ap.parse_args()
    raise SystemExit(asyncio.run(_main(args.dry_run, args.member)))
