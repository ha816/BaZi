# 사주까치 제품 로드맵 — 핵심 루프 재정의

> 작성: 2026-09-12 · 갱신: 2026-10-09 (V2-2 궁합 공유 카드 칭호 · V3 일치율 판단 · 궁합/푸시 컨트롤러 테스트). 근거: `docs/research/` 4편(2026-04 벤치마크·리텐션·수익화·바이럴) 재검토 + 2026-09-12 코드 상태.
> 사용법: §4 항목을 하나씩 진행하고, 끝나면 §8 진행 현황 표와 체크박스를 갱신한다. 새 항목은 §4 끝에 추가하고 §8에 한 줄 넣는다.
> 원칙 문서: 코드 규칙은 `CLAUDE.md`, 리팩토링은 `docs/REFACTORING.md`, 화면·기능 스펙은 `specs/`(경로별 폴더, 템플릿은 `specs/README.md`).

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
| 아침 푸시 알림 (리텐션 1순위) | 없음. PWA·서비스워커·구독 테이블 모두 없음 | ⬜ 미착수 → **R4 완료**(PWA·Web Push·07:00 launchd) |
| 스트릭·배지 | 없음 | ⏸ R4에서 판단 — 브랜드 톤과 맞지 않아 넣지 않음 |
| 결과 공유 카드·카카오 공유·OG 이미지 | 없음. `html-to-image`는 미사용으로 제거됨 | ⬜ 미착수 → **V1(2026-09-28)** 공유 카드·OG 완료, 카카오 SDK 보류 |
| 친구 궁합 피드(오작교 루프) | 관계 유형·딥링크(`?p1=&p2=`)는 있음. 초대·공유·오늘의 궁합 없음 | 🟨 절반 → R5 오늘의 궁합·V1 궁합 공유 카드 완료. 초대 링크 생성 UI는 공유 카드로 대체(제거). V2-2 궁합 7탭(오늘의 궁합 탭) |
| 맥락적 페이월·코인 결제 | `/payment` 프론트 게이트 제거(5월). 백엔드 `/payments`만 잔존 | ⏸ 보류 — 팔 것(프리미엄)이 먼저 |
| 월간 리포트 | 월운 6개월(`upcoming_months`)·월별 십신 뱃지(`month_badges`)까지만 | ✅ R3 타이밍 리포트(12개월 영역별)로 흡수 완료 |
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
- [x] 운영 배치 가이드 + launchd 07:00 템플릿 (`docs/DEPLOY_PUSH.md`, `deploy/launchd/`)
- [x] 운영 적용(2026-09-18): VAPID 키 `~/kkachi/vapid.env` → backend·daily-push launchd가 source, 07:00 잡 등록, `/push/vapid-public-key` 200 확인
- [ ] 실기기: 폰에서 알림 켜기 → 다음 날 07:00 수신 확인 (사용자)
- [x] 홈 캡션 재구성 — 백엔드 `Fortune.headline/action/caution`(판정 요인 기반, 이름 포함) + `MorningBrief` 컴포넌트, 홈·시운·DetailView 3곳
- [x] 스트릭 판단 — 홈에 넣지 않음 (`useStreak` 미사용 코드는 정리됨)

### R5. 궁합 공유 링크 + 오늘의 궁합 🟡

**목표** 궁합이 두 사람을 데려오게 한다. 결과가 한 명에서 끝나지 않는다.

**변경 범위**
- 초대 링크: `POST /compatibility/invites {person1, relation_type}` → `compat_invites(id, payload JSONB, expires_at)` → `/compatibility?invite=<id>`. 상대는 자기 정보만 입력하고 양쪽이 결과를 본다. **생년월일을 URL에 싣지 않는다**(개인정보).
- OG 이미지: `app/api/og/route.tsx` (`next/og ImageResponse`) — 이름·점수·관계 유형·까치. 링크 공유 시 카카오·슬랙 미리보기가 개인화된다. 카카오 SDK 공유는 앱 키 발급 후 2차.
- 오늘의 궁합: `GET /compatibility/daily?p1&p2` — 두 프로필의 오늘 일진 관계(각 일지↔오늘 일지 충·합, 용신 일치 여부) → 점수·한 줄. 홈 `FortunePost` 하단 "오늘 ○○님과" 배지. 점수 모델은 설계 후 확정.

**관련 파일** `adapter/inner/compatibility_controller.py`, `application/compatibility_service.py`(1085 LOC — 여기 더 쌓지 말고 `compatibility_daily.py` 분리), `adapter/outer/db/models.py`, `frontend/src/app/compatibility/page.tsx`, `app/api/og/route.tsx`(신규), `app/page.tsx`

**완료 기준** 초대 링크 열람 → 결과 열람 전환을 `share_click`·`result_view{via:invite}`로 측정. 오늘의 궁합이 홈에서 프로필 2개 이상일 때 표시.

