# 사주까치 제품 로드맵 — 핵심 루프 재정의

> 작성: 2026-09-12. 근거: `docs/research/` 4편(2026-04 벤치마크·리텐션·수익화·바이럴) 재검토 + 2026-09-12 코드 상태.
> 사용법: §4 항목을 하나씩 진행하고, 끝나면 §8 진행 현황 표와 체크박스를 갱신한다. 새 항목은 §4 끝에 추가하고 §8에 한 줄 넣는다.
> 원칙 문서: 코드 규칙은 `CLAUDE.md`, 리팩토링은 `docs/REFACTORING.md`, 화면 명세는 `docs/frontend/screen_spec.md`.

---

## 0. 한 줄 결론

**사주까치의 문제는 기능 부족이 아니라, 질문에 답하지 않고 자료를 보여준다는 것이다.**
계산은 정확하고 재료(날씨 오행·절기·월운·관계 유형 궁합·LLM 챗)는 경쟁사보다 많다. 그 재료가 "그래서 나는 뭘 하면 되는데?"라는 한 문장으로 모이지 않는다. 앞으로의 개선은 기능을 더하는 것이 아니라 **답의 모양**을 바꾸는 순서로 간다.

---

## 1. 진단

### 1-1. 백과사전이 된 결과 화면

- `/analysis` 결과는 만세력·용신삼재·시운·십이지신·풍수·AI 풀이 6개 탭. 첫 탭은 팔자 그리드와 십신·지장간·공망·십이운성·신살 6개 섹션.
- 4월 벤치마크는 The Pattern의 "카드 요약 → 탭 상세 → 오디오" 레이어 구조를 배우자고 했다. 실제로는 레이어를 모두 펼쳐 놓은 형태가 됐다.
- 백엔드에는 이미 요약이 있다(`PostnatalResult.core_summary`, `NatalResult.pillar_summary`, `narratives`). 화면 맨 위에 올라와 있지 않을 뿐이다.

### 1-2. 4월 계획 대비 9월 현재

| 4월 제안 | 9월 상태 | 판정 |
|---|---|---|
| 점수 근거(reason) 툴팁 | 백엔드 `domain_scores[*].reason` + `DomainBarChart`·`DailyFortune` 노출 | ✅ 완료 |
| 피드백 👍/👎 + 만족도 측정 | `FeedbackBar` → `interpret_feedbacks` → `/admin/feedback` | ✅ 인프라 완료, 튜닝 보류(사용자 결정) |
| Rule → LLM 자연어 변환 | `/kkachi/stream-report`, `/kkachi/chat`, `/compatibility/narrative`·`/chat` (Ollama) | ✅ 인프라 완료, 로컬 32B 지연은 제약 |
| 날씨 연동 일일 운세 | Open-Meteo + WMO→오행, 절기, 손없는 날, 시운 그리드 | ✅ 완료 |
| 아침 푸시 알림 (리텐션 1순위) | 없음. PWA·서비스워커·구독 테이블 모두 없음 | ⬜ 미착수 |
| 스트릭·배지 | 없음 | ⬜ 미착수 (톤 재검토 필요) |
| 결과 공유 카드·카카오 공유·OG 이미지 | 없음. `html-to-image`는 미사용으로 제거됨 | ⬜ 미착수 |
| 친구 궁합 피드(오작교 루프) | 관계 유형·딥링크(`?p1=&p2=`)는 있음. 초대·공유·오늘의 궁합 없음 | 🟨 절반 |
| 맥락적 페이월·코인 결제 | `/payment` 프론트 게이트 제거(5월). 백엔드 `/payments`만 잔존 | ⏸ 보류 — 팔 것(프리미엄)이 먼저 |
| 월간 리포트 | 월운 6개월(`upcoming_months`)·월별 십신 뱃지(`month_badges`)까지만 | 🟨 재료만 있음 → R3로 흡수 |
| 사주×MBTI 성격 카드 | 없음 | ⏸ 보류 (§5) |

### 1-3. 측정 수단이 없다

