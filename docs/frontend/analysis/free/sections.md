# 무료 분석 화면 — 섹션 및 컴포넌트 정의

무료 분석(`/analysis`)에서 `POST /saju/basic` 응답을 받은 뒤 `FreeResultSlides`가 렌더한다.
세 섹션이 순서대로 표시되며, 그 아래에 심층분석 CTA(블러 미리보기)가 이어진다.

---

## 1. 사주팔자(四柱八字)

### 목적
태어난 연·월·일·시를 천간(하늘)·지지(땅) 두 글자씩 총 8자로 표현한 기본 명반을 시각화한다.

### 구성
```
SectionHeader  emoji="🌱"  title="사주팔자(四柱八字)"  badge="무료"
├── 개념 설명 박스 (아이보리 배경)
│     label: "사주팔자란?"
│     text:  연·월·일·시 → 사주(四柱), 8글자 → 팔자(八字), 오행 연결
└── PillarDetail  (basic=true)
      4기둥 × 2글자(천간+지지) 카드
```

### 컴포넌트: `PillarDetail`

| Prop | 타입 | 설명 |
|------|------|------|
| `pillars` | `string[]` | 4기둥 한자 2글자 배열 (예: `["庚寅","丙戌","甲申","丁卯"]`) |
| `dayStem` | `string` | 일간 천간 한자 (십신 기준점) |
| `basic` | `boolean` | `true`이면 기둥 레이블을 年柱/月柱/日柱/時柱로 표시 |
| `pillarElements` | `PillarElementInfo[]?` | 천간·지지 오행 정보 (없으면 내부 lookup 사용) |
| `pillarSummary` | `string?` | 기둥 아래 한 줄 요약 텍스트 |
| `highlightBranches` | `boolean` | 지지 셀 금색 배경 강조 |
| `highlightDayStem` | `boolean` | 일주 카드 금색 테두리 강조 |

#### 카드 한 칸 구조
```
┌─────────────┐
│  태어난 날   │  ← PILLAR_LABELS[i]
│   日柱       │  ← basic: 한자 기둥명 / !basic: 영역명 + TermBadge
├─────────────┤
│    하늘      │
│  갑(甲)      │  ← 천간 한글독음(한자), 오행 색상
│  나무(木)    │  ← 오행 한글(한자)
├─────────────┤
│    땅        │
│  신(申)      │  ← 지지 한글독음(한자), 오행 색상
│  쇠(金)      │  ← 오행 한글(한자)
└─────────────┘
```

#### 내부 상수
- `STEM_KOR`: 천간 10자 → 한글 독음 (`甲→갑` …)
- `BRANCH_KOR`: 지지 12자 → 한글 독음 (`子→자` …)
- `STEM_ELEMENT`: 천간 → 오행 한자
- `BRANCH_ELEMENT`: 지지 → 오행 한자

---

## 2. 오행(五行)

### 목적
사주 8글자 각각이 속한 오행(木·火·土·金·水)의 개수 분포를 가로 바 차트로 보여준다.
어느 기운이 많고 적은지를 한눈에 파악하게 한다.

### 구성
```
SectionHeader  title="오행(五行)"  badge="무료"
├── 개념 설명 박스 (아이보리 배경)
│     label: "오행이란?"
│     text:  木·火·土·金·水 설명, 사주 8자와의 연결
└── ElementRadar
      오행별 가로 바 차트 + 내러티브 텍스트
```

### 컴포넌트: `ElementRadar`

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `stats` | `Record<string, number>` | 필수 | 오행 한자 키 → 개수 (예: `{"木":3,"火":2,…}`) |
| `showNarrative` | `boolean` | `true` | 상단 요약 문장 표시 여부 |

#### 렌더 구조
```
[나무(木)] ████████░░  3
[불(火)  ] █████░░░░░  2
[흙(土)  ] ██░░░░░░░░  1
[쇠(金)  ] ██████████  4
[물(水)  ] ░░░░░░░░░░  0
```
- 바 너비: `(count / max) * 100%`
- 개수 0이면 바 숨김(opacity 0)
- 색상·배경색: `getElementInfo(key)` → `elementColors.ts`

#### 내러티브 생성 (`buildElementNarrative`)
- 가장 많은 오행 강조
- 동점이면 "A과 B의 기운이 각각 N개"
- 0인 오행이 있으면 "보완" 조언 추가
- 모두 있으면 "균형 잡힌 구성" 멘트

---

## 3. 십이지신(十二支神)

### 목적
태어난 해(年支)를 기준으로 띠 정보와 키워드를 표시한다.
`zodiac_relation`(올해 띠 관계 설명) 이후는 블러 처리해 심층분석 CTA로 연결한다.

### 구성
```
SectionHeader  title="나의 띠 · 십이지신(十二支神)"  badge="무료"
├── 띠 카드
│     emoji + 한글 띠 이름 + 지지 한자 + 키워드 뱃지 3개
└── zodiac_relation 블러 영역
      내용 blur-sm + 그라데이션 페이드 오버레이
```

### 데이터 소스
- `data.year_branch`: 年支 한자 (예: `"寅"`)
- `data.zodiac_relation`: 올해 띠 관계 설명 문자열 (서버 생성)
- `ZODIAC` 상수 (`FreeResultSlides` 내부): 지지 → `{ kor, emoji, keywords[] }`

### ZODIAC 상수 (FreeResultSlides 내부)

| 지지 | kor | emoji | keywords |
|------|-----|-------|---------|
| 子 | 쥐 | 🐭 | 영민함·민첩함·사교성 |
| 丑 | 소 | 🐂 | 성실함·인내·신뢰 |
| 寅 | 호랑이 | 🐯 | 용기·리더십·열정 |
| 卯 | 토끼 | 🐰 | 온화함·직관·예술성 |
| 辰 | 용 | 🐲 | 카리스마·야망·창의 |
| 巳 | 뱀 | 🐍 | 지혜·신중함·통찰 |
| 午 | 말 | 🐴 | 자유·활동성·독립 |
| 未 | 양 | 🐑 | 평화·온순·예술감 |
| 申 | 원숭이 | 🐒 | 기지·유머·적응력 |
| 酉 | 닭 | 🐓 | 꼼꼼함·성실·완벽주의 |
| 戌 | 개 | 🐕 | 충직함·의리·정직 |
| 亥 | 돼지 | 🐗 | 복·너그러움·성실 |

---

## 전체 렌더 흐름

```
FreeResultSlides
├── [섹션 1] 사주팔자(四柱八字)          ← PillarDetail (basic=true)
├── [섹션 2] 오행(五行)                  ← ElementRadar
├── [섹션 3] 나의 띠 · 십이지신(十二支神) ← ZODIAC 상수 + 블러
└── [CTA]    심층분석 블러 미리보기
              올해운세 / 큰흐름·대운 더미 카드 + 결제 버튼
              ShareButtons (이미지 카드 / 링크 공유)
```

## API 응답 타입 (`BasicResult`)

```ts
interface BasicResult {
  pillars: string[];          // ["庚寅","丙戌","甲申","丁卯"]
  day_stem: string;           // "甲"
  element_stats: Record<string, number>; // {"木":3,"火":2,"土":1,"金":2,"水":0}
  my_element: { name: string; meaning: string };
  year_branch: string;        // "寅"
  zodiac_relation: string;    // "2026년 병오년과 寅띠는 …"
}
```
