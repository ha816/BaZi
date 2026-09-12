# 사주까치 화면 명세

> 2026-09-12 코드 기준으로 재작성. API·DB·파일 트리의 정식 출처는 `CLAUDE.md`. 화면별 상세 흐름은 같은 폴더의 `*/scenarios.md`.

## 화면 구성 트리

```
사주까치
│
├── / ─────────────────────── 홈 (피드)
│
├── /join ─────────────────── 회원가입 / 로그인 (이메일 식별)
├── /my ───────────────────── 계정 설정 (로그아웃·탈퇴)
├── /profile ──────────────── 프로필 관리 (최대 10개)
│
├── /analysis ─────────────── 사주 분석 (전체 해석, 로그인 불필요)
│   ├── /analysis/deep ────── → /analysis redirect (구 경로 호환)
│   └── /chat ─────────────── 까치 상담 챗
│
├── /compatibility ────────── 궁합 (관계 유형 3종, ?p1=&p2=)
│   └── /compatibility/chat ─ 궁합 상담 챗
│
├── /siun ─────────────────── 시운(時運) — 오늘/내일/주간 일진
│
├── /weather ──────────────── 날씨 기운 (네비 미연결)
├── /palmistry ────────────── 손금 분석 (네비 미연결)
└── /admin/feedback ───────── 해석 피드백 대시보드 (네비 미연결, 인증 없음)
```

`/payment/*`(checkout·success·fail)와 `/fortune`은 2026-05에 제거됨. 결제 백엔드(`/payments/prepare|confirm`)만 남아 있고 프론트 게이트는 없다.

---

## 컴포넌트 트리

```
app/layout.tsx
└── BottomNav                     # 하단 탭바 5개: 홈·분석·궁합·시운·계정(비로그인: 로그인). /chat, /compatibility/chat 에서 숨김

/ (홈)
├── 날짜 헤더 (sticky)
├── [로그인+프로필] StoryTray      # 프로필 띠 이모지 아바타, 클릭 시 해당 포스트로 스크롤
├── [로그인+프로필 없음] EmptyProfilePost
├── [로그인] FortunePost × N       # 프로필별 오늘 운세 (7일 예보 첫날) — 까치 이미지(level별)·키워드 태그·손없는 날 배지
│   └── FeedPost                  # 인스타형 카드 레이아웃 (actions: 사주분석하기 · 나와 궁합보기)
└── VideoPost                     # 서비스 소개 영상 (hero.mp4, 음소거 토글)

/analysis
├── [탭 토글] 저장된 프로필 불러오기 | 프로필 직접 입력하기
├── [profile] 드롭다운 + 분석 연도
├── [direct] AnalysisForm           # 이름·생년월일·시간·성별 · 정밀 설정(연도) · "프로필 저장" → "분석 시작"
└── [결과] ResultSlides
    ├── [시간 모름] 세 기둥(三柱) 고지 배너
    ├── SummaryCard                 # 🐦 까치 한눈에 — 나(KkachiTip)·올해·이번 달·오늘·조심 (postnatal.summary)
    ├── StickySajuBar               # 4기둥 미니 표시, 클릭 시 맨 위로
    ├── feature-tabbar (?tab=)      # natal · yongshin · daeun · timing · zodiac · fengshui · ai
    ├── NatalTab                    # PillarSection · SipsinSection · JizanganSection · GongmangSection · SibiUnseongSection · SinsalSection
    ├── YongshinTab + SamjaeTab
    ├── DaeunTab + SeunTab + WolUnTab + FortuneTab
    │   └── DaeunTimeline · DaeunSeunTable · DomainBarChart · OhaengRelationDiagram
    ├── TimingTab                   # 언제가 좋을까 — 영역 칩 6 · 12칸 · 선택 달 근거/행동
    ├── ZodiacTab
    ├── FengShuiTab
    ├── AiTab                       # /kkachi/stream-report 스트리밍, ReactMarkdown 렌더
    ├── FeedbackBar                 # 👍/👎 (memberId·profileId 있을 때 전송)
    └── SajuChat                    # FAB → /chat

/chat · /compatibility/chat
└── 풀스크린 챗 (fixed inset-0)     # 헤더(← 뒤로) · 메시지 리스트(ReactMarkdown) · textarea(Enter 전송)

/compatibility
├── PersonCard (첫 번째 분)         # 프로필/직접 입력 토글
├── PersonCard (두 번째 분)
├── 관계 유형 버튼 3개 · 분석 연도 · "궁합 보기"
├── [결과] CompatibilityResult
│   ├── 종합 점수·라벨
│   ├── PillarPairDiagram · OhengPairDiagram      # 두 사주 비교
│   ├── 기둥 관계·삼합 완성·오행 보완·신살 카드
│   ├── 영역별 카드 × 4 (ScoreBar + narrative + advice)
│   └── 스트리밍 종합해석 (narrative)
└── CompatibilityChat               # FAB → /compatibility/chat

/siun
├── [비로그인] CTA
├── 프로필 전환 (is_self 우선)
├── 탭: 오늘 | 내일 | 주간
│   ├── DailyFortune.DetailView     # 총점·레벨·일진·영역별 점수·팁·날씨 배지·시운 그리드
│   └── DailyFortune.WeeklyView
└── 좋은 시간대(시운 타임라인)

/weather
├── 위치 표시 + 도시 검색 (GPS → ipapi → Seoul)
├── 일별 날씨 카드 그리드 (오행 이모지)
├── [선택 시] 시간별 예보 패널
└── [로그인 시] KkachiTip (용신 기반 오행 기운)

/palmistry
├── [idle] 촬영 가이드 + 카메라/갤러리 버튼
├── [preview] 이미지 미리보기 + 분석/다시 찍기
├── [loading] LoadingSpinner
└── [result] 오행형 카드 · 손금선 ScoreBar(감정/지능/생명) · InterpretSection × N

/profile
├── ProfileCard × N                 # 조회 ↔ 편집 모드, is_self는 "나" 뱃지 + 삭제 불가
└── [+ 추가] ProfileForm            # 10개 미만일 때만

/join
├── [Step 1] 이름 + 이메일 → POST /members → 프로필 있으면 / 로
└── [Step 2] 내 사주 등록 (is_self=true) → /

/my
├── 계정 정보 카드 + ⏻ 로그아웃
├── /profile 링크
└── 회원 탈퇴 (이메일 재입력 확인 → DELETE /members/{id})

/admin/feedback
├── 총 피드백 수 · 전체 긍정률
└── 탭별 카드 (긍정률 낮은 순, 색상 red/amber/green)
```

