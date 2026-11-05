# 별자리 상세 풀이 — 출생 차트는 사주만큼 깊게 갈 재료가 있나

2026-11-05 작성. 사용자 질문 "별자리 운세만 몇 줄 보여주는 게 아니라 우리 사주팔자처럼 자세히 보여줄 내용이 있을까?"에 답하는 문서. 2026-10-30 홈 "오늘의 별자리" 카드(`horoscope_rules.py`, 근거 `home_홈화면.md` §7)는 출생 차트 10점 중 3점(태양·달·상승)과 트랜짓 달·태양만 쓴다. 더 깊게 갈 재료·계산 가능성·비용·제약을 정리하고 ROADMAP **V10 후보**로 올린다(구현은 미정, 사용자 결정 2026-11-05).

## 0. 한 줄 결론

**있다.** 서양 점성술의 출생 차트(natal chart)는 사주 팔자와 같은 깊이의 체계이고, 지금 쓰는 `ephem`이 추가 파일 없이 10행성 황경을 다 준다(2026-11-05 확인: 수성~명왕성 1990-05-15 황경 즉시 계산). **계산은 거의 공짜, 비용은 한글 룰 문장(수백 셀)과 출생 시간 정밀도**다. 국내에 "출생 차트 × 사주"를 같이 보여주는 서비스는 확인된 바 없다.

## 1. 사주 ↔ 점성술 대응표 — 무엇을 보여줄 수 있나

| 사주 탭·개념 | 점성술 대응 | 계산 | 출생 시간 |
|---|---|---|---|
| 팔자 8글자 | **10행성의 별자리** — 태양(의지)·달(감정)·수성(생각·말)·금성(사랑·취향)·화성(추진력) + 목성(확장·운)·토성(책임·한계) + 천왕·해왕·명왕(세대) | ephem 그대로 | 불필요(달만 하루 안 이동 가능 → 기존 `uncertain`) |
| 오행 분포·없는 오행 | **4원소(불·흙·공기·물)·3양상(활동·고정·변통) 분포**, 없는 원소 | 행성 별자리 집계 | 불필요 |
| 기둥 자리(년·월·일·시 = 삶의 영역) | **12하우스**(1 나·2 재물·3 말·4 집·5 연애·6 일과 건강·7 짝·8 공유 재산·9 배움·10 직업·11 친구·12 내면) — whole-sign: 상승 별자리 = 1하우스 | 뺄셈 | **필요** |
| 합충 | **출생 행성끼리 애스펙트**(합·육각·사각·삼각·충, whole-sign) — 태양□달(의지와 감정의 긴장), 금성△화성(사랑의 리듬) 등 | 쌍 비교 | 불필요 |
| 일간 | **차트 룰러**(상승 별자리 지배 행성)의 별자리·하우스 | 표 | 필요 |
| 신살 | 역행 행성(태어날 때 수성 역행 등), 달의 북교점(삶의 방향), 삭망 출생 | 역행 = 하루 전후 황경 비교, 교점 = Meeus 평균 교점 공식 10줄 | 불필요 |
| 대운(10년) | **2차 진행법**(출생 후 1일 = 1년: 진행 달이 2.5년마다 별자리 이동, 진행 태양 30년) 또는 토성 트랜짓(2.5년/별자리, 29·58세 토성 회귀) | ephem(생일 + N일) | 불필요 |
| 세운 | 목성 트랜짓(1년/별자리, 12년 회귀) + 태양 회귀(생일 차트) | ephem, 태양 회귀는 이분법 | 하우스 매기면 필요 |
| 월운 | 화성(2달)·태양(1달) 트랜짓 | ephem | 불필요 |
| 일진 | 달 트랜짓 — **지금 홈 카드** | 있음 | — |
| 궁합 | **시너스트리**(두 차트 행성 간 애스펙트 — 태양–달·금성–화성·달–달) + 원소 궁합 | 쌍 비교 | 불필요 |

## 2. 앱 벤치마크 (2026-11-05 조사)