- [x] 초대 테이블(`compat_invites`, af4bd42aa9a3)·엔드포인트(`/compatibility/invites` POST/GET/resolve)·진입 흐름(`?invite=`, 상대는 자기 정보만)
- [x] OG 이미지 — V1에서 해결 (Noto Sans KR 서브셋 WOFF를 `public/fonts`에 두고 satori에 직접 주입). 카카오 SDK는 여전히 2차
- [x] 오늘의 궁합 점수 모델(`compatibility_daily.py`) → `GET /compatibility/daily`
- [x] 홈 배지 — FortunePost에 '오늘 나와 N점'(비-self 프로필)
- [x] 측정 — share_click{invite}·compat_invite_result{via:invite}

### R6. 기억과 연속성 — "까치가 한 말 다시 보기" 🟢 (R4 이후)

**목표** 지난 일진을 돌아보고 맞았는지 표시할 수 있다. 관리자 튜닝이 아니라 사용자 가치로 프레임한다.

**변경 범위**
- `fortunes` 테이블에 과거 일진이 이미 캐시됨(시운 화면이 14일 전부터 조회). `/siun`에 "지난 7일" 스와이프 + 각 날 "맞았어요? 👍/👎" → `interpret_feedbacks`에 `tab_id="daily:YYYY-MM-DD"`로 저장(스키마 변경 없음).
- `analyses` 연도별 캐시 → "지난 연도 분석 다시 보기" 링크.

- [x] 지난 7일 뷰 — `/siun` "지난주" 탭, 최근순 카드(날짜·일진·점수·아침 한 마디) → **2026-09-28 노출 보류** (탭 목록에서만 제거, 코드 유지)
- [x] 일진 피드백 — "맞았어요?" 👍/👎 → `interpret_feedbacks(tab_id="daily:YYYY-MM-DD")`, `GET …/feedback?prefix=` 로 복원, admin은 `daily` 한 줄로 롤업
- [x] 지난 연도 링크 — `GET …/analyses` → `/analysis` 프로필 폼·결과 상단 "지난 연도 다시 보기" 칩
- [ ] 측정: `daily_tab{tab:지난주}` 비율, `daily_review_rate` 👍 비율 관찰

### V1. 유입 — 결과 공유 카드 + 링크 미리보기 + 홈 퀵스타트 🟢 (2026-09-28)

**목표** 들어온 사람이 결과를 남에게 보여줄 수 있고, 링크를 받은 사람이 30초 안에 자기 것을 본다. R1~R6는 "들어온 사람"을 위한 것이었고, 이것은 "들어오게 하는" 첫 장치.

**사용자에게 보이는 변화** 결과 헤더 "공유" → 카드 이미지·링크. 받은 사람은 `/s/{id}`에서 이름·팔자·오행·한눈에 5줄을 보고 "나도 30초 만에" → 홈 퀵스타트 폼. 카톡·슬랙에 링크를 붙이면 개인화된 카드 그림이 뜬다.

**변경 범위** `shares` 테이블(5bd6657a0541, 스냅샷만·생년월일 없음·만료 없음) · `POST/GET /kkachi/shares` · `KkachiService.build_share_card` · `ShareButton` · `/s/[id]` 서버 렌더 + `opengraph-image`(satori, `public/fonts` 서브셋) · 사이트 기본 OG · `robots`(`/s/` noindex)·`sitemap` · `metadataBase`(`NEXT_PUBLIC_SITE_URL`) · `AnalysisForm quick` + 홈 `QuickStartPost`

- [x] 공유 카드 백엔드 — 스냅샷 저장·조회, 테스트 3건(생년월일 미노출·세 기둥)
- [x] 공유 버튼·패널 — 링크 공유(navigator.share/클립보드)·이미지 미리보기·이미지로 공유·저장
- [x] `/s/[id]` 랜딩 + 개인화 OG 이미지 + 사이트 기본 OG + robots/sitemap
- [x] 홈 비로그인 첫 화면 = 퀵스타트 폼 (저장 단계 없음 → `/analysis` 자동 분석)
- [x] 궁합 공유 카드 — 궁합 헤더 "궁합 공유" → `POST /compatibility/shares` → `/s/{id}`(kind=compat: 점수·라벨·두 사람 일간·영역 점수) + 전용 OG. 결과의 초대 링크 박스는 제거(초대 생성 UI 없음, `?invite=` 처리만 유지) (2026-09-28)
- [x] 궁합 결과를 분석처럼 3탭(종합·영역별·AI 해석)으로 (2026-09-28)
- [x] 시운 공유 카드 — 시운 헤더 "나의/○○의 시운 공유" → `POST …/daily/share` → `/s/{id}`(kind=daily: 일진·점수·아침 한 마디·날씨) + 전용 OG 이미지 (2026-09-28)
- [ ] 베타 반영 — `frontend/.env.production`에 `NEXT_PUBLIC_SITE_URL` 두고 `bash scripts/deploy.sh`
- [ ] 카카오톡 공유 버튼 (카카오 개발자 앱 키 발급 후) · 실기기에서 카톡 미리보기 확인
- [ ] 다음 후보: 신살 카드("나한테 역마살이…") · 사주×MBTI (§5) — 오늘의 운세 카드는 시운 공유 카드로 완료

