# 궁합 상담 챗

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/compatibility/chat` — 궁합 입력값(sessionStorage `kkachi_compat_*`)을 재사용하는 풀스크린 챗 |

## 시나리오 5 — 궁합 상담 챗 (`/compatibility/chat`)

1. FAB 클릭 → 풀스크린 챗 (BottomNav 숨김), 헤더에 `name1 ♥ name2`
2. `sessionStorage["kkachi_compat_input"]` 없으면 "먼저 궁합 분석을 진행해주세요"
3. 질문 → `POST /compatibility/chat { ...input, messages }` → 스트리밍 (최근 10개 메시지)

---
