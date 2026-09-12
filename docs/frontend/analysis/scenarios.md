# 사주 분석 시나리오

## 관련 페이지 / API

| 경로 | 역할 |
|------|------|
| `/analysis` | 사주 종합 해석 — 프로필 선택 또는 직접 입력 (로그인 불필요) |
| `/analysis/deep` | `/analysis`로 redirect (구 경로 호환용) |
| `/chat` | 까치 상담 챗 (분석 입력값 재사용) |
| `POST /kkachi/interpret` | 직접 입력 해석 API |
| `POST /members/{id}/profiles/{pid}/analyze` | 프로필 기반 해석 API (연도별 캐시) |
| `POST /kkachi/stream-report` | AI 풀이 탭 스트리밍 |
| `POST /kkachi/chat` | 상담 챗 스트리밍 |
| `POST /members/{id}/profiles/{pid}/feedback` | 탭별 👍/👎 피드백 |

> 2026-05 이전의 "무료 기초 분석(`/saju/basic`) → 심층 분석(`/analysis/deep`, 로그인 필수)" 2단계 구조는 폐지됨. 지금은 한 화면에서 전체 해석을 바로 보여준다.

---

## 시나리오 1 — 직접 입력 (비로그인 가능)

1. `/analysis` 진입 → 로그인 + 프로필 있으면 "저장된 프로필 불러오기" 탭 기본, 아니면 "프로필 직접 입력하기" 탭
2. `AnalysisForm`에 이름 · 생년월일 · 태어난 시간(12지시, "모르겠어요"=12:00) · 성별 입력
   - "정밀 설정" 접이식: 분석 연도 (기본 올해)
   - 도시/경도는 `ipapi.co` IP 위치 감지로 자동 주입 (UI 미노출, `longitude` → sajupy 직접 전달)
3. **"프로필 저장" 클릭** → 로그인 시 `POST /members/{id}/profiles`, 비로그인 시 확인 단계만 → "분석 시작" 활성화
4. "분석 시작" 클릭 → `POST /kkachi/interpret`
5. 성공 시 `ResultSlides` 렌더, `sessionStorage`에 `kkachi_analysis_input`·`kkachi_analysis_name` 저장 (`kkachi_profile_input` 제거)

## 시나리오 2 — 저장된 프로필 (로그인)

1. `localStorage["kkachi_member_id"]` 있으면 프로필 목록 자동 로드 → 첫 프로필 선택
2. 드롭다운(이름·출생연도·시주·성별) + 분석 연도
3. "분석 시작" → `POST /members/{id}/profiles/{pid}/analyze { year }` (analyses 캐시 우선)
4. 성공 시 `ResultSlides` 렌더, `sessionStorage`에 `kkachi_profile_input {memberId, profileId, year}` + `kkachi_analysis_input` + `kkachi_analysis_name` 저장

## 시나리오 3 — 재진입 자동 분석

- `/analysis` 재진입 시 `sessionStorage["kkachi_analysis_input"]`이 있으면 자동으로 `POST /kkachi/interpret` 재호출 → 결과 바로 표시
- "다시 입력" 버튼으로 폼 복귀 (sessionStorage는 유지)

## 시나리오 4 — 비로그인 + 프로필 탭

- "저장된 프로필 불러오기" 탭: 빈 상태 + `/join`(비로그인) 또는 `/profile`(프로필 없음) 링크 안내

---

## 시나리오 5 — 결과 탭 구성 (`ResultSlides`, `?tab=`)

| id | 탭 | 컴포넌트 | 내용 |
|----|----|----------|------|
| `natal` | 만세력 | `NatalTab` | 사주팔자·십신·지장간·공망·십이운성·신살 (6 섹션) |
| `yongshin` | 용신·삼재 | `YongshinTab` + `SamjaeTab` | 신강·신약, 용신·기신, 삼재 |
| `daeun` | 시운(時運) | `DaeunTab` + `SeunTab` + `WolUnTab` + `FortuneTab` | 대운·세운·월운·충합·영역별 운 |
| `zodiac` | 십이지신 | `ZodiacTab` | 사주지지 띠, 십이지 충합, 연도별 띠 궁합 |
| `fengshui` | 풍수 | `FengShuiTab` | 팔택풍수 쿠아·8방위 길흉 |
| `ai` | AI 풀이 | `AiTab` | `POST /kkachi/stream-report` 스트리밍 (Ollama 필요) |

- 상단 sticky: 사주 4기둥 바 + feature 탭바
- 모든 탭 하단 `FeedbackBar` 👍/👎 → `POST .../feedback` (memberId·profileId 있을 때만 전송, 직접 입력 비로그인은 버튼만 표시)
- 우하단 `SajuChat` FAB → `/chat`

## 시나리오 6 — 까치 상담 (`/chat`)

1. FAB 클릭 → `/chat` 풀스크린 (BottomNav 숨김)
2. `sessionStorage["kkachi_analysis_input"]` 없으면 "먼저 사주 분석을 진행해주세요" 안내
3. 질문 입력 → `POST /kkachi/chat { ...input, name, messages }` → 스트리밍 응답 (최근 10개 메시지만 전송)

---

## 데이터 흐름

```
POST /kkachi/interpret
  Request:  { birth_dt, gender: "male"|"female", analysis_year, city, longitude?, name? }
  Response: { natal: NatalResult, postnatal: PostnatalResult }

POST /members/{id}/profiles/{pid}/analyze
  Request:  { year }
  Response: 위와 동일 (analyses(profile_id, year) 캐시 우선)
```

---

## 구현 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-04-08 | 기초 분석·심층 분석 페이지 분리, FreeResultSlides 블러 CTA 추가 |
| 2026-04-08 | "저장된 프로필 불러오기" / "프로필 직접 입력하기" 풀-width 탭 |
| 2026-05-24 | 무료/심층 2단계 폐지 → `/analysis` 단일 화면, `/analysis/deep`은 redirect. 탭 6개(만세력·용신삼재·시운·십이지신·풍수·AI) 재편 |
| 2026-05-25 | FeedbackBar 👍/👎 + `/admin/feedback` 대시보드 |
| 2026-05-25 | 사주 챗을 `/chat` 페이지로 분리 (SajuChat은 FAB만) |

---

## 미결 사항 / 개선 검토

- [ ] 분석 연도 변경 시 결과 자동 갱신
- [ ] 직접 입력(비로그인) 결과에서 피드백 전송 불가 — 익명 피드백 허용 여부
- [ ] `/analysis/deep` redirect 페이지 삭제 시점
- [ ] `tabs/AdviceTab.tsx` 미사용 — 삭제 또는 재편입 결정
