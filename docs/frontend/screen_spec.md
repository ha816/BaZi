# 사주까치 화면 명세

## 화면 구성 트리

```
사주까치 (kkachi.com)
│
├── / ─────────────────────── 홈 (피드)
│
├── /join ─────────────────── 회원가입 / 로그인
│
├── /my ──────────────────── 계정 설정
│
├── /profile ─────────────── 프로필 관리
│
├── /analysis ────────────── 사주 분석 (무료)
│   └── /analysis/deep ────── 심층 분석 (프리미엄)
│
├── /compatibility ───────── 궁합 분석
│
├── /fortune ─────────────── 오늘의 운세
│
├── /weather ─────────────── 날씨 기운
│
├── /palmistry ───────────── 손금 분석
│
└── /payment
    ├── /checkout ─────────── 결제
    ├── /success ──────────── 결제 성공
    └── /fail ─────────────── 결제 실패
```

---

## 컴포넌트 트리

```
app/layout.tsx
└── BottomNav                     # 하단 탭바 (7탭)

/ (홈)
├── [로그인] FortunePost × N       # 프로필별 운세 피드
│   └── DailyFortune              # 오늘/내일/주간 탭 패널
├── WeatherPost                   # 날씨 기운 피드 카드
│   └── HourlyRow × N             # 시간별 예보 행
└── VideoPost                     # 서비스 소개 영상

/analysis
├── [탭 토글] 직접 입력 | 프로필 선택
├── [direct] AnalysisForm
│   └── [결과] FreeResultSlides
│       └── PillarDetail, ElementRadar, KkachiTip
└── [profile] 프로필 선택 폼

/analysis/deep
└── ResultSlides (9개 탭)
    ├── NatalTab
    │   ├── PillarDetail
    │   ├── ElementRadar
    │   └── KkachiTip × N
    ├── PersonalityTab
    ├── ZodiacTab
    ├── SamjaeTab
    ├── DaeunTab
    │   ├── DaeunTimeline
    │   └── DomainBarChart
    ├── SeunTab
    ├── FortuneTab
    │   └── DomainBarChart
    ├── FengShuiTab
    ├── RelationshipTab
    └── AdviceTab

/compatibility
├── PersonCard (첫 번째 분)        # 프로필/직접 입력 토글
├── PersonCard (두 번째 분)
└── [결과] CompatibilityResult
    ├── ScoreRing
    ├── ScoreBar × N
    └── 영역별 점수 카드

/fortune
├── [비로그인] CTA 카드
├── [로그인+프로필없음] 프로필 등록 유도 카드
└── [로그인+프로필] 운세 결과
    ├── 총점 카드
    ├── KkachiTip (총평)
    ├── 영역별 ScoreBar × N
    ├── 사주분석 CTA 카드
    └── KkachiTip (조언)

/weather
├── 위치 표시 + 도시 검색
├── [오늘/내일/모레] 날씨 카드 그리드
├── [선택 시] 시간별 예보 패널
└── [로그인 시] KkachiTip (오행 기운)

/palmistry
├── [idle] 업로드 안내 (카메라/갤러리)
├── [preview] 이미지 미리보기 + 분석 버튼
├── [loading] 분석 중 스피너
└── [result] 분석 결과
    ├── 오행형 + 손 비율 카드
    ├── 손금선 점수 바 (감정선/지능선/생명선)
    └── InterpretSection × N

/profile
├── 프로필 목록 (ProfileCard × N)
│   ├── [조회 모드] 이름/정보 + 수정/삭제 버튼
│   └── [수정 모드] 편집 폼
└── [+ 추가] ProfileForm

/join
├── [Step 1] 이메일 + 이름 폼
└── [Step 2] 사주 정보 입력 폼

/my
├── 계정 정보 카드
├── 로그아웃 버튼
└── 회원 탈퇴 (3단계: 안내 → 이메일 확인 → 삭제)

/payment/checkout   → 토스페이먼츠 위젯
/payment/success    → 결제 확인 후 redirect
/payment/fail       → 실패 안내 + 재시도 링크
```

---

## 페이지별 화면 명세

---

### `/` — 홈 (피드)

**진입 조건:** 없음 (공개)

**인증 상태별 분기:**

| 상태 | 표시 내용 |
|------|---------|
| 비로그인 | WeatherPost + VideoPost (가입 CTA 포함) |
| 로그인 + 프로필 없음 | EmptyProfilePost + WeatherPost + VideoPost |
| 로그인 + 프로필 있음 | FortunePost × N + WeatherPost + VideoPost |