이벤트 로깅·애널리틱스가 전혀 없다. 만족도(피드백)는 있지만 행동(어디까지 봤나, 다시 왔나, 공유했나)은 모른다. **어떤 개선도 효과를 확인할 수 없으므로 F0을 R1과 같은 스프린트에 넣는다.**

---

## 2. 사용자가 사주 서비스를 찾는 세 순간

| 순간 | 마음속 질문 | 지금 사주까치 | 빠진 것 |
|---|---|---|---|
| **아침, 하루 시작** | 오늘 어떻게 지낼까 | `/siun` 오늘·내일·주간, 홈 피드 7일 예보. 날씨 오행·절기·손없는 날은 경쟁사에 없는 재료 | 알림이 없어 사용자가 스스로 와야 함. 첫 화면이 점수·그래프라 "그래서 뭘 하라는 거지"가 안 잡힘 |
| **인생 결정 앞** | 이직해도 될까, 언제가 좋을까 | 대운·세운·6개월 월운·영역 점수와 근거까지 계산됨 | **결정 형태로 보여주는 곳이 없음.** 가장 큰 공백이자 상담사가 실제로 팔고 있는 것 |
| **관계가 궁금할 때** | 우리 사이 어때 | 연인·친구·가족 유형, 스트리밍 종합해석, 상담 챗. 콘텐츠는 이미 강함 | 결과를 상대에게 보낼 방법이 없어 한 명에서 끝남. 두 프로필의 "오늘 궁합" 없음 |

---

## 3. 만족을 결정하는 네 원칙과 지금의 간극

1. **첫 화면은 답 한 줄.** 나는 이런 사람 · 올해 흐름 · 이번 달 · 오늘 · 조심할 것 하나. 6개 탭은 "더 알아보기".
2. **모르는 것을 정직하게.** 출생시간 미입력 시 현재는 조용히 정오(12:00)로 계산한다. 여덟 글자 중 두 글자를 추측으로 채우는 셈. "시간을 몰라 세 기둥으로 봤어요"라고 말하는 쪽이 신뢰를 만든다.
3. **해석은 행동으로 끝난다.** 십신·십이운성 설명은 지식이다. 사용자가 기억하는 것은 "이번 달은 계약 미루라던데"다.
4. **기억하고 이어진다.** 지난주 까치가 한 말을 다시 볼 수 없고 맞았는지 되돌아볼 수 없다. 운세의 신뢰는 작은 예측이 여러 번 맞는 경험에서 쌓인다.

---

## 4. 개선 항목 (우선순위 순)

각 항목: 목표 → 사용자에게 보이는 변화 → 변경 범위 → 관련 파일 → 완료 기준 → 체크리스트.
난이도: 🟢 1주 이내 · 🟡 2~3주 · 🔴 1개월+

### F0. 측정 기반 — 최소 이벤트 로깅 🟢 (R1과 같은 스프린트)

**목표** 개선 전후를 숫자로 비교할 수 있는 최소 장치.

**변경 범위**
- DB: `events(id, session_id, member_id?, name, props JSONB, created_at)` — `/db migrate "add_events_table"`
- 백엔드: `POST /events` (fire-and-forget, 검증만), 세션 ID는 프론트 `localStorage["kkachi_session_id"]` UUID
- 프론트: `lib/track.ts` `track(name, props)` 한 함수. 이벤트 8개만: `result_view`, `summary_view`, `tab_view{tab}`, `timing_view{domain}`, `chat_send`, `share_click{channel}`, `push_subscribe`, `daily_view`
- 조회: `/admin/feedback`에 "최근 7일 이벤트 수" 표 한 개 추가 (별도 대시보드 만들지 않음)

**완료 기준** 결과 페이지 진입 시 `result_view`가 DB에 쌓이고, 비로그인 세션도 구분된다.

- [x] events 테이블·마이그레이션 (6317ec46c55b)
- [x] `POST /events` + `track()`
- [x] 이벤트 심기 — home_view·daily_view·daily_tab·push_click·result_view·tab_view (share_click·push_subscribe는 R5·R4에서)
- [x] admin 표 (`/admin/feedback` 하단)

### R1. 결과 첫 화면을 "까치 한눈에" 요약 카드로 🟢