### V2. 다음 — 공유 카드 다듬기 · 궁합 탭 고도화 · LLM 모델 교체 실험 (2026-09-28 결정)

V1로 공유 카드 3종(사주·시운·궁합)과 유입 동선이 깔렸다. 다음은 **품질**이다. 세 가지를 순서 없이, 각각 작게 시작한다.

**V2-1. 공유 카드 섬세하게 다듬기 🟢**
- 대상: `/s/[id]` 페이지 3종(`page.tsx`) + OG 이미지 3종(`OgCard.tsx`) + 공유 버튼 패널(`ShareButton.tsx`)
- 다듬을 것: 카드별 문구 톤(받는 사람이 처음 보는 문장), 글자 크기·여백, 레벨/점수 색, 일진 카드의 날씨·절기 표기, 궁합 카드의 두 사람 표기(♥·관계별 아이콘), 카카오톡 미리보기 실기기 확인, 이미지 저장 파일명
- 실기기 체크: iOS Safari 공유 시트 → 카톡 전송 → 미리보기 카드 그림·제목·설명
- [x] 사주 카드 · [x] 시운 카드 · [x] 궁합 카드 · [x] 공유 버튼 패널 (2026-10-02 — CTA 문구 3면 통일, OG 레벨 색=페이지, 점수 색 임계 65/45, 이름·배지 클립, pill 폭, 신살 칩, 관계 기호 ♥★✿, 파일명) · [ ] 실기기 카톡 미리보기 · [ ] 카카오 SDK 버튼(앱 키 발급 후)

**V2-2. 사주 궁합 페이지 탭 고도화 🟡**
- 2026-10-02: **7탭** — 한눈에(종합 궁합 + 탭별 요약) · 팔자비교(+오행 보완) · 성격·성질(신살+신강·신약) · 띠궁합 · 영역별 · 오늘의 궁합(프로필×2일 때만) · AI 해석. `CompatibilityResult.tsx`(679→~110)는 오케스트레이터, 본문은 `components/compatibility/`. 이전은 3탭
- 방향: 분석의 9탭처럼 "재미"를 주는 탭으로 쪼갠다. 후보 — 팔자 나란히 보기(기둥 비교·합충), 오행 보완(서로 채워주는 기운), 신살 만남(공통·각자), 삼합·천간합, 관계 유형별 조언(연인/친구/가족), 오늘의 궁합(일진 관계, R5 `compatibility_daily`), 언제가 좋을까(두 사람의 타이밍 교집합)
- 재료는 `CompatibilityResult`(621 LOC)에 이미 대부분 있음 → 섹션을 탭으로 분리하는 작업이 먼저, 새 계산(오늘의 궁합·타이밍 교집합)은 그다음
- 궁합 캐릭터 칭호 15종·이미지 카드 제작안: `docs/COMPAT_CHARACTER_TYPES.md` (2026-10-03) — [ ] 15장 그림(원본 `public/kkachi/compat/{key}.png` → `scripts/art_convert.sh` → `.webp`·`og/.jpg`; 인트로·캐릭터 카드·랜딩·OG 자리는 준비돼 파일만 넣으면 노출, V6 2026-10-17) · [x] 궁합 공유 카드·OG에 칭호 (2026-10-09 — `build_compat_share_card().character`, `/s/{id}` 칭호 박스·역할 칩·설명, OG 칭호 줄 + 일간 타일에 "= 광산(土)", 공유 문구에 칭호. 일간 타일 색을 주오행→일간 오행으로 고침)
- [x] 탭 구성 확정 · [x] 기존 섹션 탭 분리 · [x] 오늘의 궁합 탭 (2026-10-02) · [ ] 타이밍 교집합 탭 — 보류, 두 사람 `compute_timing` 교집합을 별도 모듈로