**UI 상태:**
- `loading`: 프로필/운세 API 호출 중 (각 FortunePost 내 스피너)
- `content`: 운세 카드 + 날씨 카드 + 영상

**데이터:**
- `listProfiles(memberId)` → 프로필 목록
- `getForecast(memberId, profileId, 7)` → 7일 예보 (FortunePost당 1회)
- `getWeather(city)` → 날씨 기운 (WeatherPost)

**인터랙션:**
- 각 FortunePost: "오늘/내일/주간 운세 보기 ▼" 토글 → DailyFortune 패널 펼치기
- "오늘운세 자세히 →" → `/fortune`
- "사주 분석 →" → `/analysis?profileId=…`
- WeatherPost: 오늘/내일/모레 카드 클릭 → 시간별 예보 펼치기

**개선 포인트:**
- FortunePost 컴포넌트가 `app/page.tsx` 내 인라인 선언 → `components/FortunePost.tsx` 분리 고려
- WeatherPost, VideoPost도 동일

---

### `/join` — 회원가입 / 로그인

**진입 조건:** 없음 (공개)

**2단계 플로우:**

```
Step 1: 이름 + 이메일 입력
  → POST /members (이미 존재하면 기존 반환)
  → 프로필 있으면 → /  (바로 홈)
  → 프로필 없으면 → Step 2

Step 2: 사주 정보 입력 (이름·생년월일·시간·성별·도시)
  → POST /members/{id}/profiles (is_self: true)
  → /
```

**UI 상태:**
- `loading`: API 호출 중
- `error`: 실패 메시지 인라인 표시

**데이터:**
- `createOrGetMember(name, email)` → Member
- `listProfiles(memberId)` → 프로필 존재 여부 확인
- `createProfile(memberId, data)` → Profile

**개선 포인트:**
- Step 2의 프로필 폼 → `ProfileForm` 컴포넌트 재사용 가능 (현재 별도 인라인 구현)
- 로그인 이미 된 경우 redirect 없음 → `/`로 redirect 추가 필요

---

### `/my` — 계정 설정

**진입 조건:** 로그인 필요 (미로그인 시 `/join` redirect)

**UI 상태:**
- `loading`: 계정 정보 로드 중
- `content`: 이름/이메일/가입일 표시
- `deleteConfirm`: 이메일 재입력 확인 단계

**데이터:**
- `getMember(memberId)` → Member

**인터랙션:**
- 로그아웃: `localStorage.removeItem(MEMBER_ID_KEY)` → `/`
- 회원 탈퇴 3단계: 안내 → "이메일 입력" 확인 → API 삭제 → `/join`

**개선 포인트:**
- `/profile` 링크 없음 → 프로필 관리로 이동 버튼 추가 고려
- 탈퇴 후 캐시(sessionStorage) 정리 로직 없음

---

### `/profile` — 프로필 관리

**진입 조건:** 로그인 필요 → 미로그인 시 `/join` redirect

**UI 상태:**
- `loading`: 프로필 목록 로드 중
- `empty`: 프로필 없음 (추가 안내)
- `list`: 프로필 카드 목록

**데이터:**
- `listProfiles(memberId)` → Profile[]
- `createProfile(memberId, data)` → Profile (추가)
- `updateProfile(memberId, profileId, data)` → Profile (수정)
- `deleteProfile(memberId, profileId)` → (삭제)

**인터랙션:**
- "+ 프로필 추가" → ProfileForm 인라인 표시
- ProfileCard 수정 버튼 → 카드가 편집 폼으로 전환
- 프로필 삭제: 확인 버튼 2단계 (삭제 → 삭제 확인)
- `is_self` 프로필에는 "나" 뱃지, 삭제 불가

**제약:**
- 최대 10개 (`MAX_PROFILES = 10`)
- `is_self` 프로필 1개만 허용 (신규 추가 시 is_self 미설정)

**개선 포인트:**
- is_self 지정/변경 UI 없음 → 프로필 카드에 "내 프로필로 설정" 버튼 추가 고려
- 도시 자동감지 적용 (현재 ProfileCard 수정 모드에는 미적용)

---

### `/analysis` — 사주 분석

**진입 조건:** 없음 (공개) — 로그인 시 프로필 선택 탭 활성화

