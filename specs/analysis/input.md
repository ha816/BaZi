# 사주 분석 — 입력 (프로필 선택·직접 입력)

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | `/analysis` 폼 단계 (`/analysis/deep`은 redirect). 결과 단계는 `specs/analysis/result.md` |

## 화면 명세 (옛 screen_spec)

**진입 조건:** 없음 — 직접 입력은 비로그인 가능, 프로필 탭은 로그인 시 활성

| 모드 | 조건 | API |
|------|------|-----|
| 저장된 프로필 | 로그인 + 프로필 있음 (기본 선택) | `POST /members/{id}/profiles/{pid}/analyze` (캐시) |
| 직접 입력 | 기본 | `POST /kkachi/interpret` |

```
입력 → "프로필 저장" (로그인: 실제 저장 / 비로그인: 확인 단계) → "분석 시작"
  → sessionStorage kkachi_analysis_input · kkachi_analysis_name (· kkachi_profile_input)
  → ResultSlides
재진입: 주소에 `?tab=`·`?step=`이 있을 때만 sessionStorage 입력값으로 자동 재분석, 그냥 `/analysis`면 입력 화면 (2026-10-25)
```

**ResultSlides 탭:** 결과 단계는 `specs/analysis/result.md`.

**출생시간 모름:** "모르겠어요" 선택 시 `hour_unknown` → 시주 없이 세 기둥으로 분석. 결과 상단 고지, 팔자 그리드 시주 자리 "?" 타일.

**개선 포인트:** 비로그인 직접 입력은 FeedbackBar 전송 불가(버튼만 표시).

---

### `/analysis/deep`

`router.replace("/analysis")`만 수행. 외부 링크 호환용. 삭제 시점 결정 필요.

---


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

1. `/analysis` 진입 → **비로그인**은 `AnalysisForm` 하나. **로그인**은 궁합과 같은 "분석할 분" 카드(`PersonCard`, 2026-10-25) — 프로필 있으면 [프로필], 없으면 직접 입력 칸 + "나의 사주 등록하기 →" 안내. [직접]은 이름·생년월일·태어난 시간·도시(IP 감지값으로 채움)·성별, 아래 분석 연도, 이름을 넣어야 [분석 시작] 활성 — 프로필 저장 단계 없이 바로 `POST /kkachi/interpret`
2. (비로그인) `AnalysisForm`에 이름 · 생년월일 · 태어난 시간(12지시, "모르겠어요"=12:00) · 성별 입력
   - "정밀 설정" 접이식: 분석 연도 (기본 올해)
   - 도시/경도는 `ipapi.co` IP 위치 감지로 자동 주입 (UI 미노출, `longitude` → sajupy 직접 전달)
3. (비로그인) "프로필 저장" 버튼은 비활성 + 가입 유도 캡션, "분석 시작"은 이름만 넣으면 바로 — 로그인 사용자의 "저장 먼저" 단계는 2026-10-25 카드로 바꾸며 없앰(궁합 직접 입력과 같게)
4. "분석 시작" 클릭 → `POST /kkachi/interpret`
5. 성공 시 `ResultSlides` 렌더, `sessionStorage`에 `kkachi_analysis_input`·`kkachi_analysis_name` 저장 (`kkachi_profile_input` 제거)

## 시나리오 2 — 저장된 프로필 (로그인)

1. `localStorage["kkachi_member_id"]` 있으면 프로필 목록 자동 로드 → 기본 프로필(is_self) 선택
2. "분석할 분" 카드의 [프로필] 드롭다운(이름·출생연도·성별, 궁합과 같은 `PersonCard`) + 분석 연도 + "저장된 지난 분석" 칩
3. "분석 시작" → `POST /members/{id}/profiles/{pid}/analyze { year }` (analyses 캐시 우선)
4. 성공 시 `ResultSlides` 렌더, `sessionStorage`에 `kkachi_profile_input {memberId, profileId, year}` + `kkachi_analysis_input` + `kkachi_analysis_name` 저장

## 시나리오 3 — 재진입 자동 분석

- 결과 주소(`/analysis?tab=…`·`?step=…` — 새로고침·뒤로 가기·홈 퀵스타트 `?step=intro`)로 들어오면 `sessionStorage["kkachi_analysis_input"]`으로 자동으로 `POST /kkachi/interpret` 재호출 → 결과 바로 표시
- 그냥 `/analysis`(하단 메뉴 등)로 들어오면 지난 결과를 띄우지 않고 입력 화면부터 (2026-10-25)
- "다시 입력" 버튼으로 폼 복귀 (sessionStorage는 유지)

## 시나리오 4 — 비로그인 + 프로필 탭

- "저장된 프로필 불러오기" 탭: 빈 상태 + `/join`(비로그인) 또는 `/profile`(프로필 없음) 링크 안내

---

## 시나리오 5 — 결과 화면

결과 단계(인트로·설문·9탭·다음 이야기·피드백)는 **`specs/analysis/result.md`** 가 정식 스펙이다. 이 파일은 입력 폼까지만 다룬다.

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
| 2026-10-25 | 로그인 입력을 궁합과 같은 "분석할 분" 카드(`PersonCard` [프로필|직접])로 — 위쪽 모드 탭·로그인 직접 입력의 "프로필 저장 먼저" 단계 제거. 비로그인은 `AnalysisForm` 그대로 |

---

## 미결 사항 / 개선 검토

- [ ] `/analysis/deep` redirect 페이지 삭제 시점

> 결과 화면 쪽 미결(분석 연도 자동 갱신, 비로그인 피드백)은 `specs/analysis/result.md` 6장으로 옮겼다.