**V2-3. LLM 모델 교체 실험 🟢**
- 현재 기본은 **`qwen2.5:32b`**(`OLLAMA_MODEL` env, `ollama_adapter.py`). 후보 태그 확인(2026-10-02): Ollama 라이브러리에 **`qwen3.8:27b`**(2026-08 공개, Q4_K_M 18GB, thinking·vision)가 실존한다. thinking 모델이라 `/api/chat`에 `think: false`가 필요한지(생각 토큰이 스트림에 섞이는지)를 실험 첫 단계에서 본다. 이 Mac(M4 Pro 48GB)에는 `qwen2.5:32b`만 설치돼 있고 Ollama 서버는 꺼져 있음 — 실험 전 `ollama serve` + `ollama pull qwen3.8:27b`.
- 실험 방법: 코드 수정 없이 `OLLAMA_MODEL=<후보>`로 백엔드를 띄워 같은 사주 3개(`docs/llm_samples/`)로 AI 풀이·챗·궁합 해석을 뽑는다. 비교 축 — 첫 토큰 지연·전체 시간, 225자 제한 준수, 한국어만 쓰는지(한자·중국어 섞임), "사주에 따르면" 금지 규칙 준수, 카드(`summary`)와의 정합
- 결정 기준: 지연이 같거나 짧고 규칙 위반이 줄면 교체. 메모리(로컬 Mac)에서 두 모델을 동시에 못 올리므로 `keep_alive` 고려
- [ ] 후보 태그 확정·pull · [ ] 샘플 3개 비교표 · [ ] 기본값 교체 여부 결정 (`CLAUDE.md` env 표 갱신)

### V3. 내 사주 맞춰 보기 — 결과 뒤 선택형 설문 🟡 (2026-10-03 결정)

**목표** 첫 결과를 본 사람에게 "더 정확하게 맞춰 볼까요?"를 열어, 사주 예측과 실제 성향을 맞춰 보게 한다. 맞으면 "어? 진짜 맞네"가 되고, 일치율이 풀이 전체의 신뢰도를 받쳐 준다. 궁합 "이럴 때 두 분은?"(V2-2)의 한 사람 버전.

**정한 것**
- **첫 화면에 설문을 두지 않는다.** 홈 퀵스타트의 "30초 만에 내 사주"를 지킨다. 설문은 분석 결과를 본 뒤 고르는 선택 단계
- **설문으로 출생시간을 역산하지 않는다.** 시간 모름은 지금처럼 세 기둥(R2)으로 보고, 설문 답으로 시주 후보를 고르거나 추천하지 않는다
- 질문은 그 사람 사주의 십신(일간 제외 일곱 글자)마다 1문항(궁합과 같은 십신→성향 표 `docs/COMPAT_CHARACTER_TYPES.md` §5), "나는 그렇다 / 아니다 / 반반 / 모르겠어요"로 답한 뒤 한꺼번에 비교
- 결과: 풀이 신뢰도(높음·보통·낮음) + 사주 스타일(사주형·반반형·개성형) + 문항별 사주 근거

**미정** 답 저장 여부 — 행동 기록 보강은 보류 중이라 우선 저장 없이 화면 안에서만. 신뢰도를 실제로 모으려면 별도 결정

- [x] 문항 설계(한 사람용 문장 10종, `application/self_quiz.py`) · [x] 결과 화면(분석 한눈에 아래 `SelfQuizCard`) (2026-10-03) · [x] 공유 카드에 "사주 일치율" 넣을지 판단 → **넣지 않음** (2026-10-09, §5)
- 일치율을 공유 카드에 넣지 않는 이유: ① 답은 서버에 안 보내기로 한 상태(위 미정)인데 카드 스냅샷(`shares.payload`)에 넣으면 사실상 저장이 됨 ② 공유 버튼은 헤더에 있어 대개 설문 전에 눌리고, 링크는 한 번 만들면 재사용되므로 카드가 설문 결과를 못 따라감 ③ 받는 쪽은 설문 맥락 없이 "일치율 87%"를 읽을 수 없음. 답 저장을 결정하면 그때 별도 "일치율 카드"(설문 결과 화면의 버튼)로 다시 본다
- 구현 메모: 십신 10종 모두 질문(2개 이상=그렇다·1개=반반·없음=아니다로 예측), 같은 답 1점·한 칸 차이 0.5점, 일치율 80/50% 구간 신뢰도·사주형/반반형/개성형. 응답의 `self_quiz`(분석 결과 dict의 `natal.sipsin`만 써서 옛 캐시에도 붙음)
- **2026-10-13 개편 (3a38c7d · c7b5335 · bcf1280 · 8508911)** — 이름을 **설문조사**로 바꿨다
  - 자리: 분석 직후 인트로(`?step=intro`)의 [설문조사] / [내 사주 분석 보기] 두 갈래 + AI 풀이 앞 **설문조사 탭**(시작 버튼 없이 바로 문항, 인트로에서 고른 답 공유)
  - 답: **그렇다/아니다 2지선다**(반반·모르겠어요 제거). 문항은 "~편인가요?" 의문문 대신 구체적인 행동 문장형("가벼운 게임이라도 지면 \"한 판 더!\"를 외친다")
  - 예측: 개수 규칙 대신 **십신·지장간 조합 점수** — 천간 자리 가중(년8·월12·시10) + 지지 자리 가중(년8·월30·일15·시12) × 지장간 비중 + 투출 5, 신강·신약과 같은 가중. 8점 이상 = 그렇다(생년월일 300개 표본 평균 5.2개)
  - 근거: 개수·"예측했어요"를 드러내지 않고 자리·투출로("태어난 해 천간에 드러나고 지지에도 뿌리를 둔 식신(食神) 기운 — …"). 다르게 답한 문항을 위로, 근거는 다른 문항에만
  - 결과: "사주와 설문 응답의 일치율" %만 + 아래 까치가 해설 한 문장. 신뢰도·사주 스타일 라벨과 "N문항 중 N문항" 문구는 뺐다. 인트로에서 제출하면 일치율 대신 "답변 완료" — 결과는 설문조사 탭에서 공개(분석을 읽기 전에 김새지 않게, 탭을 끝까지 넘기게)

