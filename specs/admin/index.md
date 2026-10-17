# 피드백 대시보드

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/admin/feedback` — 네비 미연결, 서버 토큰 있으면 401 → 토큰 프롬프트 |

## 화면 명세 (옛 screen_spec)

**진입 조건:** 없음 (인증 미구현). 네비 미연결.

- `GET /admin/feedback/summary` → 탭별 `{total, positive, negative, positive_rate}` 긍정률 오름차순
- 탭 메타는 `ResultSlides.FEATURE_TABS`와 동일 6종

---