**목표** 결과 진입 30초 안에 다섯 줄이 읽힌다. 나 · 올해 · 이번 달 · 오늘 · 조심할 것.

**사용자에게 보이는 변화** `ResultSlides` 최상단, 탭바 위에 항상 보이는 카드 하나. 인트로 KkachiTip 포맷. 6개 탭은 그대로 두고 "더 알아보기" 성격으로 내려간다.

**변경 범위**
- 백엔드: `PostnatalResult.summary: dict` 추가 — `{me, year, month, today, caution}` 각 1문장.
  - `me` = `narratives`의 일간·오행 문장 재사용, `year` = `core_summary` 축약, `month` = `upcoming_months[0]` + `month_badges`, `today` = `compute_fortune(natal, date.today(), None, postnatal).description` 첫 문장 (직접 입력에도 오늘 한 줄 제공), `caution` = `seun_clashes[0].narrative` 또는 기신 가이드.
  - 생성 위치는 `interpreter/natal.py`에 함수 추가, 조립은 `kkachi_service.py interpret()`.
- 프론트: `ResultSlides.tsx`에 `SummaryCard` 섹션 (StickySajuBar 아래, 탭바 위). 카드 포맷은 `REFACTORING.md §4-3`.
- LLM: `report_builder.py` 인트로에 같은 다섯 줄 주입 → AI 풀이·챗의 첫 문장이 카드와 일치.

**관련 파일** `src/kkachi/domain/interpretation.py`, `application/interpreter/natal.py`, `application/kkachi_service.py`, `application/fortune_rules.py`, `frontend/src/components/ResultSlides.tsx`, `types/analysis.ts`

**완료 기준** 비로그인 직접 입력 결과에서 스크롤 없이 다섯 줄이 보인다. §6 관찰에서 "기억나는 것" 답에 카드 문장이 포함된다. `summary_view` 이벤트가 `result_view`의 95% 이상.

- [x] `summary` 5필드 백엔드 (`Summary` dataclass, `build_summary`) + analyses 캐시의 오늘 줄 갱신
- [x] `SummaryCard` 프론트 (스티키 탭바 위)
- [x] AI 풀이·챗 인트로 정합 (`report_builder._summary_section`, `build_chat_context` [한눈에])
- [x] `test_interpret.py`에 summary 테스트 2건
- [ ] §6 관찰 1회

### R2. 출생시간 모름을 정직하게 처리 🟡 (1차 🟢 / 2차 🔴)

**목표** 시간을 모르는 사용자가 "추측으로 채운 결과"를 정확한 것처럼 받지 않게 한다.

**1차 — 고지 (🟢)**
- `AnalysisInput`·프로필에 `hour_unknown: bool` 플래그(프론트·sessionStorage). "모르겠어요" 선택 시 결과 상단 배지 "출생시간 미입력 — 시주(時柱)는 정오 기준 추정이에요" + `PillarSection` 시주 칸 흐리게 + 시주 유래 십신·신살에 표시.
- `HOUR_OPTIONS`가 `lib/constants.ts`와 `AnalysisForm.tsx`에 중복 정의됨 → constants 하나로 통일 (REFACTORING §4-1).

**2차 — 세 기둥 계산 (🔴)** — 2026-09-12 결정 사항: 삼주 추명 채택. 시간대 구간 선택(C)은 후속 옵션으로 보류.
- `User.hour_unknown` → `Saju.hour: StemBranch | None`. `NatalAdapter`의 `_get_oheng/_get_sipsin/_get_sibi_unseong/_get_jizan_gan/_get_sibi_sinsal/_get_sinsal`·공망, `PostnatalAdapter` 충합, `fortune_rules`가 `pillars` 4개를 전제하므로 시주 없는 경로 추가. 강약(`_get_strength`)은 6글자 기준으로 임계 재조정.
- DB: `profiles.birth_hour_unknown` (`/db migrate`), `ProfileCreateRequest/Response`, `ProfileModel`. `analyses` 캐시 키는 (profile_id, year)라 플래그 변경 시 재계산 필요 → 캐시 무효화 규칙.
- 프론트 입력 3곳(`AnalysisForm`, `ProfileForm`, `join`) + `PersonCard`(궁합).