### V4. 사주 캐릭터 20유형 — 일간 × 신강/신약 🟡 (2026-10-11 결정)

**목표** MBTI처럼 "나는 ○○형"으로 기억하고 공유할 수 있는 정체성. 유입 고도화(공유)의 재료.

**정한 것**
- 유형 = **일간 10 × 신강/신약 2 = 20유형**. 중화는 두지 않는다. 일주 60개는 세부 설명용으로만 쓴다
- 강약 판정을 먼저 바꿨다(2026-10-11, b553b85). 일간을 뺀 자리별 가중치에 지장간 비중을 곱하고 월지에 왕상휴수사를 섞어 `strength_pct`(0~100, 50 이상이면 신강)를 낸다. 원점수 42를 50%로 옮긴다. 무작위 2,000명 기준 신강 47.5%·신약 52.5%이고, 기존 판정이 뒤집힌 비율은 5.6%다. 일진·궁합 캐시는 2026-10-12에 삭제했다
- 그림은 대표 직업으로 의인화한 까치다. 자연물 장면은 직감적이지 않아 버렸다. 원본 PNG와 화면용 1024px WebP를 `public/kkachi/saju_character/{일간}_{강|약}`에 둔다. Gemini 워터마크는 그대로 둔다
- 화면 표기: 유형명과 한 줄 성향, "선호하는 일 | 선호하지 않는 일"(직업명 2~3개씩, 아이콘 없음), 기운 % 게이지. 자연물 비유 이름(우뚝 선 산 등)은 유치해서 노출하지 않는다(데이터에만 남김)
- 유형표와 프롬프트: `docs/SAJU_CHARACTER_TYPES.md`(복붙용 통합 프롬프트는 같은 문서 §5, 2026-10-17 합침). 코드 표는 `application/saju_character.py`

- [x] 강약 판정 개선(`strength_pct`) · [x] 20장 그림·WebP 최적화 · [x] 분석 한눈에 탭 `SajuCharacterCard` · [x] 신강·신약 카드를 만세력 탭 십신 위로 (2026-10-12)
- [x] 2026-10-13: 카드 이름 **나의 캐릭터**, 만세력 탭 신강·신약 아래로 이동("확인하기"로 열림). 천간 슬롯 공개 연출은 분석 직후 인트로로
- [x] **사주 공유 카드(`/s/{id}`)에 캐릭터** (2026-10-16): `build_share_card()`에 `character`(key·유형명·한 줄·선호하는 일, 자연물 이름·수치 제외), 랜딩 맨 위 캐릭터 상자(webp), 미리보기 제목·공유 문구 "○○님은 든든한 수호자", CTA "나는 어떤 캐릭터일까?"
- [x] **OG 이미지에 캐릭터** (2026-10-16): `public/kkachi/saju_character/og/{key}.jpg` 512px JPEG 20장(총 1.3MB, 원본 PNG에서 생성) → `loadCharacterArt`가 키별로 읽어 캐시. 왼쪽 그림 + 유형명·한 줄·팔자 타일(작게)·선호하는 일, 오행 분포·신살은 뺌. 첫 렌더 1.0초·이후 0.06초
- [ ] 직업 목록 다듬기(사용자 검토): 선호하는 일에 남은 분야명(HR·영업·재무·투자·무역 등)을 직업명으로 정리
- [ ] (선택) 유형별 상세 풀이(강점·주의점·잘 맞는 유형) — 필요해지면

### V5. 분석 결과 — 9개 탭을 끝까지 보게 🟢 (2026-10-13)

**목표** 결과 화면이 백과사전처럼 펼쳐져 첫 탭만 보고 나가는 문제(§1-1). 탭을 하나 다 읽으면 다음 탭으로 자연스럽게 넘어가게 한다. 모바일 위주.

