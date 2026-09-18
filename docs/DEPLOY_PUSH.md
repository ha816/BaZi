# 아침 알림(Web Push) 운영 배치 — ROADMAP R4

코드는 모두 커밋됨. 아래는 실제로 폰에 알림이 오게 하는 운영 절차다. macOS(이 개발 머신) 기준. 2026-09-18에 이 머신에는 적용 완료 — 남은 것은 실기기 구독·수신 확인만.

## 사전 조건

- Push API는 HTTPS 또는 localhost에서만 동작한다. 폰으로 구독하려면 tailscale HTTPS로 띄운다 (인증서: 저장소 루트의 `*.tail48dbe2.ts.net.crt/.key`, git 미추적).
- iOS는 Safari에서 **홈 화면에 추가(PWA)** 한 뒤에만 알림을 허용한다. Android Chrome은 바로 된다.
- 코드 변경 후에는 `bash scripts/deploy.sh`로 launchd 백엔드·프론트를 재기동해야 반영된다.

## 현재 이 머신의 구성 (2026-09-18 적용됨)

베타는 launchd 5+1개로 돈다: `com.kkachi.db`(scripts/db.sh up) · `backend`(:8000) · `frontend`(next start :3000) · `caddy`(:8080, /api→8000, /→3000) · `backup`(04:00) · `daily-push`(07:00). 외부는 Tailscale Funnel → :8080. 운영 치트시트는 `~/kkachi/README.md`.

- VAPID 키: `~/kkachi/vapid.env` (권한 600, `export KKACHI_VAPID_*` 3줄). backend·daily-push plist가 `bash -c 'source … && exec …'`로 읽는다. **plist·local.toml·git에 넣지 않는다.**
- 코드 반영: `bash scripts/deploy.sh` (프론트 빌드 → backend·frontend 재기동 → 헬스체크). `npm run dev`는 `.next`를 지워 베타 프론트를 죽이므로 같은 디렉터리에서 병행하지 않는다.
- 남은 확인: 폰에서 `https://al03044198.tail48dbe2.ts.net/siun` → (iOS는 홈 화면 추가 후) "알림 켜기" → 다음 날 07:00 수신. 즉시 테스트는 아래 3단계.

## 1. VAPID 키 생성 (최초 1회)

```bash
uv run python scripts/vapid_keygen.py mailto:you@example.com > ~/kkachi/vapid.env && chmod 600 ~/kkachi/vapid.env
```

출력은 `export KKACHI_VAPID_*` 세 줄이다. **`local.toml`이나 git에 넣지 않는다.** 백엔드 프로세스와 발송 스크립트가 같은 파일을 source 한다.

## 2. 백엔드·프론트 기동

이 머신은 launchd + Caddy + Tailscale Funnel이 HTTPS를 맡는다 (위 "현재 구성"). 다른 머신에서 tailscale 인증서로 직접 띄우려면:

```bash
# 백엔드
source ~/kkachi/vapid.env
export KKACHI_CORS_ORIGINS=https://<host>.ts.net:3000
uv run uvicorn kkachi.fastapi:app --port 8000 --ssl-certfile <host>.ts.net.crt --ssl-keyfile <host>.ts.net.key

# 프론트 (다른 셸)
cd frontend
NEXT_PUBLIC_API_URL=https://<host>.ts.net:8000 npx next dev --port 3000 \
  --experimental-https --experimental-https-key ../<host>.ts.net.key --experimental-https-cert ../<host>.ts.net.crt
```

폰에서 `/join` 으로 로그인 → 홈 화면에 추가(iOS) → `/siun`에서 "알림 켜기".

## 3. 발송 확인

```bash
# 페이로드만 미리보기 (발송 안 함)
bash -c 'source ~/kkachi/vapid.env && uv run python scripts/send_daily_push.py --dry-run'
# 특정 회원에게 실제 1건 발송 테스트
bash -c 'source ~/kkachi/vapid.env && uv run python scripts/send_daily_push.py --member <member-uuid>'
# launchd 잡을 지금 한 번 실행
launchctl kickstart gui/$(id -u)/com.kkachi.daily-push && tail ~/Library/Logs/kkachi/daily-push.out.log
```

`gone:deleted`는 만료된 구독을 정리한 것, `sent`가 실제 전송이다.

## 4. 매일 07:00 자동 발송 (launchd)

```bash
sed -e "s#__VAPID_ENV__#$HOME/kkachi/vapid.env#" -e "s#__UV_PATH__#$(which uv)#" \
    -e "s#__PROJECT_DIR__#$PWD#" -e "s#__HOME__#$HOME#" \
    deploy/launchd/com.kkachi.daily-push.plist.template > ~/Library/LaunchAgents/com.kkachi.daily-push.plist
mkdir -p ~/Library/Logs/kkachi
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.kkachi.daily-push.plist
launchctl kickstart gui/$(id -u)/com.kkachi.daily-push   # 즉시 1회 테스트
tail -f ~/Library/Logs/kkachi/daily-push.out.log
```

해제: `launchctl bootout gui/$(id -u)/com.kkachi.daily-push`

## 관리자 발송 (선택)

서버가 떠 있을 때 API로도 발송·미리보기 할 수 있다. 실발송은 `KKACHI_ADMIN_TOKEN` env를 설정하고 헤더로 넘긴다.

```bash
curl -X POST 'http://localhost:8000/admin/push/send-daily'                  # dry-run
curl -X POST 'http://localhost:8000/admin/push/send-daily?dry_run=false' -H 'X-Admin-Token: <토큰>'
```