**관련 파일** `domain/natal.py Saju`, `domain/user.py`, `adapter/outer/natal_adapter.py`, `postnatal_adapter.py`, `application/fortune_rules.py`, `adapter/outer/db/models.py`, `adapter/inner/profile_controller.py`, 프론트 폼 4개, `tabs/natal/PillarSection.tsx`

**완료 기준** 1차: 배지·흐림 표시. 2차: 시간 모름 입력 시 팔자 6글자, 십신·신살 목록에 시주 항목 없음, 55개 테스트 + 3주 테스트 통과, `alembic check` 드리프트 0.

- [x] 고지 — 결과 상단 세 기둥 안내 + 팔자 그리드 시주 자리 "?" 타일 (1차 '정오 추정 배지'는 건너뛰고 바로 2차로)
- [x] `HOUR_OPTIONS` 단일화 (`AnalysisForm` 로컬 사본 제거)
- [x] `Saju.hour` optional → `pillars` 3개, 오행·십신·운성·신살·공망·충합 자동 6글자 기준. 궁합은 時柱 쌍 제외
- [x] `profiles.birth_hour_unknown` (8c34a7ac4f2a) · 프로필 수정 시 analyses·fortunes 캐시 삭제
- [x] 3주 테스트 6건 (`tests/adapter/test_three_pillars.py`, 궁합 1건)

### R3. 타이밍 리포트 — "언제가 좋을까" 🟡

**목표** 영역 하나를 고르면 앞으로 12개월이 좋은 달·보통·피할 달로 색칠되고, 각 달의 근거 한 줄과 행동 한 줄이 붙는다. 상담사가 실제로 파는 것이고, 이후 프리미엄의 유일한 후보.

**사용자에게 보이는 변화** `ResultSlides`에 탭 `timing` "언제가 좋을까". 영역 칩 6개 → 12칸 그리드 → 달 클릭 시 근거·행동. 챗에서 "이번 달 이직 어때?"에 같은 표로 답한다.

**변경 범위**
- 도메인 키 통일. 현재 연간은 5개(재물운·관록운·학문운·재능운·인연운, `interpreter/fortune.py DOMAIN_MAP`), 일진은 4개(재물·연애·직업·건강, `fortune_rules.py`). 사용자 언어 6개로 매핑 표를 정의한다:
  | 사용자 영역 | 연간 키 | 일진 키 | 가중 십신 |
  |---|---|---|---|
  | 이직·직업 | 관록운 | 직업 | 정관·편관 |
  | 연애·결혼 | 인연운 | 연애 | 정재·편재(남)/정관·편관(여) + 일지 합 |
  | 이사·계약 | 관록운+재물운 | 직업 | 역마·충 회피, 인성 |
  | 시험·공부 | 학문운 | — | 정인·편인 |
  | 투자·재물 | 재물운 | 재물 | 정재·편재 |
  | 건강 | — | 건강 | 기신 회피, 용신 |
- 백엔드: `PostnatalAdapter._get_upcoming_months(count=6)` → 12 (사용처 8곳: `natal.month_badges`, `narrative`, `report_builder`, `fortune_rules wol_ganji=[0]`, `kkachi_service`). 월별 영역 점수 `_get_month_domain_scores(month_ganji, seun, daeun)` 신설 — 연간 `_get_domain_scores` 로직에 월 십신 가중 + 용신 월 가산 + 일지 충 감산. 결과 `PostnatalResult.timing: dict[str, list[dict]]` = `{영역: [{month, ganji, score, level, reason, tip}]}`.
- 챗: `KkachiService.build_chat_context`에 12개월 표 주입.
- 프론트: `tabs/TimingTab.tsx`, `FEATURE_TABS`에 추가, `types/analysis.ts`.

**관련 파일** `adapter/outer/postnatal_adapter.py`, `application/interpreter/fortune.py`, `application/interpreter/natal.py`, `domain/interpretation.py`, `application/kkachi_service.py`, `frontend/src/components/tabs/TimingTab.tsx`(신규), `ResultSlides.tsx`