**2가지 입력 모드:**

| 모드 | 조건 | UI |
|------|------|----|
| 프로필 선택 | 로그인 + 프로필 있음 | 드롭다운 + 분석연도 |
| 직접 입력 | 기본값 | AnalysisForm |

**플로우:**
```
입력 → POST /saju/basic
  → sessionStorage["kkachi_analysis_input"] 저장
  → sessionStorage["kkachi_analysis_name"] 저장
  → FreeResultSlides (무료 결과: 팔자·오행·십이지신)
  → "심층분석 시작하기" → /analysis/deep
```

**UI 상태:**
- `loading`: 분석 중 LoadingSpinner
- `error`: 인라인 에러 카드 (빨간 좌측 border)
- `result`: FreeResultSlides

**데이터:**
- `getBasicChart(input)` → BasicResult

**개선 포인트:**
- 비로그인으로 무료 분석 후 프로필 저장 CTA 미구현
- FreeResultSlides의 블러 CTA가 심층분석으로 연결되나, 크레딧 없이 `/analysis/deep` 진입 시 동작 불분명

---

### `/analysis/deep` — 심층 분석

**진입 조건:**
- `localStorage["kkachi_member_id"]` 없으면 → `/join`
- `sessionStorage["kkachi_analysis_input"]` 없으면 → `/analysis`
- `sessionStorage["kkachi_profile_input"]` 있으면 → 프로필 기반 분석

**플로우:**
```
sessionStorage 읽기
  → POST /saju/interpret OR POST /members/{id}/profiles/{pid}/analyze
  → ResultSlides (9개 탭)
```

**ResultSlides 탭 목록:**

| 탭 | 컴포넌트 | 주요 내용 |
|----|---------|---------|
| 사주팔자 | NatalTab | 팔자 그리드, 오행, 십신, 십이운성, 신살 |
| 기운 | PersonalityTab | 천간 프로필, 오행 강약도 |
| 십이지신 | ZodiacTab | 올해 띠 관계, 12지신 특성 |
| 삼재 | SamjaeTab | 삼재 여부, 기간, 대처법 |
| 대운 | DaeunTab | 10년 대운 타임라인, 현재 대운 |
| 세운 | SeunTab | 올해 세운, 충합 관계 |
| 올해운세 | FortuneTab | 영역별 운세 점수 |
| 풍수 | FengShuiTab | 팔택풍수 쿠아 번호, 행운 방위 |
| 종합조언 | AdviceTab | 전체 조언 |

**UI 상태:**
- `loading`: 분석 중 LoadingSpinner
- `error`: 인라인 에러 카드
- `result`: ResultSlides

**개선 포인트:**
- URL로 탭 상태 관리 (현재: 탭 인덱스 쿼리파라미터 `?tab=natal`)
- 분석 결과 공유 기능 (ShareCard 컴포넌트 있으나 연결 미완성)

---

### `/compatibility` — 궁합 분석

**진입 조건:** 없음 (공개) — 결과 보기는 결제 필요

**입력 플로우:**
```
두 사람 정보 입력 (PersonCard × 2)
  → 분석 버튼 클릭
  → sessionStorage["kkachi_credit_compatibility"] 없으면 → /payment/checkout
  → 결제 성공 후 크레딧 저장 → /compatibility
  → POST /compatibility/direct OR /compatibility (프로필×2일 때)
  → CompatibilityResult 표시
```

**PersonCard 모드:**
- `profile`: 저장된 프로필 드롭다운 (로그인 시 자동 활성화)
- `manual`: 이름/생년월일/시간/성별/도시 직접 입력

**UI 상태:**
- `loading`: 분석 중 LoadingSpinner
- `error`: 인라인 에러 카드
- `result`: CompatibilityResult (점수 링 + 영역별 ScoreBar)

**개선 포인트:**
- 로그인 없이도 직접 입력 분석 가능하나 결제 시 `/join` redirect — 흐름 불연속
- 결과 공유 기능 없음

---

### `/fortune` — 오늘의 운세

**진입 조건:** 없음 (공개) — 운세 보기는 로그인 + 프로필 필요

**UI 상태별 화면:**

| 상태 | 표시 |
|------|------|
| 비로그인 | CTA 카드 ("로그인하면 나만의 운세를") |
| 로그인 + 프로필 없음 | 프로필 등록 유도 카드 |
| 로그인 + 프로필 있음 | 운세 결과 |

