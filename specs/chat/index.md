# 까치 상담 챗

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/chat` — 분석 입력값(sessionStorage)을 재사용하는 풀스크린 챗. 궁합 챗은 `specs/compatibility/chat.md` |

## 화면 명세 (옛 screen_spec)

**진입 조건:** 없음. `sessionStorage["kkachi_analysis_input"]` 없으면 안내 문구만.

- `POST /kkachi/chat` 스트리밍, 최근 10개 메시지 전송, 응답 225자 이내 규칙(시스템 프롬프트)
- BottomNav 숨김, `fixed inset-0`

---

## 시나리오 6 — 까치 상담 (`/chat`)

1. FAB 클릭 → `/chat` 풀스크린 (BottomNav 숨김)
2. `sessionStorage["kkachi_analysis_input"]` 없으면 "먼저 사주 분석을 진행해주세요" 안내
3. 질문 입력 → `POST /kkachi/chat { ...input, name, messages }` → 스트리밍 응답 (최근 10개 메시지만 전송)

---