- 해외 앱 공통 순서: **빅3 → 행성별 별자리·하우스(목록형, Co-Star) → 애스펙트(전문 도구·CHANI 유료) → 시기(트랜짓을 "언제부터 언제까지 이런 시기" 기간 문장으로, 행성 용어 숨김 — The Pattern·TimePassages) → 궁합(카테고리 점수 + 태양–달·금성–화성 상호 애스펙트)**. Co-Star 일일 운세는 오늘 행성이 내 차트 어느 하우스를 지나는지로 삶의 영역을 고르고 Do/Don't 목록을 준다(우리 ✦/✕ 와 같은 꼴). Co-Star는 분 단위 출생 시간을 전제로 한다.
- The Pattern: Your Pattern(성격) / Bonds(관계, Time Travel) / Your Transits·Upcoming Transits(기간) / Transit Ring(주기의 어디쯤) / Cosmic Climate(모두의 흐름 — 삼재·연도 간지 대응).
- 전문 도구(Astro.com·Astro-Seek·TimePassages·CHANI): 행성 별자리·도수·하우스·애스펙트 표·가장 강한 행성이 표준. TimePassages는 트랜짓마다 시작·끝 날짜, 진행 차트·Solar Arc·생일 차트, 궁합 바이휠·합성 차트. CHANI는 **whole-sign 하우스**(우리와 같음), 무료는 행성 배치 개요만.
- **출생 시간 미상 업계 관행(CHANI 공식 가이드)**: 정오로 넣고 하우스 무시, 행성 별자리·행성 간 관계만 해석, 가능한 가장 이른·늦은 시간 두 차트로 상승이 같은지 확인. 정오 차트의 달 오차는 최대 약 6°.
- 국내(포스텔러·점신·네이버 별자리): 출생 차트(행성·하우스)를 보여준다는 자료를 못 찾음 — 태양 별자리 위주로 추정(미확인, 설치 확인 필요). 한국어 검색엔 AstroBella·Astraia 같은 해외 앱의 한국 스토어 페이지만.

## 3. 우리 쪽 제약 — 새로 확인한 것

- **12지시 입력의 2시간 블록**: 출생 시간을 12지시 중간값(축시 → 02:00)으로 저장한다(`HOUR_OPTIONS`). 상승점은 평균 2시간에 별자리 하나를 지나므로, 서울 위도에서 1975~2010 임의 날짜 400개 × 12블록을 재 보니 **블록 안에서 상승 별자리가 바뀌는 비율 89%**(`astro_adapter.positions` 블록 시작·끝 비교). 즉 **지금 홈 카드의 ↑ 칩도 절반 가까이 틀릴 수 있다**. 사주 시주는 블록 자체가 단위라 이 문제가 없다. 대책: 블록 시작·끝 두 번 계산해 다르면 "↑ 처녀 또는 천칭"(기존 `uncertain` 방식 — CHANI 관행과 동일), 하우스 해석은 그런 경우 두 가지로 보여주거나 접는다. 분 단위 입력 선택지는 별도 결정. **상세 탭 구현 여부와 무관하게 홈 카드부터 고치는 게 맞다(작은 수정).** → 2026-11-06 반영: `build_chart`가 블록 시작부터 30분 간격 5점(서울에서 상승은 한 별자리를 75분 이상 지나므로 빠짐 없음)의 상승 별자리를 `asc_signs`에 모으고, 2개 이상이면 `uncertain`에 `asc` → 홈 칩 "↑ 처녀 또는 천칭"(같은 표본 재측정: 1개 10.6% · 2개 78.4% · **3개 11.0%** — 시작·끝 두 점만 비교하면 가운데 별자리를 놓치는 경우). 하우스 해석(V10)은 `asc_signs`가 2개 이상이면 두 경우를 함께 보여주거나 접는다.
- 시간 미상 → 상승·하우스 없음(세 기둥과 같은 고지). 행성·원소·애스펙트·진행·트랜짓은 다 된다.
- 외행성 3개(천왕·해왕·명왕)는 같은 해 출생이면 같아서 "내 얘기" 느낌이 약하다 — 세대 한 줄로만.
- **문장 비용**: 행성×별자리 120 + 행성×하우스 120 + 애스펙트(개인 행성 5 + 상승, 15쌍 × 5) 75 + 진행·트랜짓 ≈ **300셀 이상**(지금 카드 30셀). 1차는 개인 행성 5개만(60 + 25셀). AI 풀이처럼 **룰 → 자료 시트 → LLM 글**로 가면 셀마다 긴 글이 아니라 한 줄 키워드면 된다(`report_builder.py` 방식).
- 규칙 유지: 외부 기사 문장 금지(스펙 §4), 화면 폰트 서브셋 한글만(행성 이름 수성·금성·화성·목성·토성은 한글 OK — 공교롭게 오행 이름이라 사주와 다리 놓기 좋지만 **해석은 섞지 않는다**), 해외 출생 시간대 미보정(v1 한계 유지).