**운세 결과 구성:**
1. 총점 카드 (숫자 + 레벨 뱃지 + 일진)
2. KkachiTip — 오늘 총평
3. `[TODO: 광고 영역]`
4. 영역별 운세 ScoreBar (직업/재물/건강/애정/학업)
5. 사주분석 CTA 카드
6. KkachiTip — 오늘의 조언

**데이터:**
- `listProfiles(memberId)` → is_self 프로필 우선 선택
- `getDailyFortune(memberId, profileId)` → DailyFortune

**개선 포인트:**
- is_self 이외 프로필 전환 UI 없음 → 프로필 선택 드롭다운 추가 고려
- 날씨 연동 (DailyFortune.weather) 표시 없음 → 날씨 기운 배지 추가 가능
- 7일 예보 탭 없음 (홈에는 있으나 /fortune에는 미구현)

---

### `/weather` — 날씨 기운

**진입 조건:** 없음 (공개)

**자동 위치 감지 플로우:**
```
GPS (navigator.geolocation) 우선
  → 실패 시 IP 위치 감지 (ipapi.co)
  → 기본값: "Seoul"
```

**UI 구성:**
1. 위치 표시 + 도시 검색 입력
2. 오늘/내일/모레 날씨 카드 (오행 + 이모지)
3. 클릭 시 시간별 예보 패널 펼치기
4. `[TODO: 광고 영역]` — 시간별 예보 하단
5. `[로그인 시]` KkachiTip — 용신 기반 오행 기운 설명

**데이터:**
- `getWeather(city)` → DailyWeather[] (7일)
- `getDailyFortune` → yongshin (용신 정보, 로그인 시)

**오행-날씨 매핑:**
| 날씨 | 오행 |
|------|------|
| 맑음 | 火 ☀️ |
| 구름 많음 | 土 ⛅ |
| 흐림 | 金 ☁️ |
| 비/눈 | 水 🌧️ |
| 강풍 | 木 💨 |

**개선 포인트:**
- 용신 하이라이트가 최고/좋아요 슬롯만 강조하지만, 비용신 슬롯에도 설명 추가 가능
- 주간 예보 (4일 이상) 뷰 없음

---

### `/palmistry` — 손금 분석

**진입 조건:** 없음 (공개)

**상태 기계:**
```
idle → preview → loading → result
                         ↘ error
```

**각 상태 UI:**

| 상태 | 화면 |
|------|------|
| idle | 손금 촬영 안내, 카메라/갤러리 버튼 |
| preview | 이미지 미리보기, "분석 시작" / "다시 찍기" |
| loading | LoadingSpinner + "손금을 분석하고 있어요" |
| result | 분석 결과 |
| error | 에러 메시지 + 다시 시도 |

**결과 구성:**
1. 오행형 카드 (木/火/土/金/水 + 한 줄 설명)
2. 손금선 점수 바
   - 감정선 (heart)
   - 지능선 (head)
   - 생명선 (life)
3. InterpretSection 해석 블록 × N

**데이터:**
- `POST /palmistry/analyze` (multipart/form-data: image)

**개선 포인트 (리서치 문서 기반):**
- 현재 Canny 고정 임계값 → Otsu 자동 임계값으로 개선 가능
- 운명선(fate line) 추가 시 콘텐츠 25% 증가
- 신뢰도(confidence) 반환 → 낮으면 "재촬영 권장" UX
- 사주 + 손금 통합 해석 (사주 정보 선택적 전달)

---

### `/payment/checkout` — 결제

**진입 조건:**
- `localStorage["kkachi_member_id"]` 필요
- 쿼리파라미터: `order_id`, `amount`, `feature_type`, `order_name`

**플로우:**
```
토스페이먼츠 위젯 로드
  → 결제 완료 → /payment/success?…
  → 결제 실패 → /payment/fail?…
```

**개선 포인트:**
- 결제 금액이 쿼리파라미터로 노출 → 서버 검증 필요 (현재 success 페이지에서 처리)

---

### `/payment/success` / `/payment/fail`

**success:**
- 서버 결제 확인 → 크레딧 부여 → 원래 기능 페이지로 redirect
- `sessionStorage["kkachi_credit_compatibility"]` 저장 후 `/compatibility`로 이동

**fail:**
- 실패 사유 표시
- 다시 시도 / 홈으로 버튼

---