- [x] 분석 직후 전체 화면 인트로(`ResultIntro`, `?step=intro`) — 캐릭터 천간 슬롯 공개 → 까치 인사 → [설문조사] / [내 사주 분석 보기]. 단계는 한 페이지 안 주소(`?step=`)로, pushState라 폰 뒤로 가기로 이전 단계
- [x] 탭 끝 "다음 이야기" 카드 — 내용 미리보기 없이 흥미 유발 제목만(`FEATURE_TABS.hook`), 마지막 탭은 첫 탭으로. 탭을 바꾸면 새 탭 첫 줄로 스크롤
- [x] 탭 전환 `router.replace` → `history.replaceState` (RSC fetch 실패 시 전체 새로고침으로 결과가 사라지던 문제, 궁합 탭도)
- [x] 한눈에 탭 화면에서 제거 → 9탭, 기본 만세력. **`postnatal.summary` API는 남김** — 나중에 탭별 요약을 LLM 기본 요약으로 넘길 때 쓴다
- [x] 사주팔자 등장 연출 — 시→일→월→년 기둥이 솟고 천간·지지가 도장처럼 찍힘. 일간 심상·나의 캐릭터는 "확인하기"로 열림
- 남은 것: 실기기에서 슬롯 속도·인트로 대기·연출 시간 확인

### V6. 궁합 개선 — 분석에서 한 것을 궁합에도 🟨 (2026-10-15)

**목표** V5·V3 개편으로 분석 결과에 넣은 장치를 궁합 결과(`CompatibilityResult`)에도 맞춘다. 사용자 결정(2026-10-15): 한눈에 탭은 분석처럼 정리, "이럴 때 두 분은?" 답은 [이름1 / 이름2 / 둘 다].

- [x] **"이럴 때 두 분은?"(`ScenarioCard`)을 설문조사처럼** — 모르겠어요 빼고 3지선다, 신뢰도(높음·보통·낮음)·사람별 사주 스타일 라벨 제거 → "사주와 두 분 응답의 일치율" % + 까치 해설, 다르게 답한 문항 먼저·근거는 다른 문항에만. 예측은 스냅샷 `sipsin_score`(설문조사 `self_quiz.score_sipsin`과 같은 십신·지장간 점수)로 — 차이 5점 미만은 둘 다, 둘 다 8점 미만인 십신은 묻지 않음, 근거에 개수 미노출. 점수 없는 옛 캐시는 개수로
- [x] 탭 끝 "다음 이야기" 카드 — `NextTabCard`를 공용 컴포넌트로 빼서 분석·궁합이 같이 씀
- [x] 결과 직후 전체 화면 인트로(`CompatIntro`, `?step=intro`) — 두근두근 드럼롤 → 캐릭터 칭호·점수 → 까치 인사 → [이럴 때 두 분은? `?step=scenario`] / [궁합 분석 보기]. 인트로 문답을 제출하면 "답변 완료"만, 일치율은 "이럴 때" 탭에서
- [x] 한눈에 탭 제거 → 7탭(팔자비교·성격·성질·띠궁합·영역별·오늘의 궁합·이럴 때·AI 해석, 오늘의 궁합은 프로필×2만). 종합 점수는 영역별 탭 맨 위 `CompatScoreCard`. 탭별 한 줄(`summary`)은 API에 남김(LLM용)
- [x] 팔자비교 등장 연출 — `PillarPairDiagram animate`: 시→일→월→년 기둥마다 두 분 글자가 도장처럼 찍히고 합·충 배지가 뒤따름
- [x] **2026-10-17 분석 수준 맞추기 1차** — "이럴 때 두 분은?"을 설문조사처럼 5문항씩 페이지로(6~10문항을 고르게 나눔, 이 페이지를 다 답해야 다음) · 인트로에서만 보이던 캐릭터 칭호·역할·설명을 **두 분의 캐릭터** 카드로 팔자비교 탭 기둥 비교 다음에(인트로 건너뛰기·새로고침해도 보임) · 팔자비교의 일주 관계 3칸을 팔자 그림 아래로(사용자 지시)
- [x] **2026-10-17 그림 파이프라인** — 16장 복붙용 프롬프트(`docs/COMPAT_CHARACTER_TYPES.md` §7: 15종 + 드럼 까치), 원본 PNG → `scripts/art_convert.sh`로 화면 WebP·OG JPG, 궁합 OG에 그림 자리(`loadCompatArt`, 사주 카드 V4와 같은 왼쪽 232px). 화면·랜딩은 `compat/{key}.webp`로 통일
- [ ] (V2-2에서 이어짐) 궁합 캐릭터 15장 그림 반입(사용자, Gemini) — 원본을 `public/kkachi/compat/{key}.png`로 두고 변환 스크립트 → 파일만 넣으면 인트로·캐릭터 카드·랜딩·OG에 노출. 드럼 까치 `drum_kkachi.png`도 아직 없음 → 이모지로 대신
- 남은 것: 실기기 확인, 기존 궁합 캐시(`compatibilities`)는 `sipsin_score`가 없어 다시 계산될 때까지 개수 기준 예측