---

## 페이지별 화면 명세

### `/` — 홈 (피드)

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

### `/join` — 회원가입 / 로그인

```
Step 1: 이름 + 이메일 → POST /members (기존 이메일이면 기존 멤버 반환)
  → listProfiles → 있으면 /   없으면 Step 2
Step 2: 이름(pre-fill)·생년월일·시간·성별·도시(ipapi 자동) → POST /profiles (is_self: true) → /
```

**개선 포인트:** 이미 로그인된 상태에서 진입 시 redirect 없음. Step 2 폼은 `ProfileForm`과 별도 인라인 구현.

---

### `/my` — 계정 설정

**진입 조건:** 로그인 필수 (없으면 `/join` replace)

- `getMember(memberId)` 404 시 localStorage 제거 → `/join`
- 로그아웃: localStorage 제거 → `/`
- 탈퇴: 이메일 재입력 일치 → `DELETE /members/{id}` → cascade(프로필·분석·궁합·일진·피드백) → `/`

---

### `/profile` — 프로필 관리

**진입 조건:** 로그인 필수

- `listProfiles` / `createProfile` / `updateProfile`(PATCH) / `deleteProfile`
- 최대 10개 (`MAX_PROFILES`, 백엔드도 400)
- `is_self` 프로필: "나" 뱃지, 수정만 가능 (백엔드 삭제 시 409)
- 도시 기본값 ipapi 감지

---

### `/analysis` — 사주 분석

**진입 조건:** 없음 — 직접 입력은 비로그인 가능, 프로필 탭은 로그인 시 활성

| 모드 | 조건 | API |
|------|------|-----|
| 저장된 프로필 | 로그인 + 프로필 있음 (기본 선택) | `POST /members/{id}/profiles/{pid}/analyze` (캐시) |
| 직접 입력 | 기본 | `POST /kkachi/interpret` |