**완료 기준** 6개 영역 × 12개월 응답, `reason`이 빈 문자열 없음, 월별 점수 테스트(범위·용신 월 가산·충 월 감산) 추가, `timing_view` 이벤트가 `result_view`의 30% 이상.

- [x] 도메인 매핑 확정 → `application/timing_rules.py` `_DOMAIN_SIPSIN`(영역×십신 가중) + 배우자 성(남 재성·여 관성) + 용신/기신 ±10/8 + 육합/충 + 역마·도화·문창
- [x] `upcoming_months` 12개월 (리포트 월운 섹션은 6개월만 유지, WolUnTab은 4개월)
- [x] `compute_timing` → `PostnatalResult.timing` {영역: 12×{score, level(좋음≥62/피할≤42), reason, tip}}
- [x] `TimingTab` — 영역 칩 6 · 12칸 · 선택 달 근거/행동 · 한 줄 요약. 탭 id `timing`
- [x] 챗 컨텍스트 `[언제가 좋을까]` + 리포트 섹션 (`timing_digest`)
- [x] 테스트 5건 (형태·영역 가중·용신·충 감점·배우자 성)

### R4. 매일 루프 닫기 — 아침 알림 + 홈 한 문장 🟡

**목표** 사용자가 오지 않아도 까치가 간다. 홈 첫 화면은 점수가 아니라 한 문장과 한 행동.

**변경 범위**
- PWA: `app/manifest.ts`, `public/sw.js`(수동, 라이브러리 없이), iOS 홈 추가 안내 배너.
- 푸시: VAPID 키(env `KKACHI_VAPID_*`), `push_subscriptions(id, member_id, endpoint, p256dh, auth, created_at)`, `POST/DELETE /members/{id}/push-subscriptions`, 발송 `scripts/send_daily_push.py` (cron 07:00, `is_self` 프로필 기준 `compute_fortune` → 문구 → pywebpush). 문구 템플릿은 `docs/research/retention_전략.md §7` 10종에서 시작, 점수대 × 날씨 오행 매트릭스.
- 홈: `app/page.tsx FortunePost` 캡션을 `description` 첫 문장 + `tips[0]`으로, 점수·레벨은 보조 배지로.
- 스트릭: 리서치는 강력 추천했지만 게이미피케이션 톤이 "길조 까치" 브랜드와 맞는지 먼저 판단. 넣더라도 `localStorage` 기반 연속 표시만, 손실 회피 알림은 보류.

**관련 파일** `frontend/src/app/manifest.ts`(신규), `public/sw.js`(신규), `app/page.tsx`, `adapter/outer/db/models.py`, `adapter/inner/member_controller.py` 또는 신규 `push_controller.py`, `scripts/send_daily_push.py`(신규), `docker-compose.yml`(cron 컨테이너 여부)

**완료 기준** 구독한 사용자에게 07:00 알림 1건, 클릭 → `/siun`. `push_subscribe` 이벤트 기준 구독률과 알림 후 `daily_view` 비율 측정.

- [x] PWA manifest·sw (`app/manifest.ts`, `public/sw.js`, icon-192/512)
- [x] 구독 테이블·엔드포인트 (`push_subscriptions`, `/push/*`, `PushSubscribeButton`)
- [x] 발송 스크립트 (`scripts/send_daily_push.py`, `POST /admin/push/send-daily` dry-run) — 문구는 아침 한 마디 재사용, 별도 매트릭스는 보류
- [ ] 운영 스케줄 등록 (cron/launchd 07:00) + HTTPS 환경에서 실기기 수신 확인
- [x] 홈 캡션 재구성 — 백엔드 `Fortune.headline/action/caution`(판정 요인 기반, 이름 포함) + `MorningBrief` 컴포넌트, 홈·시운·DetailView 3곳
- [x] 스트릭 판단 — 홈에 넣지 않음 (기존 `useStreak`는 미사용 코드, 정리 후보)

### R5. 궁합 공유 링크 + 오늘의 궁합 🟡

**목표** 궁합이 두 사람을 데려오게 한다. 결과가 한 명에서 끝나지 않는다.