---

## 5. 보류 목록 — 지금 하지 않는 것과 이유

| 항목 | 이유 | 재검토 시점 |
|---|---|---|
| 관상(顔相), 타로 | 폭 확장. 유입은 만들어도 다시 오게 하지 못하고, §3이 없으면 같은 이유로 떠남 | R1~R5 이후 |
| 사주×MBTI 성격 카드 (`saju_combined_systems.md` 컨셉 A) | 바이럴 스파이크용. 공유 인프라(R5)가 먼저 있어야 효과 | R5 이후 바이럴 카드로 |
| 결제·페이월·코인 | 팔 것이 없다. R3 타이밍 리포트가 프리미엄 후보가 된 뒤 | R3 완료 후 |
| 전문가 상담 마켓플레이스 | 플랫폼 단계 이야기 | 미정 |
| 스트릭 손실 회피 알림 | 브랜드 톤과 충돌 가능 | R4에서 판단 |
| LLM 클라우드 전환 | 로컬 32B 지연이 실제 이탈 원인으로 확인되면 (`llm_해석엔진_전략.md §4` 비교표). 먼저 V2-3 로컬 모델 교체 실험 | V2-3 이후 |
| 피드백 기반 Interpreter 튜닝 | 사용자 지시로 보류 | 사용자 결정 |
| 설문으로 출생시간(시주) 역산·추천 | 사용자 결정(2026-10-03) — 설문은 사주를 맞춰 보는 용도로만, 시간 보정에 쓰지 않음 | 하지 않음 |
| 사주 공유 카드에 "사주 일치율" | 답 저장 안 함(V3 미정)과 충돌, 공유는 대개 설문 전에 눌림, 받는 쪽은 설문 맥락이 없음 (V3 메모) | 답 저장 여부 결정 후 별도 카드로 |

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
- ~~**도메인 키 불일치**: 연간 5개 vs 일진 4개~~ → R3에서 사용자 언어 6개(`timing_rules`)로 통일함.
- **인증 없음**: `localStorage`의 UUID가 자격증명. 2026-09-18에 프로필 `/{pid}` 경로 소유자 검증(남의 프로필 404)과 `/admin/*` 토큰 게이트(`KKACHI_ADMIN_TOKEN`)는 넣었다. UUID 추측·탈취 자체는 여전히 방어 없음 — 실서비스 전 로그인 방식 재검토.
- ~~**컨트롤러 테스트 없음**~~ → `tests/adapter/test_profile_controller.py`·`test_kkachi_controller.py`(TestClient + 가짜 포트)로 시작, 2026-10-09에 `test_compatibility_controller.py`(direct·프로필·공유·초대·오늘의 궁합 소유자 검증)·`test_push_controller.py`(VAPID 미설정 503·구독 왕복·https 검증) 추가. 남은 미커버는 풍수·십이지신 Interpreter.
- **`compatibility_service.py` 594 LOC** (2026-10-09 분리: 문장 표 `util/compatibility_meta` · 문장 생성 `compatibility_prose` · LLM 프롬프트 `compatibility_prompt`): R5·V2-2를 여기 쌓지 않았다(오늘의 궁합은 `compatibility_daily.py`; 타이밍 교집합도 별도 모듈로). 프론트 `CompatibilityResult.tsx`는 2026-10-02에 `components/compatibility/`로 분할(679→~110).

---

## 8. 진행 현황