```
입력 → "프로필 저장" (로그인: 실제 저장 / 비로그인: 확인 단계) → "분석 시작"
  → sessionStorage kkachi_analysis_input · kkachi_analysis_name (· kkachi_profile_input)
  → ResultSlides
재진입: sessionStorage 입력값 있으면 자동 재분석
```

**ResultSlides 탭:** 상세는 `analysis/scenarios.md` 시나리오 5.

**출생시간 모름:** "모르겠어요" 선택 시 `hour_unknown` → 시주 없이 세 기둥으로 분석. 결과 상단 고지, 팔자 그리드 시주 자리 "?" 타일.

**개선 포인트:** 비로그인 직접 입력은 FeedbackBar 전송 불가(버튼만 표시).

---

### `/analysis/deep`

`router.replace("/analysis")`만 수행. 외부 링크 호환용. 삭제 시점 결정 필요.

---

### `/chat` — 까치 상담

**진입 조건:** 없음. `sessionStorage["kkachi_analysis_input"]` 없으면 안내 문구만.

- `POST /kkachi/chat` 스트리밍, 최근 10개 메시지 전송, 응답 225자 이내 규칙(시스템 프롬프트)
- BottomNav 숨김, `fixed inset-0`

---

### `/compatibility` — 궁합

**진입 조건:** 없음 (직접 입력은 비로그인 가능). 결제 게이트 없음.

```
PersonCard × 2 (프로필/직접) + 관계 유형(lover|friend|family) + 연도 → "궁합 보기"
  → 둘 다 프로필: POST /compatibility (캐시)   그 외: POST /compatibility/direct
  → CompatibilityResult + 즉시 POST /compatibility/narrative 스트리밍
  → sessionStorage kkachi_compat_input · kkachi_compat_names → CompatibilityChat FAB
```

- `?p1=&p2=` 딥링크: p1 기본 is_self, p2 기본 비-self
- 상세는 `compatibility/scenarios.md`

---

### `/siun` — 시운(時運)

**진입 조건:** 로그인 + 프로필 (비로그인은 CTA)

- `listProfiles` → is_self 우선, 프로필 전환 UI
- `getForecast(memberId, profileId, 31, today-14d)` → 과거 14일 + 미래 포함 31일 (백엔드 `days` 최대 35)
- 탭: 오늘 · 내일 · 주간(`WeeklyView`)
- 일진 카드: 총점·레벨·일진 간지(한글 변환)·영역별 점수·팁·날씨 배지·절기·손없는 날·시운 그리드(대운/세운/월운/일운 용신 여부)

---

### `/weather` — 날씨 기운

**진입 조건:** 없음

```
navigator.geolocation → 실패 시 ipapi.co → "Seoul"
→ GET /weather?city=…&days=… (lat/lon 직접 전달 가능)
```

- 로그인 시 `getDailyFortune(is_self 프로필)` → `yongshin` → KkachiTip 용신 하이라이트
- 네비게이션에 연결되어 있지 않음

**날씨→오행 매핑 (WMO):** 맑음 火 · 구름많음 土 · 흐림 金 · 안개 土 · 비/눈/소나기/뇌우 水 (木 매핑 없음)

---

### `/palmistry` — 손금

**진입 조건:** 없음. 네비 미연결.

```
idle → preview → loading → result
                        ↘ error (손 미감지 422 / 이미지 오류 400)
```

- `POST /palmistry/analyze` multipart `image`
- 결과: `hand_element`(오행형) · `hand_type_korean` · `finger_ratio`/`aspect_ratio` · `line_scores{heart,head,life}` · `blocks[]`
- 백엔드 필요 파일: `src/kkachi/resource/hand_landmarker.task` (git 미추적)

---

### `/admin/feedback` — 피드백 대시보드

**진입 조건:** 없음 (인증 미구현). 네비 미연결.

- `GET /admin/feedback/summary` → 탭별 `{total, positive, negative, positive_rate}` 긍정률 오름차순
- 탭 메타는 `ResultSlides.FEATURE_TABS`와 동일 6종

---

## 공유 컴포넌트