## 공유 컴포넌트 정리

| 컴포넌트 | 경로 | 역할 | 주요 Props |
|---------|------|------|-----------|
| BottomNav | components/ | 하단 탭바 7개 | — |
| KkachiTip | components/ | 까치 말풍선 | `text`, `name?` |
| LoadingSpinner | components/ | 로딩 인디케이터 | — |
| SectionHeader | components/ | 섹션 헤더 + 뱃지 | `title`, `badge?` |
| ScoreBar | components/ | 진행 바 (점수) | `score`, `color?`, `max?` |
| ElementRadar | components/ | 오행 분포 바 차트 | `stats` |
| PillarDetail | components/ | 사주 4기둥 그리드 | `pillars`, `…` |
| DomainBarChart | components/ | 영역별 점수 바 | `scores` |
| DaeunTimeline | components/ | 대운 타임라인 그리드 | `daeun[]` |
| CompatibilityResult | components/ | 궁합 결과 전체 | `data`, `name1`, `name2` |
| PersonCard | components/ | 궁합 입력 카드 | `state`, `onChange`, `profiles` |
| ProfileForm | components/ | 프로필 추가 폼 | `memberId`, `onSuccess`, `onCancel` |
| ProfileCard | components/ | 프로필 카드 (수정/삭제) | `profile`, `memberId`, `…` |
| DailyFortune | components/ | 일별 운세 탭 패널 | `forecast[]` |
| FortuneSummary | components/ | 분석 요약 카드 | `data` |
| FreeResultSlides | components/ | 무료 분석 결과 슬라이드 | `data` |
| ResultSlides | components/ | 심층분석 9탭 오케스트레이터 | `data`, `name` |
| InterpretSection | components/ | 해석 블록 | `blocks[]`, `style?` |
| FeedPost | components/ | 피드 카드 레이아웃 | `name`, `avatar…` |

---

## 공유 상수·유틸 정리

| 파일 | 내보내는 것 | 설명 |
|------|------------|------|
| `lib/constants.ts` | `MEMBER_ID_KEY`, `HOUR_OPTIONS`, `INPUT_CLASS` | 전역 상수 |
| `lib/elementColors.ts` | `elementMap`, `ELEMENT_META`, `FORECAST_LEVEL_META`, `getElementInfo()`, `getElementColor()`, `ganjiToElements()` | 오행 색상/메타 |
| `lib/api.ts` | API 호출 함수 전체 | 백엔드 통신 |
| `lib/location.ts` | `detectLocation()` | IP/GPS 위치 감지 |
| `lib/glossary.ts` | 사주 용어 사전 | TermBadge 툴팁용 |
| `types/analysis.ts` | 모든 타입 정의 | TypeScript 인터페이스 |

---

## sessionStorage 키 정리

| 키 | 저장 시점 | 읽는 곳 | 용도 |
|----|---------|--------|------|
| `kkachi_analysis_input` | `/analysis` 분석 완료 | `/analysis/deep` | 심층분석 입력값 |
| `kkachi_analysis_name` | `/analysis` 분석 완료 | `/analysis/deep` | 이름 (KkachiTip 개인화) |
| `kkachi_profile_input` | `/analysis` 프로필 분석 | `/analysis/deep` | 프로필 ID/연도 |
| `kkachi_credit_compatibility` | `/payment/success` | `/compatibility` | 결제 크레딧 확인 |

---

## 미구현 / 개선 대기 항목

| 우선순위 | 항목 | 대상 화면 |
|---------|------|---------|
| 높음 | 손금 Otsu+스킨마스크 개선 | `/palmistry` |
| 높음 | 손금 운명선(fate line) 추가 | `/palmistry` |
| 높음 | 손금 신뢰도(confidence) 반환 | `/palmistry` |
| 중간 | 오늘의 운세 — 프로필 전환 드롭다운 | `/fortune` |
| 중간 | 오늘의 운세 — 날씨 기운 배지 표시 | `/fortune` |
| 중간 | 관상(얼굴형) 기능 | 신규 `/physiognomy` |
| 중간 | 광고 영역 구현 | `/fortune`, `/weather` |
| 낮음 | 분석 결과 공유 (ShareCard 연결) | `/analysis/deep` |
| 낮음 | 홈 인라인 컴포넌트 파일 분리 | `app/page.tsx` |
| 낮음 | Join Step 2 → ProfileForm 재사용 | `/join` |