| ID | 항목 | 난이도 | 상태 | 시작 | 완료 | 비고 |
|---|---|---|---|---|---|---|
| F0 | 측정 기반 (이벤트 로깅) | 🟢 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 0169fff. 이벤트 6종, admin 표 |
| R1 | 첫 화면 요약 카드 | 🟢 | 🟨 진행 | 2026-09-12 | | 코드 완료. 남은 것: §6 지인 5명 관찰 1회 |
| R2-1 | 출생시간 모름 고지 | 🟢 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 2차와 함께 (결과 상단 고지 + ? 타일) |
| R2-2 | 세 기둥 계산 | 🔴 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 결정: 삼주 추명(A), 강약 ±6 그대로(→ 2026-10-11 V4에서 `strength_pct`로 교체, 시주 자리 빼고 정규화), 궁합 時柱 쌍 제외, 대운 정오 기준 ±2개월 고지, 기존 프로필은 편집으로 전환 |
| R3 | 타이밍 리포트 | 🟡 | ✅ 완료 | 2026-09-12 | 2026-09-12 | 룰 기반 v1. 가중치 튜닝은 timing_view·피드백으로. 프리미엄 후보 |
| R4 | 아침 알림 + 홈 한 문장 | 🟡 | 🟨 진행 | 2026-09-12 | | 코드·운영 적용 완료(VAPID env·07:00 launchd). 남은 것: 실기기 구독·수신 확인 |
| R5 | 궁합 공유 + 오늘의 궁합 | 🟡 | ✅ 완료 | 2026-09-13 | 2026-09-28 | 오늘의 궁합·홈 배지 완료. 초대 링크 생성 UI는 V1 궁합 공유 카드로 대체(제거, `?invite=` 처리만 유지). 카카오 SDK는 V2-1 |
| R6 | 까치가 한 말 다시 보기 | 🟢 | ✅ 완료 | 2026-09-18 | 2026-09-18 | 지난주 탭·일진 👍/👎·지난 연도 칩. 스키마 변경 없음 |
| V1 | 유입 — 공유 카드(사주·시운·궁합)·OG·홈 퀵스타트 | 🟢 | 🟨 진행 | 2026-09-28 | | 코드 완료. 남은 것: 베타 반영(`NEXT_PUBLIC_SITE_URL`), 카카오 SDK(V2-1) |
| V2-1 | 공유 카드 다듬기 | 🟢 | 🟨 진행 | 2026-10-02 | | 코드 완료. 남은 것: 실기기 카톡 미리보기, 카카오 SDK(앱 키) |
| V2-2 | 궁합 페이지 탭 고도화 | 🟡 | 🟨 진행 | 2026-10-02 | | 7탭 완료(분할·한눈에·띠궁합·오늘의 궁합·성격·성질 탭·홈 배지 수정). 공유 카드·OG에 캐릭터 칭호(2026-10-09). 남은 것: 15장 그림(파일만 넣으면 노출), 타이밍 교집합 탭(보류) |
| V2-3 | LLM 모델 교체 실험 | 🟢 | ⬜ 대기 | | | 현재 `qwen2.5:32b`. 후보 태그 확인 후 `OLLAMA_MODEL`로 A/B |
| V4 | 사주 캐릭터 20유형 (일간×신강/신약) | 🟡 | 🟨 진행 | 2026-10-11 | | 강약 `strength_pct`·20장 그림 완료, 카드는 만세력 탭 "나의 캐릭터"·인트로 공개(2026-10-13), 일진·궁합 캐시 삭제(2026-10-12). 공유 카드·OG에 캐릭터(2026-10-16). 남은 것: 직업명 정리(사용자 검토) |
| V3 | 설문조사 (구 내 사주 맞춰 보기, 결과 뒤 선택형) | 🟡 | 🟨 진행 | 2026-10-03 | | 2026-10-13 개편: 인트로·별도 탭, 그렇다/아니다, 십신·지장간 점수, 일치율 + 까치 해설, 문장형 문항(8508911까지 푸시). 2026-10-17 5문항씩 2페이지로 끊음(한 화면 10문항이 길어 보여서). 공유 카드 일치율은 넣지 않기로(2026-10-09). 남은 것: 답 저장 여부(사용자 결정) |
| V5 | 분석 결과 — 9개 탭을 끝까지 보게 | 🟢 | ✅ 완료 | 2026-10-13 | 2026-10-13 | 3a38c7d. 인트로·다음 이야기·한눈에 제거(summary API 유지)·사주팔자 연출. 남은 것: 실기기 확인 |
| V6 | 궁합 개선 (V3·V5를 궁합에도) | 🟡 | 🟨 진행 | 2026-10-15 | | 이럴 때 문답 3지선다·십신 점수·일치율, 다음 이야기, 결과 인트로, 한눈에 제거, 팔자비교 연출 완료. 남은 것: 15장 그림·드럼 까치(파일), 실기기 확인 |

상태 표기: ⬜ 대기 · 🟨 진행 · ✅ 완료 · ⏸ 보류

---

## 9. 관련 문서

- `docs/research/benchmark_유사서비스.md` — 경쟁 서비스 UX·수익 모델 (2026-04)
- `docs/research/retention_전략.md` — Hook 모델, 알림 시각·문구 10종, 절기 캘린더
- `docs/research/monetization_전환전략.md` — 가격 구조·페이월 (R3 이후 참고)
- `docs/research/viral_공유전략.md` — 공유 카드 레이아웃, OG 이미지, 카카오 SDK, K-factor
- `docs/research/saju_combined_systems.md` — MBTI 결합 (보류)
- `docs/SAJU_CHARACTER_TYPES.md` — 사주 캐릭터 20유형 유형표·이미지 프롬프트(복붙용 §5) (V4)
- `docs/COMPAT_CHARACTER_TYPES.md` — 궁합 캐릭터 15종 유형표·칭호 조합·문답 규칙·이미지 카드 제작안
- `docs/research/llm_해석엔진_전략.md` — 프롬프트 패턴, 모델 비용 비교
- `CLAUDE.md` 제품 방향 · `docs/REFACTORING.md` · `specs/`(화면·기능 스펙)
