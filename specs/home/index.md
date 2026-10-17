# 홈 (피드)

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/` — 비로그인 퀵스타트 / 로그인 피드 |

## 화면 명세 (옛 screen_spec)

**진입 조건:** 없음 (공개)

| 상태 | 표시 내용 |
|------|---------|
| 비로그인 | 날짜 헤더 + VideoPost (가입 CTA) |
| 로그인 + 프로필 없음 | EmptyProfilePost + VideoPost |
| 로그인 + 프로필 있음 | StoryTray + FortunePost × N + VideoPost |

**데이터:** `listProfiles(memberId)` → is_self 우선 정렬, `getForecast(memberId, profileId, 7)` (FortunePost당 1회)

**인터랙션:** StoryTray 아바타 → 해당 FortunePost로 스크롤, "사주분석하기" → `/analysis`, "나와 궁합보기" → `/compatibility?p2={id}` (is_self는 `/compatibility`)

**참고:** WeatherPost는 2026-05에 홈 피드에서 제거(`795ac80`), 컴포넌트 코드는 `page.tsx` 내부에 남아 있음.

---