## 4. 권고 (ROADMAP V10 후보)

- **1단계**: 분석 결과 10번째 탭 "별자리" — 출생 차트(개인 행성 5개 + 상승 격자, 원소 분포 바 = 오행 바 컴포넌트 재사용) · 애스펙트 상위 3 · 시간 있으면 하우스 3줄(연애·일·재물). 입력·세 기둥 처리·탭 인프라·`tab_view` 측정 그대로. 홈 별자리 카드 → 이 탭 링크. 코드: `astro_adapter.positions`에 행성 키 8개(`ephem.Mercury`~`Pluto`) + `horoscope_rules`에 행성·애스펙트·하우스 함수 + `AstroPort` 그대로.
- 2단계: 측정 후 `/stars` 별도 페이지(진행법·트랜짓 = 별자리 시운) / 궁합 "별자리 궁합" 탭(띠궁합 옆). 하단 메뉴 5칸이 꽉 차 있어 홈 카드·분석 탭에서 진입.
- 선행: 상승 89% 문제 수정(홈 카드 ↑ 칩 "또는" 표기) — 2026-11-06 완료.

## 참고 자료

- [Co-Star 앱스토어](https://apps.apple.com/us/app/co-star-personalized-astrology/id1264782561) · [Co-Star 사용법 (Business Insider)](https://businessinsider.in/Millennials-are-bringing-astrology-back-into-the-mainstream-with-this-popular-iPhone-app-heres-how-to-use-Co-Star-to-see-who-youre-compatible-with/Besides-your-sun-sign-your-rising-sign-and-moon-sign-are-both-considered-significant-Underneath-the-chart-you-can-find-detailed-descriptions-of-what-each-sign-says-about-your-personality-/slideshow/68929995.cms) · [Co-Star 분석 (Daily Bruin)](https://dailybruin.com/2019/07/22/the-quad-astrology-app-breaks-down-whats-written-in-the-stars-in-the-palm-of-ones-hand/) · [Co-Star AI (Vice)](https://www.vice.com/en/article/this-ai-can-write-your-horoscope)
- [The Pattern 앱스토어](https://apps.apple.com/us/app/id1071085727) · [The Pattern 구조 (stork.ai)](https://www.stork.ai/en/the-pattern)
- [CHANI — whole sign houses](https://www.chani.com/astro-education/what-whole-sign-houses-are-and-why-we-use-them) · [CHANI — 출생 시간을 모를 때](https://chani.com/astro-education/how-can-i-work-with-my-astrology-chart-if-i-dont-know-my-birth-time) · [CHANI 앱스토어](https://apps.apple.com/gb/app/id1532791252) · [The Astrology Podcast — 출생 시간 없는 차트 읽기](https://theastrologypodcast.com/2020/09/08/how-to-read-a-natal-chart-with-no-birth-time)
- [TimePassages 앱스토어](https://apps.apple.com/us/app/timepassages-astrology/id488946918) · [TimePassages 매뉴얼 (PDF)](https://www.astrograph.com/downloads/TimePassages%206%20Manual.pdf) · [Astro-Seek 소개](https://topai.tools/t/astroseek) · [astro-charts.com 원소·모드 집계 예](https://astro-charts.com/persons/chart/tyreke-evans/)
- [AstroBella (한국 스토어)](https://mwm.ai/ko/apps/astrobella-astrology-horoscope/6468093061) · [Astraia (한국 스토어)](https://mwm.ai/ko/apps/astraia-astrology/6752341734)