**변경 범위**
- 초대 링크: `POST /compatibility/invites {person1, relation_type}` → `compat_invites(id, payload JSONB, expires_at)` → `/compatibility?invite=<id>`. 상대는 자기 정보만 입력하고 양쪽이 결과를 본다. **생년월일을 URL에 싣지 않는다**(개인정보).
- OG 이미지: `app/api/og/route.tsx` (`next/og ImageResponse`) — 이름·점수·관계 유형·까치. 링크 공유 시 카카오·슬랙 미리보기가 개인화된다. 카카오 SDK 공유는 앱 키 발급 후 2차.
- 오늘의 궁합: `GET /compatibility/daily?p1&p2` — 두 프로필의 오늘 일진 관계(각 일지↔오늘 일지 충·합, 용신 일치 여부) → 점수·한 줄. 홈 `FortunePost` 하단 "오늘 ○○님과" 배지. 점수 모델은 설계 후 확정.

**관련 파일** `adapter/inner/compatibility_controller.py`, `application/compatibility_service.py`(1085 LOC — 여기 더 쌓지 말고 `compatibility_daily.py` 분리), `adapter/outer/db/models.py`, `frontend/src/app/compatibility/page.tsx`, `app/api/og/route.tsx`(신규), `app/page.tsx`

**완료 기준** 초대 링크 열람 → 결과 열람 전환을 `share_click`·`result_view{via:invite}`로 측정. 오늘의 궁합이 홈에서 프로필 2개 이상일 때 표시.

- [ ] 초대 테이블·엔드포인트·진입 흐름
- [ ] OG 이미지
- [ ] 오늘의 궁합 점수 모델 설계 → 구현
- [ ] 홈 배지

### R6. 기억과 연속성 — "까치가 한 말 다시 보기" 🟢 (R4 이후)

**목표** 지난 일진을 돌아보고 맞았는지 표시할 수 있다. 관리자 튜닝이 아니라 사용자 가치로 프레임한다.

**변경 범위**
- `fortunes` 테이블에 과거 일진이 이미 캐시됨(시운 화면이 14일 전부터 조회). `/siun`에 "지난 7일" 스와이프 + 각 날 "맞았어요? 👍/👎" → `interpret_feedbacks`에 `tab_id="daily:YYYY-MM-DD"`로 저장(스키마 변경 없음).
- `analyses` 연도별 캐시 → "지난 연도 분석 다시 보기" 링크.

- [ ] 지난 7일 뷰
- [ ] 일진 피드백
- [ ] 지난 연도 링크

---

## 5. 보류 목록 — 지금 하지 않는 것과 이유

| 항목 | 이유 | 재검토 시점 |
|---|---|---|
| 관상(顔相), 타로 | 폭 확장. 유입은 만들어도 다시 오게 하지 못하고, §3이 없으면 같은 이유로 떠남 | R1~R5 이후 |
| 사주×MBTI 성격 카드 (`saju_combined_systems.md` 컨셉 A) | 바이럴 스파이크용. 공유 인프라(R5)가 먼저 있어야 효과 | R5 이후 바이럴 카드로 |
| 결제·페이월·코인 | 팔 것이 없다. R3 타이밍 리포트가 프리미엄 후보가 된 뒤 | R3 완료 후 |
| 전문가 상담 마켓플레이스 | 플랫폼 단계 이야기 | 미정 |
| 스트릭 손실 회피 알림 | 브랜드 톤과 충돌 가능 | R4에서 판단 |
| LLM 클라우드 전환 | 로컬 32B 지연이 실제 이탈 원인으로 확인되면 (`llm_해석엔진_전략.md §4` 비교표) | R1 이후 측정 후 |
| 피드백 기반 Interpreter 튜닝 | 사용자 지시로 보류 | 사용자 결정 |

---

## 6. 검증 방법 — 코드보다 먼저

지인 5명. 지금 앱으로 분석을 보게 하고(관찰만, 설명 금지), **다음 날** 세 가지만 묻는다.

1. 어제 본 것 중 기억나는 게 뭐예요?
2. 그래서 뭔가 했거나 안 한 게 있어요?
3. 다시 들어가 볼 이유가 있다면 뭐예요?

