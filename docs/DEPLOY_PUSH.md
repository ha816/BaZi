# 아침 알림(Web Push) 운영 배치 — ROADMAP R4

코드는 모두 커밋됨. 아래는 실제로 폰에 알림이 오게 하는 운영 절차다. 시크릿(VAPID 비밀키)과 스케줄 등록이라 사람이 직접 한 번 실행한다. macOS(이 개발 머신) 기준이며 tailscale HTTPS를 쓴다.

## 사전 조건

- Push API는 HTTPS 또는 localhost에서만 동작한다. 폰으로 구독하려면 tailscale HTTPS로 띄운다 (인증서: 저장소 루트의 `*.tail48dbe2.ts.net.crt/.key`, git 미추적).
- iOS는 Safari에서 **홈 화면에 추가(PWA)** 한 뒤에만 알림을 허용한다. Android Chrome은 바로 된다.
- 8000 포트에 옛 백엔드가 떠 있을 수 있다 (`lsof -i :8000`). 새 코드로 재시작해야 알림 기능이 있다.

## 1. VAPID 키 생성 (최초 1회)

```bash
uv run python scripts/vapid_keygen.py mailto:you@example.com
```

출력된 `export KKACHI_VAPID_*` 세 줄을 안전한 곳에 보관한다. **`local.toml`이나 git에 넣지 않는다.** 백엔드 프로세스와 발송 스크립트가 같은 키를 env로 받아야 한다.

## 2. 백엔드·프론트 HTTPS 기동

```bash
# 백엔드 (VAPID 키를 export한 셸에서)
export KKACHI_VAPID_PUBLIC_KEY=... KKACHI_VAPID_PRIVATE_KEY=... KKACHI_VAPID_SUBJECT=mailto:you@example.com
export KKACHI_CORS_ORIGINS=https://al03044198.tail48dbe2.ts.net:3000
uv run uvicorn kkachi.fastapi:app --port 8000 \
  --ssl-certfile al03044198.tail48dbe2.ts.net.crt --ssl-keyfile al03044198.tail48dbe2.ts.net.key

# 프론트 (다른 셸)
cd frontend
NEXT_PUBLIC_API_URL=https://al03044198.tail48dbe2.ts.net:8000 \
  npx next dev --port 3000 \
  --experimental-https --experimental-https-key ../al03044198.tail48dbe2.ts.net.key --experimental-https-cert ../al03044198.tail48dbe2.ts.net.crt
```

폰에서 `https://al03044198.tail48dbe2.ts.net:3000/join` 으로 로그인 → 홈 화면에 추가(iOS) → `/siun`에서 "알림 켜기".

## 3. 발송 확인

```bash
# 페이로드만 미리보기 (발송 안 함)
uv run python scripts/send_daily_push.py --dry-run
# 특정 회원에게 실제 1건 발송 테스트
uv run python scripts/send_daily_push.py --member <member-uuid>
```

`gone:deleted`는 만료된 구독을 정리한 것, `sent`가 실제 전송이다.

## 4. 매일 07:00 자동 발송 (launchd)

```bash
cp deploy/launchd/com.sajukkachi.daily-push.plist.template ~/Library/LaunchAgents/com.sajukkachi.daily-push.plist
# 편집기로 __PLACEHOLDER__ 치환:
#   __UV_PATH__          = $(which uv)
#   __PROJECT_DIR__      = /Users/seungmin/Workspace/Service/BaZi
#   __VAPID_PUBLIC_KEY__ / __VAPID_PRIVATE_KEY__ = 1단계 출력값
#   __EMAIL__            = you@example.com
#   __DB_URL__           = local.toml [db].url 값
mkdir -p logs
launchctl load ~/Library/LaunchAgents/com.sajukkachi.daily-push.plist
launchctl start com.sajukkachi.daily-push   # 즉시 1회 테스트
tail -f logs/daily-push.log
```

해제: `launchctl unload ~/Library/LaunchAgents/com.sajukkachi.daily-push.plist`

## 관리자 발송 (선택)

서버가 떠 있을 때 API로도 발송·미리보기 할 수 있다. 실발송은 `KKACHI_ADMIN_TOKEN` env를 설정하고 헤더로 넘긴다.

```bash
curl -X POST 'http://localhost:8000/admin/push/send-daily'                  # dry-run
curl -X POST 'http://localhost:8000/admin/push/send-daily?dry_run=false' -H 'X-Admin-Token: <토큰>'
```
