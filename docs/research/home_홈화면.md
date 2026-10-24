# 홈 화면 개편 리서치 — "까치가 물어다 준 오늘"

2026-10-24. 홈(`/`)을 인스타 피드에서 아침 의식형 한 장으로 바꾸기 위한 근거. 결론과 약속은 `specs/home/index.md`, 이 문서는 왜 그렇게 정했는지.
기존 리서치와 겹치는 부분(스트릭·알림 문구·경쟁사 수익 모델)은 `retention_전략.md`·`benchmark_유사서비스.md`를 본다.

## 0. 한 줄 결론

홈은 **오늘의 나 한 덩어리를 가장 크게**(캐릭터 + 까치 말풍선의 한 문장·한 행동), 그 아래 **오늘 내 사람들**(캐릭터 얼굴 줄), 마지막에 **이어서 할 것 최대 2장**. 점수·그래프·7일 예보는 홈에서 빼고 시운으로 보낸다. 요청은 묶음 API 1회.

## 1. 지금 홈의 문제

| 문제 | 근거 |
|---|---|
| 시선이 갈 곳이 없다 | 프로필마다 같은 모양 FortunePost가 반복(`app/page.tsx` FortunePost). 프로필 4개인 회원이 로그인 홈 방문의 74%(아래 §3) — 같은 카드 4장 |
| 캐릭터가 없다 | 사주 캐릭터 20유형(V4, 여성 그림 따로)이 분석·공유 카드에만. 홈 아바타는 띠 이모지(StoryTray) |
| 무겁다 | 프로필 N개면 `listProfiles` 1 + `getForecast(7일)` N + `getDailyCompat` N−1 — 10개면 20요청. 7일을 받아 오늘(`forecast[0]`)만 쓴다 |
| 하루 루프의 입구가 아니다 | 푸시 구독 0, `daily_view` 10세션. 홈에서 시운·알림으로 가는 길이 카드 버튼 사이에 묻혀 있다 |
| 측정이 안 된다 | 홈 이벤트는 `home_view` 하나 — 홈에서 어디로 나갔는지 모른다 |

ROADMAP §2 "아침, 하루 시작"의 빠진 것("첫 화면이 점수·그래프라 그래서 뭘 하라는 거지가 안 잡힘")과 R4 목표("홈 첫 화면은 점수가 아니라 한 문장과 한 행동")가 아직 홈 구조로는 풀리지 않았다 — R4는 FortunePost 캡션만 바꿨다.

## 2. 벤치마크

| 서비스 | 홈의 중심 | 가져올 것 | 피할 것 |
|---|---|---|---|
| 포스텔러 | 추천 운세 카드 피드 + 캐릭터(릴리 등) 말풍선 | 결과를 **캐릭터 말풍선**으로 — "점쟁이의 판정"이 아니라 "친구와의 대화" | 불안 → 유료 상담으로 잇는 퍼널, 카드 고르기 피로 |
| 점신 | 점수·오각형 그래프·게이지 대시보드 | — | "결핍의 노출" — 조심할 것을 앞세워 상담으로 유도. 우리 §1 "점수·그래프" 문제와 같다 |
| Co-Star | 텍스트 섹션 + 친구는 별도 탭 | 짧고 직설적인 아침 문장(알림과 같은 말) | 섹션 라벨이 작아 신규 사용자가 **어느 게 내 운세인지** 헷갈린다(Pratt 비평) → 내 오늘은 한 덩어리, 가장 크게 |
| The Pattern | Timing(주기) · Bonds(관계) · 남의 프로필 추적 | 내가 저장한 사람의 "지금 흐름"도 보여 준다 → ② 사람 줄 | 깊은 내용은 유료 벽 |
| Finch | 살아있는 펫 + 하루 리듬(아침 체크인·저녁 대화) | 캐릭터가 **오늘 상태를 반영**, 아침·저녁 고정점, 잔소리 없이 "궁금해서" 다시 오게 | 보상 중심 습관화(일기 연구에서 초반 지지가 보상 집착으로 변했다는 보고) |
| 스트릭(Duolingo 등) | 연속 일수 | — | R4에서 "홈에 넣지 않음"으로 결정(길조 까치 톤과 손실 회피가 맞지 않음). 유지 |

**공통 교훈 — 톤.** 포스텔러·점신 비교 글은 두 앱 모두 "장난스러운 캐릭터가 불안한 사용자를 짜증 나게 하고, 빽빽한 리포트가 가볍게 온 사용자를 질리게 한다"고 지적한다. 사주까치는 길조 까치 — **반가운 소식이 먼저**, 주의는 ✕ 한 줄로만, 공포·결핍 문구는 쓰지 않는다.

## 3. 우리 데이터 (로컬·베타 DB, 2026-09-12 ~ 10-24)

표본이 작다(회원 5명, 대부분 개발·지인 사용). 방향 참고용.

| 지표 | 값 | 읽는 법 |
|---|---|---|
| `home_view` | 90건 — 비로그인 44 · 로그인 46(프로필 4개 34 · 2개 8 · 1개 4) | 홈 방문의 절반이 비로그인 → 비로그인 히어로도 같은 무게로 |
| `daily_view` | 140건 / 10세션 | 시운은 쓰는 사람만 쓴다 |
| 푸시 구독 | 0 | 알림 켜기가 시운 화면 안에만 있다 → 홈 "이어서 할 것" 첫 후보 |
| 궁합 캐시 | 3 | 저장한 사람은 있는데 궁합까지 안 간다 → 사람 줄에서 바로 궁합으로 |
| AI 풀이 캐시 | 4 | — |
| 홈 이후 행동 | 측정 안 됨 | `home_click{target}` 추가는 열린 결정 |

