#!/usr/bin/env bash
# 코드 변경을 이 머신의 베타 인스턴스(launchd com.kkachi.*)에 반영한다.
#   프론트 production 빌드 → 백엔드·프론트 재기동 → 헬스체크
# 주의: `npm run dev`는 .next를 지우므로 베타 프론트(next start)와 같은 디렉터리에서 동시에 쓰지 않는다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="gui/$(id -u)"

log() { printf '\033[1;34m▶ %s\033[0m\n' "$*"; }

log "프론트 production 빌드"
(cd "$ROOT/frontend" && npm run build)

log "백엔드·프론트 재기동 (launchd)"
launchctl kickstart -k "$DOMAIN/com.kkachi.backend"
launchctl kickstart -k "$DOMAIN/com.kkachi.frontend"
sleep 6

log "헬스체크"
curl -fsS -o /dev/null http://127.0.0.1:8000/docs && echo "  backend  :8000 ok"
curl -fsS -o /dev/null http://127.0.0.1:3000/ && echo "  frontend :3000 ok"
curl -fsS -o /dev/null http://127.0.0.1:8080/api/docs && echo "  caddy    :8080 → /api ok"
code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/push/vapid-public-key)
[ "$code" = "200" ] && echo "  push     VAPID ok" || echo "  push     VAPID 미설정 (HTTP $code) — ~/kkachi/vapid.env 확인"