| 컴포넌트 | 역할 | 사용처 |
|---------|------|--------|
| BottomNav | 하단 탭바 5개 | layout |
| KkachiTip | 까치 말풍선 (`{name}님` 개인화) | 모든 결과 카드 인트로 |
| LoadingSpinner | 로딩 | 전역 |
| SectionHeader / CollapsibleSectionHeader / InlineCollapsibleHeader | 카드 헤더 3종 | 결과 탭 |
| InterpretSection | InterpretBlock[] 렌더 | 결과 탭, 손금 |
| ScoreBar / DomainBarChart | 점수 바 | 시운, 궁합, FortuneTab |
| ElementRadar / OhengAnalysis / PillarOhengGrid / PillarDetail / OhaengRelationDiagram | 오행·팔자 시각화 | NatalTab, DaeunTab |
| OhengPairDiagram / PillarPairDiagram | 두 사주 비교 | CompatibilityResult |
| DaeunTimeline / DaeunSeunTable | 대운·세운 | DaeunTab |
| DailyFortune (DetailView · WeeklyView · Panel) | 일진 패널 | /siun, 홈 |
| FeedPost | 피드 카드 레이아웃 | 홈 |
| PersonCard / ProfileCard / ProfileForm | 입력·프로필 | 궁합, 프로필 |
| ResultSlides / CompatibilityResult | 결과 오케스트레이터 | /analysis, /compatibility |
| SajuChat / CompatibilityChat | 챗 FAB | 결과 화면 |
| TermBadge / Tooltip | 용어 배지·툴팁 (glossary 연동) | 결과 탭 |

---

## 공유 상수·유틸

| 파일 | 내보내는 것 |
|------|------------|
| `lib/constants.ts` | `MEMBER_ID_KEY`, `HOUR_OPTIONS`, `hourToSiLabel()`, `INPUT_CLASS` |
| `lib/ganji.ts` | 천간·지지 표시 메타 SoT (해석 분기 금지) |
| `lib/elementColors.ts` | `ELEMENT_META`, `FORECAST_LEVEL_META`(level별 까치 이미지), `getElementInfo()` 등 |
| `lib/zodiac.ts` | 12지신 메타, `getZodiacEmoji(birth_dt)` |
| `lib/relations.ts` | `RELATION_STYLE` (나·삼합·육합·보통·원진·충 색상) |
| `lib/glossary.ts` | 용어 사전 (TermBadge) |
| `lib/location.ts` | `detectLocation()` — ipapi.co |
| `lib/api.ts` | 모든 API 호출 + 스트리밍 reader 4종 |
| `types/analysis.ts` | 전체 타입 (476 LOC, 분리 검토) |
| `components/tabs/natal/data.ts` | `STEM_PROFILE`, `SIPSIN_INFO`, `UNSEONG_INFO`, `SINSAL_INFO`(9종), `SINSAL_COMBOS` 등 만세력 표시 메타 |

---

## 브라우저 스토리지 키

| 키 | 종류 | 저장 시점 | 읽는 곳 |
|----|------|---------|--------|
| `kkachi_member_id` | localStorage | `/join` | 전역 로그인 판단 |
| `kkachi_analysis_input` | sessionStorage | `/analysis` 분석 완료 | `/analysis` 재진입, `/chat`, `AiTab` |
| `kkachi_analysis_name` | sessionStorage | `/analysis` | 위와 동일 |
| `kkachi_profile_input` | sessionStorage | `/analysis` 프로필 모드 | `ResultSlides` FeedbackBar용 profileId |
| `kkachi_compat_input` | sessionStorage | `/compatibility` 결과 | `/compatibility/chat` |
| `kkachi_compat_names` | sessionStorage | `/compatibility` 결과 | `/compatibility/chat` 헤더 |

---

## 미구현 / 개선 대기

| 우선순위 | 항목 | 대상 |
|---------|------|------|
| 높음 | `/admin/feedback` 접근 제어 | `/admin/feedback` |
| 중간 | `/weather`, `/palmistry` 네비게이션 진입점 | BottomNav 또는 홈 |
| 중간 | 손금 Otsu 임계값·운명선·신뢰도 반환 (`docs/research/palmistry_physiognomy_고도화.md`) | `/palmistry` |
| 중간 | 비로그인 직접 입력 결과의 피드백 전송 | `ResultSlides` |
| 낮음 | 홈 인라인 컴포넌트(StoryTray·FortunePost·VideoPost·WeatherPost) 파일 분리 | `app/page.tsx` |
| 낮음 | `/analysis/deep` redirect 페이지 제거 | `app/analysis/deep` |
| 낮음 | Join Step 2 → ProfileForm 재사용 | `/join` |