## 4. 코드 현황 — 스펙의 API 근거

- **캐릭터는 analyze에서만 나온다.** `ProfileService.analyze_profile`(analyses 캐시, `profile_service.py`)의 `natal.character` + `art_key`. `/daily`·`/forecast`·`ProfileResponse`엔 없다. `art_key = character_art_key(key, is_male)` → `{일간}_{강|약}` 또는 `{…}_여`(`saju_character.py:30`). 프론트 폴백은 `lib/characterArt.ts`(`charArtSrc` → 유형 그림 → 기본 까치).
- **오늘의 궁합** `GET /compatibility/daily`(`compatibility_controller.py:222`)는 요청마다 `analyze` 2회, 캐시 없음. `compute_daily_compat(natal1, natal2, today, name1, name2)`(`compatibility_daily.py:44`)가 `score`·`level`(좋음/보통/주의)·`headline`을 준다. 묶음 API는 나의 natal을 한 번만 만들고 사람마다 이 함수를 직접 부른다.
- **오늘 운세** `FortuneService.get_fortune`(fortunes 캐시) → `Fortune.headline/action/caution/total_score/level/day_element/solar_term/son_eomneun_nal`(`domain/fortune.py`).
- **"이어서 할 것"에 쓸 수 있는 상태**

| 상태 | 어디서 아는가 |
|---|---|
| 알림 꺼짐 | 클라이언트 `getPushState()`(`lib/push.ts:23`) — `off`일 때만(미지원·미설정·거부면 카드 없음) |
| 이 사람과 궁합 안 봄 | 서버 `compatibilities` 캐시 유무(pid 정렬 키, 올해) |
| 이번 주 좋은 날 | 서버 — 나의 7일 fortunes 중 `level == "좋은 날"` 첫 날 |
| AI 풀이 안 봄 | 서버 `analyses.result.ai_report` 유무 |
| 설문조사 안 함 | **알 수 없음** — 답을 저장하지 않는다(V3 "답 저장 미정"). v1 카드에서 뺀다 |

- **재사용**: `MorningBrief`(헤드라인·할 것·피할 것) · `RevealGate`(`SajuCharacterCard.tsx`, 천간 슬롯) · 실루엣(`compatibility/CompatTotal.tsx`) · `FORECAST_LEVEL_META`·`ELEMENT_META`(`lib/elementColors.ts`) · `PushSubscribeButton` · `QuickStartPost`/`AnalysisForm quick` · `ShareButton` + `createDailyShare`.
- **정리 대상**: `WeatherPost`·`HourlyRow`·`getWeather`·`weatherCity`·StoryTray `activeId` — 렌더되지 않는 코드(68b9261에서 홈 개편 때 지우려고 남김).
- **제약**: V3 "첫 화면에 설문을 두지 않는다 — 홈 퀵스타트 '30초 만에 내 사주'를 지킨다." 비로그인 히어로는 캐릭터 맛보기 + 퀵스타트 폼, 설문 없음.
- **곁가지(스펙 밖, 따로 처리)**: `POST /compatibility`(프로필 궁합)는 `/daily`와 달리 회원 소유자 검증이 없다.

## 5. 정한 방향

1. **오늘의 나(히어로)** — 일진 오행 색 바탕 + 내 캐릭터 그림 + 까치 말풍선(headline → ✦ action → ✕ caution). 점수·레벨·절기·손없는 날은 작은 배지. [오늘 시운 자세히] → `/siun`, [공유] → 시운 공유 카드.
2. **오늘 내 사람들** — 저장한 사람을 캐릭터 얼굴로 가로 줄. 얼굴 아래 이름 + 나와 오늘의 궁합(좋음/보통/주의). 누르면 그 사람과 궁합. 끝 칸 "+ 사람 추가".
3. **이어서 할 것** — 서버·클라이언트 상태로 고른 카드 최대 2장. 순서 고정.
4. **비로그인** — "30초 만에 내 캐릭터 찾기": 캐릭터 실루엣 + 맛보기 그림 몇 장 → 바로 아래 퀵스타트 폼.
5. **하지 않는 것** — 7일 예보·점수 그래프·스트릭·설문·공포 문구·프론트 해석 분기.

나중 후보(열린 결정): 레벨별 캐릭터 표정(그림 제작 필요) · 저녁(18시 이후) "내일 예고" 상태 · 홈 클릭 이벤트.

## 참고 자료

- [포스텔러 vs 점신 — 사주 열풍 속 '불안'을 파는 UX (brunch)](https://brunch.co.kr/@uibowl/403)
- [요즘 것들이 '운세'에 열광하는 이유 (brunch)](https://brunch.co.kr/@marketsun99/19)
- [Design Critique: Co–Star (Pratt IXD)](https://ixd.prattsi.org/2022/02/design-critique-co-star-iphone-app/)
- [Pattern vs Co-Star 비교 (Bustle)](https://www.bustle.com/life/pattern-co-star-astrology-apps-comparison)
- [Design Critique: The Pattern (Pratt IXD)](https://ixd.prattsi.org/2023/02/design-critique-the-pattern/)
- [How Finch Uses Gamified Widgets to Drive Retention (Deconstructor of Fun)](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- [Finch App Review — 30 Days (Headway)](https://makeheadway.com/blog/finch-app-review/)
- [Daily streak — Analytics & Retention glossary (mwm.ai)](https://mwm.ai/glossary/daily-streak)
