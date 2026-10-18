# 여러 화면이 같이 쓰는 것

| | |
|---|---|
| 상태 | 초안 — `docs/frontend`의 화면 명세·시나리오(코드를 설명한 글)를 2026-10-17에 옮겨 둔 것. 아직 스펙 형식(`specs/README.md` 템플릿: 규칙·수용 기준)으로 바꾸지 않았다 — 이 화면을 손댈 때 약속과 수용 기준으로 다시 쓴다 |
| 화면 | 공유 컴포넌트 · 공유 상수·유틸 · 브라우저 스토리지 키 · 미구현/개선 대기 (옛 screen_spec 뒷부분) |

## 공유 컴포넌트

| 컴포넌트 | 역할 | 사용처 |
|---------|------|--------|
| BottomNav | 하단 탭바 5개 | layout |
| KkachiTip | 까치 말풍선 (`{name}님` 개인화) | 모든 결과 카드 인트로 |
| LoadingSpinner | 로딩 | 전역 |
| SectionHeader / CollapsibleSectionHeader / InlineCollapsibleHeader | 카드 헤더 3종 — 상세 설명(접힘)은 폰 기준 **4줄(390px에서 약 120자) 이내**, 더 길면 까치 팁·본문으로(2026-10-18) | 결과 탭 |
| PageHeader + `.page`/`.page__inner` | 페이지 제목 줄(2xl·sm·액션) + 페이지 틀(py-8 px-4, max-w 42rem, gap 1.5rem). `.page--center`(세로 가운데, 내용이 화면보다 짧을 때만 효과)는 시운·분석·궁합·가입, `.page__inner--narrow`는 가입 폼 | 홈·챗 제외 전 페이지 |
| InterpretSection | InterpretBlock[] 렌더 | 결과 탭, 손금 |
| ScoreBar / DomainBarChart | 점수 바 | 시운, FortuneTab |
| ElementRadar / OhengAnalysis / PillarOhengGrid / PillarDetail / OhaengRelationDiagram | 오행·팔자 시각화 | NatalTab, DaeunTab |
| OhengPairDiagram / PillarPairDiagram | 두 사주 비교 | compatibility/ElementTab · PillarsTab |
| DaeunTimeline / DaeunSeunTable | 대운·세운 | DaeunTab |
| MorningBrief | 아침 한 마디(헤드라인·할 것·피할 것) | 홈, /siun |
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
| `lib/relations.ts` | `RELATION_STYLE` (나·삼합·육합·보통·원진·충 색상), `RELATION_GLYPH` (연인 ♥·친구 ★·가족 ✿ — 궁합 공유 카드 제목, OG 서브셋 기호) |
| `lib/glossary.ts` | 용어 사전 (TermBadge) |
| `lib/location.ts` | `detectLocation()` — ipapi.co |
| `lib/api.ts` | 모든 API 호출 + 스트리밍 reader 4종 |
| `types/analysis.ts` | 전체 타입 (476 LOC, 분리 검토) |
| `components/tabs/natal/data.ts` | `STEM_PROFILE`, `SIPSIN_INFO`, `UNSEONG_INFO`, `SINSAL_INFO`(9종), `SINSAL_COMBOS` 등 만세력 표시 메타 |

## 폰트

| 파일 | 역할 |
|---|---|
| `app/layout.tsx` + `app/fonts/*.woff2` | 화면 폰트 — Noto Sans KR(본문 `--font-noto-sans-kr`, 300~700)·Noto Serif KR(제목 `.font-heading`, 400~700) 가변 서브셋을 `next/font/local`로 읽는다. 상용 한글 2,350자 + 코드에 쓰인 한자 247자, 그 밖의 글자(드문 이름 음절 등)는 `fallback`의 시스템 폰트. 빌드·개발 서버가 구글 폰트를 받지 않는다(2026-10-18 — 조각 하나 타임아웃에 컴파일이 깨지던 문제). 재생성은 `app/fonts/README.md` |
| `public/fonts/*.woff` | OG 이미지(satori) 폰트 — 한글 전체 + 한자, WOFF만 읽음 |

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

## 미구현 / 개선 대기 (screen_spec에서 이관, 2026-09-12 기준 — 각 화면 스펙으로 옮기며 정리)

| 우선순위 | 항목 | 대상 |
|---------|------|------|
| 높음 | `/admin/feedback` 접근 제어 | `/admin/feedback` |
| 중간 | `/weather`, `/palmistry` 네비게이션 진입점 | BottomNav 또는 홈 |
| 중간 | 손금 Otsu 임계값·운명선·신뢰도 반환 (`docs/research/palmistry_physiognomy_고도화.md`) | `/palmistry` |
| 중간 | 비로그인 직접 입력 결과의 피드백 전송 | `ResultSlides` |
| 낮음 | 홈 인라인 컴포넌트(StoryTray·FortunePost·VideoPost·WeatherPost) 파일 분리 | `app/page.tsx` |
| 낮음 | `/analysis/deep` redirect 페이지 제거 | `app/analysis/deep` |
| 낮음 | Join Step 2 → ProfileForm 재사용 | `/join` |