기록 표: 이름(가명) | 기억 | 행동 | 재방문 이유 | 관찰 중 막힌 곳. R1 전후로 각 1회. 답에 요약 카드 문장이 나오면 R1이 맞은 것이고, "언제"류 질문이 나오면 R3의 근거다.

---

## 7. 알려진 제약 (로드맵과 함께 풀어야 하는 것)

- **일진 문장 품질**: 아침 한 마디는 Rule 기반 템플릿(요인 10종). 표현이 반복되면 요인별 문장 변형을 늘리거나 LLM 변환(짧은 블록 → Haiku급) 검토.
- **LLM 지연**: Ollama `qwen2.5:32b` 로컬. 첫 토큰까지 수 초, 225자 제한. R1의 카드는 Rule 엔진 문장으로 만들어 LLM 없이도 즉시 보이게 한다.
- **도메인 키 불일치**: 연간 5개 vs 일진 4개. R3에서 사용자 언어 6개로 통일하며 함께 정리.
- **인증 없음**: `localStorage`의 UUID가 자격증명, 프로필 소유자 검증 없음(IDOR), `/admin/feedback` 무인증. R4(푸시 구독)·R5(초대) 전에 최소 소유자 검증은 넣어야 한다. 기술 부채 목록은 세션 메모·`CLAUDE.md` 알려진 이슈 참고.
- **컨트롤러 테스트 없음**: R1~R5는 모두 엔드포인트를 바꾸므로 FastAPI TestClient + 가짜 포트 테스트를 R1에서 시작한다.
- **`compatibility_service.py` 1085 LOC**: R5를 여기 쌓지 않는다.

---

## 8. 진행 현황

| ID | 항목 | 난이도 | 상태 | 시작 | 완료 | 비고 |
|---|---|---|---|---|---|---|
| F0 | 측정 기반 (이벤트 로깅) | 🟢 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 0169fff. 이벤트 6종, admin 표 |
| R1 | 첫 화면 요약 카드 | 🟢 | 🟨 진행 | 2026-09-12 | | 코드 완료. 남은 것: §6 지인 5명 관찰 1회 |
| R2-1 | 출생시간 모름 고지 | 🟢 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 2차와 함께 (결과 상단 고지 + ? 타일) |
| R2-2 | 세 기둥 계산 | 🔴 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 결정: 삼주 추명(A), 강약 ±6 그대로, 궁합 時柱 쌍 제외, 대운 정오 기준 ±2개월 고지, 기존 프로필은 편집으로 전환 |
| R3 | 타이밍 리포트 | 🟡 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 룰 기반 v1. 가중치 튜닝은 timing_view·피드백으로. 프리미엄 후보 |
| R4 | 아침 알림 + 홈 한 문장 | 🟡 | 🟨 진행 | 2026-09-12 | | 한 문장·알림 코드 완료. 남은 것: VAPID 키 운영 배치, 07:00 스케줄 등록, 실기기 수신 확인 |
| R5 | 궁합 공유 + 오늘의 궁합 | 🟡 | ⬜ 대기 | | | |
| R6 | 까치가 한 말 다시 보기 | 🟢 | ⬜ 대기 | | | R4 이후 |

상태 표기: ⬜ 대기 · 🟨 진행 · ✅ 완료 · ⏸ 보류

---

## 9. 관련 문서

- `docs/research/benchmark_유사서비스.md` — 경쟁 서비스 UX·수익 모델 (2026-04)
- `docs/research/retention_전략.md` — Hook 모델, 알림 시각·문구 10종, 절기 캘린더
- `docs/research/monetization_전환전략.md` — 가격 구조·페이월 (R3 이후 참고)
- `docs/research/viral_공유전략.md` — 공유 카드 레이아웃, OG 이미지, 카카오 SDK, K-factor
- `docs/research/saju_combined_systems.md` — MBTI 결합 (보류)
- `docs/research/llm_해석엔진_전략.md` — 프롬프트 패턴, 모델 비용 비교
- `CLAUDE.md` 제품 방향 · `docs/REFACTORING.md` · `docs/frontend/screen_spec.md`
