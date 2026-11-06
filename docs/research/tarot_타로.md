# 타로 — 사주까치에 넣을 것인가, 넣는다면 어떤 모양인가

2026-11-05 작성. 사용자 질문 "타로로 점을 봐주는 서비스도 있을 것 같은데 우리 쪽에 추가해 보면 어떨까? 리서치 해봐줘"에 답하는 문서. `docs/ROADMAP.md §5 보류 목록`에 "관상·타로 — 폭 확장, 유입은 만들어도 다시 오게 하지 못함, R1~R5 이후 재검토"로 묶여 있던 항목을 R1~R5가 끝난 시점에 다시 본다. 결과는 ROADMAP **V9**(§4)와 `specs/tarot/index.md`. 같은 날 쓴 `astrology_출생차트.md`(별자리 상세)와 짝.

웹 조사는 2026-11-05 검색·공개 페이지 열람으로만 했다(앱 내부 화면·유료 영역은 직접 확인 못 함, 확인 못 한 것은 "미확인"으로 적음). 숫자·주장마다 출처는 맨 아래 참고 자료.

## 0. 한 줄 결론

**넣되, "또 하나의 점"이 아니라 질문 → 카드 → 한 줄 답의 그릇으로 넣고, 돌아올 이유는 "오늘의 타로카드 한 장"(사람·날짜 고정, 뒤집기)이 만든다.** 사주까치만 할 수 있는 것은 카드 옆에 일진·용신·대운을 한 줄로 놓는 것 — 카드가 주인공, 사주는 배경. 국내 앱은 전부 사주와 타로를 **따로** 두고 있어("사주에 맞는 타로 해석"을 표방하는 건 마이타로 하나, 로직 비공개) 이 자리는 비어 있다.

## 1. 왜 지금 다시 보나 — §5 보류 사유에 대한 답

보류 사유는 "유입은 만들어도 다시 오게 하지 못한다"였다. 답은 두 가지다.

1. 타로는 ROADMAP §0이 말하는 **"질문에 답하는 모양"** 그 자체다(질문 → 카드 → 답). 사주 결과 화면이 백과사전이 되는 문제를 타로는 구조적으로 겪지 않는다.
2. 다시 오게 하는 것은 타로 자체가 아니라 **데일리 카드(하루 1회 고정 의식)와 저널**이다. 국내외 앱이 예외 없이 "무료 데일리 1장 + 정시 푸시"를 기본으로 갖춘 이유. 홈 V8 "까치가 물어다 준 오늘"에 얹으면 아침 의식 한 장이 늘어난다. 그래서 V9-1은 데일리 카드만 먼저 만들고 2주 재방문 수치로 V9-2(질문 타로) 진입을 결정한다(§9-7).

## 2. 시장 신호

- **운세 앱 규모**(모바일인덱스): 점신 MAU 2025-01 113만(3년 내 최고) → 2026-01 약 87만(2030 비중 65.6%), 포스텔러 약 65만(2030 57%). 점신 누적 다운로드 1,700만, 운영사 테크랩스 2023년 매출 830억·영업이익 100억. 포스텔러 가입자 750만(스토어 소개는 누적 900만).
- **AI로의 이동**: 2026-03 MAU 상위 10개 운세 앱 중 6개가 AI 기능 탑재, 뤼튼 AI 사주 '플롯' 리포트 18만 건(두 수치는 검색 요약만 확인, 원문 깨짐 — 미검증). 다수 앱이 자체 모델이 아니라 GPT·Claude API + "A4 서너 장 분량 프롬프트"(아주경제).
- **MZ 타로 열풍**: 타로 민간자격 2018년 76개 → 2025-08 470개(6배), 2024년 응시자 2,660명. 종로 타로 상담사 "손님 10명 중 7명이 2030". 네이버 엑스퍼트 '운세·타로·작명' 등록 19,065건(입시 1,002건). 타로 상담 10분 5,000~10,000원, 유명 점집 기본 5만 원 이상.
- **이용 경험**(엠브레인 2022): 운세 서비스 이용 경험 84.5%. 대면 이용처 유명 점집 24% · 타로 점집 18.9% · 사주카페 17.9%.
- 타로카페 점포 수 공식 통계는 찾지 못함.

## 3. 국내 서비스 비교 — 거의 전부 같은 구조

**무료 데일리 1장(또는 맛보기) → 재화(하트·구슬·클로버·포스) 소진형 상세 리딩 → 월 2~2.6만 원 VIP.** 990원 소액 팩부터 11만 원 패키지까지 가격 폭이 넓다.

| 서비스 | 타로 방식 | 가격(iOS, 원) | AI | 리텐션 장치 · 메모 |
|---|---|---|---|---|
| 점신 | 연애·재물·학업·진로 주제별 타로(장수·스프레드 미확인) | 광고 제거 월 2,900 / 소원카드 1장 4,400 ~ 10+1장 44,000 | 스토어 설명엔 '오늘의 관상'만 AI | 오늘의 운세 중심 |
| 포스텔러 | 덱 선택형 고민 리딩, 여러 스프레드, 프리미엄 타로 리딩 | 재화 '포스' 200개 $1.99 ~ 7,200개 $70.99 | 미기재 | 매일 바뀌는 오늘의 운세. 무료 데일리 타로 유무 미확인 |
| 헬로우봇 | 캐릭터 챗봇(라마마 연애 타로·판밍밍 사주), 재회 타로 같은 시나리오 상품 | 하트 12개 3,300 ~ 200개 31,900 · 멤버십 월 26,000 | 꿈해몽만 AI 명시 | 캐릭터 IP. 2018 연 매출 6억+, 2021 월매출 전년 2배. 리뷰 "타로 맛집인데 유료 전환이 심하다" |
| 도사 | **무료 데일리 원카드·3카드** + 뽑은 카드로 이어 묻는 AI 상담 + 켈틱 크로스 | 구슬 9개 990 ~ 200개 33,000 · VIP 월 26,000 | GPT 기반, 음성 상담 | **면책 문구 모범**: "엔터테인먼트·라이프스타일 용도… 의학·법률·재정 자문 대체 아님, 모든 풀이는 참고용" |
| 마이타로 | 78장 정·역, 7종 스프레드(오늘의 운세·속마음·양자택일·켈틱 크로스…) 상황에 맞춰 자동 선택, 채팅형 | 클로버 13개 5,500 ~ 399개 110,000 · 메이트챗 월 20,900 / 연 175,000 | 마이타로AI | **"나의 사주에 맞는 뾰족한 타로 해석" 표방 — 결합 사례 유일**(로직 비공개). 평점 4.7 |
| 젠디 | 오늘의 타로 1장, 캐릭터 채팅 | 590 ZEN 5,900 ~ 50,000 | AI 채팅 | 리뷰 "AI 답변이 일관되지 않다", "리포트 생성 실패" — 반면교사 |
| 궁타 | 일일 타로·소원카드·월별 애정운·재물운 | 무료 + 인앱, 접속 시 30P | 미확인 | **정해진 시간 데일리 카드 푸시** |
| 운세박사 타로 GPT | GPT 스토어 대화형 | 무료 | LLM | 2025-10-27 GPT 스토어 라이프스타일 세계 1위(회사 발표) |

- 카카오톡 채널 챗봇은 2022-09부터 무료라 진입 장벽이 낮다(대표 타로 채널 통계는 없음). 네이버는 자체 타로 없음(웹툰 카드뽑기·엑스퍼트 사람 상담).
- 스레드 이용자 평: "타로는 오즈의타로가 제일". 타로밀크티·오즈의타로 등 일부 전문 앱은 공개 정보 없음.

## 4. 글로벌 UX 패턴

- **Labyrinthos**(구 Golden Thread Tarot 통합): 탭 Daily / Journal / Reading / Learn / Decks. 78장 + 룬 24 + 르노르망 36 백과와 플래시카드 학습(진도에 따라 아바타 해금), 저널(무료는 저장 수 제한), 일·주·월 리마인더, **Your Mirror**(기간별 최다 카드·수트·역방향 비율 회고). 광고 없음, 4.9★(약 2.3만). 크레딧 33개 $0.99 ~ 333개 $4.99, 프리미엄 월 $9.99·분기 $24.99·연 $89.99, 덱 하나 $4.99(그중 "1910 Rider Waite Smith").
- **Galaxy Tarot**: 실물 덱 흉내 셔플·뽑기, 스프레드, 카드 백과(웨이트 해설·위키 링크), 역방향 옵션, Card of the Day. 무료+광고, 구독 시 광고 제거.
- **Co-Star·The Pattern**: 타로 없음(점성술 "Ask the stars" 자유 질문·AI 어시스턴트). Sensor Tower 스냅샷 Co-Star 월 DL 약 10만·매출 약 $40만, The Pattern 월 DL 약 3만·매출 약 $30만.
- **AI 타로 트렌드**: SF Standard(2026-05) — TikTok·Reddit·Threads에 AI 점술 커뮤니티, 챗봇에 타로 통합, Sanctuary는 AI 타로와 사람 리더를 함께. Pew: 미국 성인 30%가 점성술·타로·점술가 이용. TikTok엔 ChatGPT 리딩 공유·커스텀 GPT 홍보. 해외 AI 타로 앱 구독 월 $6.99~9.99(Tarotoo·TarotAI·Tarotale).

**공통 UX**: 셔플·플립 애니메이션 → 자유 질문 입력 → 스프레드 선택 → Card of the Day + 정시 푸시 → 78장 정·역 백과 → 학습 모드 → 리딩 저널·회고 → 덱 스킨 판매.

## 5. LLM 타로 해석 — 설계 지식

**권장 구조**(Elara 개발기): ① 카드는 앱 코드가 중복 없이 뽑고 정·역을 정하며 **저장한다**(다시 생성해도 카드 불변) ② 질문·포지션·카드 ID·이름·방향·핵심 의미·키워드를 자료로 전달 ③ "제공된 의미만 권위로 사용"을 지시. → 우리 "LLM은 해석 생성기가 아니라 언어 변환기" 원칙(`_KKACHI_SYSTEM`·자료 시트)과 같다.

**알려진 품질 문제와 대응**
- 바넘 문장(카드를 바꿔도 성립하는 문장) → 카드 간 관계·포지션을 반드시 언급하게 하고 평가에서 감점.
- 카드 의미 환각·엉뚱한 카드 언급 → 서버에서 카드 ID·방향·포지션 검증.
- 카드를 따로따로만 설명 → 진행·대비·긴장 관계로 엮도록 지시.
- 비일관(같은 질문에 다른 해석) → 제약 섹션·과거 리딩 요약을 컨텍스트로(TarotQA, Claude 3.7 사례). 젠디 리뷰의 불만이 이것.
- 회귀 테스트 9항목: 카드 충실도·포지션·관련성·종합·구체성·주체성·불확실성·페르소나·안전.

**연구**: LLM 점술이 일반론과 확률적 추측을 섞고 사용자가 자기 삶에 끼워 맞춘다(바넘·확증 편향, arXiv 2606.12418). 긍정적인 AI 응답이 가짜 예측의 신뢰도를 높인다(arXiv 2409.15328).

**가드레일**(Tarotoo·Neon Worlds 면책, 도사 문구): 예언이 아니라 성찰로 제시 · 의료·법률·재정 조언 금지 · 제3자의 속마음 단정 금지 · 의존 유도 문구 금지 · AI 생성 고지 · 위기 상황은 사람의 도움으로 연결 · 성인 한정(Tarotoo).

**국내 업계 시각**: 글로벌 모델은 한자 명리 데이터가 부족해 환각이 잦다, 경쟁력은 모델보다 데이터와 프롬프트 설계(아주경제). 타로는 한자 의존이 없어 이 문제가 사주보다 작다.

## 6. 카드 그림 저작권

- **웨이트–스미스 덱**: 1909년 영국 Rider 출간, 그림 Pamela Colman Smith(1951 사망), 구성 A.E. Waite(1942 사망).
- **미국** 퍼블릭 도메인(1909 출간, 어느 기준으로도 만료). **영국·EU** 사후 70년 → 2022-01-01 PD(US Games는 판본별 권리를 주장했으나 Wild Hunt 정정기사·globalspiritualstudies 정리). **한국** PD — 2013-07-01 보호기간 70년 연장은 불소급이라 1962년 이전 사망자의 저작물은 이미 만료(위키문헌 저작권 길라잡이). 이 판단은 법률 자문이 아님 → 출시 전 확인 권고.
- **주의**: 1971년 이후 US Games 판본의 리컬러·카드 뒷면·상자, Universal Waite(1990)는 별도 저작물 → **1909 원판(1910 인쇄) 스캔만** 쓴다. 마이타로가 "유니버셜 웨이트 덱"을 표방하는데 따라 하면 안 된다.
- **상표**: US Games가 "Rider Tarot®, Waite®, Rider-Waite Tarot®, RWS Tarot™, Rider-Waite-Smith Tarot™"를 주장(카탈로그·Justia). 그림이 아니라 이름 보호 → 제품 문구·마케팅에 "라이더-웨이트"를 쓰지 않고 **"1909 클래식 덱"** 같은 서술형으로. 한국 상표 등록 여부 미확인.
- **소스**: Wikimedia Commons `RWS_Tarot_00_Fool.jpg`~`RWS_Tarot_21_World.jpg`(22) + `Wands01~14.jpg`·`Cups01~14.jpg`·`Swords01~14.jpg`·`Pents01~14.jpg`(56), 약 1,110×1,920px, 파일 메타 `Public domain`·1910. 예일대 소장본 스캔도 있음. 마르세유 덱(Conver)도 PD지만 숫자 카드에 그림이 없어 초보자 UX에 불리.
- **AI 생성 자체 덱**: 선례 있음(Marcus Katz Midjourney 덱). 미국 저작권청 'Zarya of the Dawn' 결정대로 순수 AI 이미지는 보호가 약해 경쟁사가 베껴도 막기 어렵다. → ① 1909 원판으로 시작 ② 뒤에 까치 브랜드 덱을 사람이 리터치해 저작권을 확보하고 스킨으로.

## 7. 사주 × 타로 결합

- 점신·포스텔러·헬로우봇·도사·젠디 모두 한 앱 안에 **따로** 둔다(도사도 결합 리딩 없음). 결합을 표방하는 건 **마이타로** 하나("운세와 궁합, 인연까지 나의 사주에 맞는 뾰족한 타로 해석"), 로직 비공개.
- 오프라인 상담사는 "사주+타로 병행 리딩"을 상품으로 판다 — **"사주로 타고난 그릇·계절·좌표를 보고, 타로로 가까운 시일의 고민을 세부적으로 본다"**(크몽 아티클). 학술 연구는 못 찾음. 업계 프레임은 "사주 = 장기·구조, 타로 = 지금의 질문·단기 선택".
- → 우리는 이미 사용자의 일간·강약·용신·대운·세운·오늘 일진을 갖고 있다. 카드 옆에 이것을 한 줄로 놓는 것이 **사실상 비어 있는 자리**다.

## 8. 수익화·리텐션

- 국내 기준점: 최소 단건 990~5,500원(재화 최소 팩), 주력 단건 3,000~11,000원, VIP 월 20,900~26,000원, 광고 제거 월 2,900원. 해외 구독 월 $6.99~9.99, 연 $59.99~89.99, 주간 $7.99.
- 매출: 헬로우봇 2018 연 6억+·4개월 75만 DL·이용자 80% MZ, 2021 월매출 2배("주기적으로 쓰는 사람을 위해" 구독 도입). 점신 2023 830억.
- **타로 단독 매출·전환율·데일리 카드 리텐션 효과의 공개 수치는 없다.** 간접 증거: 데일리 카드·정시 푸시는 Labyrinthos·궁타·Galaxy·도사가 모두 기본. 한 업체 블로그는 "데일리 타로 푸시가 모든 사용자에게 같은 문단이라 효과가 약하다"고 비판(Jenova, 근거 데이터 없음) — 개인화가 핵심이라는 주장. 우리 데일리 카드는 사람·날짜별로 다르고 일진 교차 줄이 붙으니 이 비판을 피한다.
- 결제 인프라는 ROADMAP §5 보류 그대로. 검증 순서는 데일리 무료 → 후속 질문 단건(약 1,000~5,000원) → 구독(국내 2만 원대, 진입 9,900원 검토).

## 9. 사주까치 적용 설계안 (ROADMAP V9)

**한 줄 결론.** 타로를 **질문 → 카드 세 장 → 한 줄 답**의 그릇으로 넣고, 돌아올 이유는 **오늘의 타로카드 한 장**이 만든다. 카드가 주인공, 사주는 배경.

### 9-1. 스코프

| 단계 | 흐름 | 들어가는 것 / 안 들어가는 것 |
|---|---|---|
| **V9-1 오늘의 타로카드** (2026-11-05 구현) | 홈 오늘의 별자리 아래 "오늘의 타로카드" — 뒷면 → 탭 → 셔플 떨림 0.9초 → 앞면(1909 클래식 덱 그림·이름·정/역·한 줄) → "오늘 일진과 함께 보면" 교차 한 줄(사람 카드만) → [자세히 →] `/tarot`(큰 그림·키워드 3·연애·일·재물 한 줄씩·면책) → 아침 알림 본문 셋째 줄 "🃏 오늘의 타로카드 · 별(정방향)" → 비로그인 홈은 날짜 카드("오늘 까치가 뽑아 둔 카드", 모두 같은 카드) | 룰 문장만. LLM·DB·공유 없음. 사람(생년월일시·성별)·날짜 결정론 — 다시 열어도 같은 카드 |
| **V9-2 질문 타로** | `/tarot` "까치에게 물어보기"(4~80자) + 영역 칩(연애·일·재물·기타 자동 감지) → 서버가 세 장(과거·현재·미래) 뽑아 **저장** → 차례로 뒤집힘(룰 의미 즉시) → AI 풀이 스트림 → `### 한 줄 답` 강조 → 공유(kind="tarot") → 같은 질문·같은 날은 같은 카드 | LLM kind "tarot"·`tarot_readings` 테이블·공유 카드·OG. 사주 컨텍스트는 프로필·sessionStorage 입력이 있을 때만 |
| 이후 후보 | 켈틱 크로스(10장) · 관계 타로(궁합 프로필 둘) · 저널(`tarot_readings` 목록) · 월간 회고("이번 달 자주 나온 카드" — Your Mirror의 사주판) · 까치 브랜드 덱(사람 리터치) | 각각 V9-2 지표 통과 후 |

### 9-2. 백엔드

| 파일 | 내용 |
|---|---|
| `domain/tarot.py` (V9-1 ✅) | `TarotCard(id 0~77, key, name 한글, arcana, number, suit 지팡이·잔·검·동전, keywords_up/rev 3, line_up/rev, love/work/money × up/rev)` + `CARDS` 78. 전 문장 한자·영문 0(테스트). 의미는 1911 「Pictorial Key」 전통에 기대 까치 말투로 새로 씀 — 카드 그림의 장면을 한 번씩 부르고 바넘 문장은 피함 |
| `application/tarot_rules.py` (V9-1 ✅) | `draw_daily(today, user=None)` — identity `"{birth_dt:%Y-%m-%dT%H:%M}|{gender}"`(없으면 날짜만), `sha256("kkachi-tarot-v1|{identity}|{date}")[:8]` → `random.Random` → 카드 1장, 역방향 25%. `cross_line(card, level, today)` — 일진 레벨 3 × 방향 2 = 6셀 × 2문장 날짜 회전. 순수 함수(`horoscope_rules` 꼴). V9-2에서 `draw_three`(비복원·역방향 각 30%·salt=정규화 질문)·`check_question`(4~80자·위기 어간)·`categorize`·`build_tarot_sheet`·`TAROT_PROMPT_VERSION` 추가 |
| `adapter/inner/tarot_controller.py` (V9-1 ✅) | `GET /tarot/today` — 직접 입력·날짜 전용(로그인 카드는 홈 응답 `me.tarot`) |
| `home_service.py`·`kkachi_controller.py`·`push_service.py` (V9-1 ✅) | `me.tarot`(교차 줄은 `week[0]` 일진 레벨 재사용, 추가 호출 없음) · `/kkachi/today tarot`(날짜 seed) · 푸시 셋째 줄 |
| V9-2 | `tarot_service.py`(`AiReportService` 허브·on_complete 저장 패턴) · `port/tarot_port.py` · `models.py TarotReadingModel` + `tarot_repo.py` + Alembic — `tarot_readings(id, profile_id NULL FK cascade, question 80, category, spread, cards JSONB, saju_context bool, narrative JSONB{text,version,model,created_at,valid}, created_at)` + `(profile_id, created_at)` 인덱스 · `ollama_adapter._SYSTEM["tarot"]`·`_NUM_PREDICT["tarot"]=700` |

**identity에 profile_id를 쓰지 않는 이유**: 직접 입력으로 본 카드가 가입·프로필 저장 순간 바뀌지 않게(둘이 같은 카드). 같은 생년월일시·성별은 같은 카드 — 일진과 같은 한계.
**V9-1에 DB가 없는 이유**: 결정론 seed가 곧 캐시. `fortunes.result`에 넣으면 PATCH·재계산 경로에서 카드가 바뀔 수 있다. V9-2는 질문이 하루 여러 번·비로그인 행이 필요해 새 테이블.

**API**
```
GET  /tarot/today            ?birth_dt&gender[&hour_unknown&city] | 없음(날짜만)   (V9-1 ✅)
                             → { date, identity:"person"|"date", card{id,key,name,arcana,number,suit,orientation,keywords[3],line,love,work,money}, cross: str|null }
GET  /kkachi/today  tarot(날짜 카드)  ·  GET /members/{id}/home  me.tarot(사람 카드 + cross)   (V9-1 ✅)
POST /tarot/readings         { question(4~80), birth_dt?, gender?, hour_unknown?, city?, name?, member_id?, profile_id? }   (V9-2)
                             → 201 { id, date, question, category, spread:"three", saju_context, cards[3]{position,…}, narrative:null }
                             위기 신호면 200 { blocked:"crisis", message, helplines[] } (카드 안 뽑고 LLM 안 감) · 길이 밖 422
GET  /tarot/readings/{id}    ?member_id= → 위 + narrative|null (profile 행은 소유자만)
POST /tarot/readings/{id}/narrative → text/plain 스트림(캐시·허브·Ollama 꺼짐 503)
POST /tarot/readings/{id}/share     → 201 { share_id } (kind="tarot": name, date, question, cards[3]{key,name,orientation,line}, answer — 생년월일·전체 글 없음)
```
사주 컨텍스트(V9-2): `KkachiService.analyze(user, today.year)`(수십 ms) → 일간·`strength_pct`·용신·현재 대운·세운 + `compute_fortune` 레벨. `interpret`는 안 부른다.

### 9-3. LLM (V9-2)

`_TAROT_SYSTEM`: 까치 해설가 · 한글만(영어 카드명 금지) · 표 금지 · 자료에 적힌 의미만 · **"타로는 예언이 아니라 거울"**("~될 거예요" 대신 조건·행동) · 질병·법률·투자 판단 금지 · 타인 속마음 단정 금지("그 사람은 당신을 좋아해요" 금지) · 다시 뽑으라는 말 금지 · 두루뭉술 문장 금지, 세 카드를 과거→현재→미래 한 흐름으로 · '쓰는 법' 따르고 `### ` 제목.

자료 시트(≈450토큰): **쓰는 법**(질문·영역, 400~550자, 섹션 4 = `### 과거 · 바보(정방향)` 식 카드 제목 3 + `### 한 줄 답`(질문을 그대로 받아 한 문장 + 오늘 행동 하나), 세 카드 이름을 본문에 모두, 사주 줄은 배경으로 한 번만) → **카드** 3줄(핵심·한 줄·영역) → **질문한 사람**(일간·강약%·용신·대운·세운·오늘 일진 레벨, 있을 때만) → **형식** 뼈대. prefix = 첫 제목(형식과 카드 언급을 동시에 고정). num_predict 700, 첫 글자 예상 8~12초·전체 25초 안팎(AI 풀이의 1/6 프롬프트).

검증(on_complete): 세 카드 이름 모두 포함 + `### 한 줄 답` 존재. 실패 → `valid:false` 저장, 프론트는 룰 `line`을 답 자리에 두고 [다시 풀기]. 허브 키 `("tarot", reading_id)`. 괄호 밖 한자 치환 재사용.

### 9-4. 프론트

- **V9-1 ✅**: `components/TarotCard.tsx`(뒷면 CSS 문양+까치 ↔ 앞면 그림, 역방향은 그림만 180°, `.tarot-scene/.tarot-card` 3D 뒤집기 + `.tarot-shuffle`, reduced-motion 처리) · 홈 `TodayTarotCard`(`FEED_CARD` 안 라벨 → 제목 → 카드 7rem → 이름·정/역 배지·한 줄 → 교차 줄 → [자세히 →]; 뒤집은 날짜 `sessionStorage kkachi_tarot_flipped`) · `app/tarot/page.tsx`(로그인 `getHome().me.tarot` / 비로그인 `kkachi_analysis_input` → `GET /tarot/today`) · `KKACHI_NEWS` 새소식 · sitemap. 진입은 홈 카드·새소식·알림 줄 — **하단 메뉴는 그대로 5칸**.
- **V9-2**: `TarotReading.tsx`(질문·칩·세 장·스트림 — `readTextStream`·`useAiReport` 상태 모델) · 공유 `TarotShareCard` → `AnyShareCard`·`s/[id]` 분기·`TarotOgImage`(og/ JPG — satori가 WebP를 못 읽음) · `?r={id}` 지난 리딩.
- 이벤트: `tarot_view{page,logged_in}` · `tarot_flip{spread,orientation,identity}` (V9-1 ✅) · `tarot_ask{category,len,has_saju}` · `tarot_answer{status,first_token_ms}` · `share_click{kind:"tarot"}` · `FeedbackBar tab_id="tarot"` (V9-2).
- 폰트: 카드 이름 바보·마법사·여사제…, 수트 지팡이·잔·검·동전, 숫자 아라비아 → 새 한자 없음(서브셋 재생성 불필요).

### 9-5. 자산 (V9-1 ✅)

Commons 1909 원판 스캔 78장 → `frontend/public/kkachi/tarot/{key}.webp`(800px, q75, 장당 약 90KB, 총 7.1MB), 키 `major_00~21`·`wands_01~14`·`cups_*`·`swords_*`·`pents_*`(11 시종·12 기사·13 여왕·14 왕). 뒷면은 그림 없이 CSS. 출처·라이선스·변환 명령은 `frontend/public/kkachi/tarot/README.md`. 제품 문구 "1909 클래식 덱".

### 9-6. 가드레일

| 항목 | 결정 |
|---|---|
| 면책(카드 아래 고정, V9-2 공유 랜딩에도) | V9-1: "타로는 앞날을 맞히는 도구가 아니라 지금 마음을 비춰 보는 거울이에요." / V9-2: + "건강·법률·돈 문제는 전문가와 먼저 상의하세요. 풀이 글은 AI가 썼어요." |
| 위기 키워드(V9-2) | `check_question`에서 **카드·LLM 전에** 판정(죽고 싶·자살·자해·살기 싫·목숨·사라지고 싶 등 ~15 어간) → `blocked:"crisis"` + 고정 문장("까치가 카드보다 먼저 당신 곁에 있고 싶어요…") + 자살예방상담전화 **109**(24시간)·정신건강위기상담 1577-0199. 질문 본문 저장 안 함, 이벤트 `tarot_ask{category:"crisis"}`만 |
| 질문 길이 | 공백 정리 후 4~80자(390px 두 줄), 밖이면 422 |
| 민감 영역 | 의료·법률·투자 어간(진단·약·소송·주식·코인·대출)은 카드는 읽되 시트에 "결정 대신 마음가짐만, 마지막에 전문가 상담 권유" 한 줄 |
| 의존 방지 | 같은 질문·같은 날 같은 카드(seed), "다시 뽑기" 없음. 하루 리딩 수 제한은 `tarot_ask` 분포를 2주 본 뒤 |
| AI 고지 | 스트림 영역 "까치의 풀이 · AI" 배지 + 면책 셋째 문장 |

### 9-7. 측정과 성공 기준 (ROADMAP §6 식)

- **V9-1 → V9-2 진입(2주, `/admin/events/summary`)**: ① 로그인 `home_view` 대비 `tarot_flip{daily}` ≥ 40% ② **뒤집은 회원의 7일 재방문율이 안 뒤집은 회원보다 +10%p**(§5 보류 사유를 뒤집는 숫자) ③ `tarot_view{tarot}`/`tarot_flip` ≥ 15%. 지인 5명에겐 "다음 날 카드 뒤집으러 들어왔어요?" 한 질문 추가.
- **V9-2 판정(4주)**: `tarot_ask`/`tarot_view{tarot}` ≥ 20% · `tarot_answer{done}` ≥ 80%(Ollama 켜진 시간 기준) · 첫 글자 p50 ≤ 12초 · `FeedbackBar tarot` 긍정 ≥ 60% · `share_click{tarot}` ≥ 5%. 미달이면 켈틱·관계 타로로 넓히지 않고 한 줄 답 품질부터.

### 9-8. 리스크·반대 의견

1. **브랜드 희석(까치=사주)** — 타로 앱은 포화. 대응: 독립 메뉴가 아니라 홈 "오늘" 묶음의 한 장, 항상 일진 교차 줄과 함께, 문구는 "까치가 뽑아 둔 카드". 사주 컨텍스트 없는 리딩이 70%를 넘으면 포지셔닝 재검토.
2. **"그냥 챗으로 물으면 되지 않나"** — `/chat`이 이미 질문에 답한다. 타로의 몫은 의식(셔플·뒤집기)·무작위가 주는 거리두기·그림이지 LLM이 아니다. 그래서 V9-1은 LLM 없이 가치가 서야 하고, 못 서면 V9-2를 안 한다.
3. **LLM 지연** — 질문 뒤 25초는 길다. 룰 의미 즉시 노출 + 프리필 제목 + 허브 공유로 버티되, `tarot_answer.first_token_ms` p50 15초 넘으면 타로만 클라우드 소형 모델로 분리하는 첫 후보(§5 LLM 전환 항목).
4. **콘텐츠 작성 비용** — 78×14 ≈ 1,090 문장. V9-1에서 전부 썼다(사람 검수는 "무작위 10장 낭독"으로). V9-2 시트는 이 문장을 재사용.
5. **폰트·자산 실수** — 영어 카드명·"Rider-Waite"가 UI에 들어가면 서브셋 밖·상표 문제. `CARDS` 한자·영문 0 테스트 + README 출처 고정.
6. **결정론의 부작용** — 같은 생년월일·성별은 같은 카드, 자정 넘으면 카드가 바뀜. 뒤집은 날짜를 sessionStorage에 두어 날이 바뀌면 다시 뒷면.

### 9-9. 규모 (실측·추정)

V9-1(2026-11-05 실측): 백엔드 데이터 약 600줄 + 룰 70줄 + 컨트롤러 30줄, 테스트 11개(198 → 209), 프론트 컴포넌트·페이지·홈 카드 약 330줄, 그림 78장 7.1MB. V9-2 추정 ≈ 5~6일: 테이블·repo·port(≈90) → 시트·서비스·LLM kind(≈230, 테스트 6) → 라우트·컨트롤러 테스트(≈100, 테스트 6) → `TarotReading`·공유·OG(≈400) → 문서.

## 10. 열린 결정

| 결정 | 선택지 | 누가 |
|---|---|---|
| V9-2 진입 | §9-7 2주 수치 / 수치와 무관하게 진행 | 사용자(수치 본 뒤) |
| 까치 브랜드 덱 | 1909 원판 유지 / Gemini 78장 + 사람 리터치(저작권 확보) | 사용자 — 2026-11-05 "1909 원판으로 시작" |
| 하루 리딩 수 제한(V9-2) | 없음 / 3회 | `tarot_ask` 분포 2주 뒤 |
| 역방향 비율 | 데일리 25% · 세 장 30% | 피드백 보고 조정 |
| 카드 백과 페이지(78장 의미, SEO) | V9-2와 함께 / 보류 | 사용자 |

## 참고 자료

- [점신 MAU 113만 (톱스타뉴스)](https://www.topstarnews.net/news/articleView.html?idxno=15623421) · [운세 앱 AI 전환·가격 구조 (아주경제 2026-02)](https://www.ajunews.com/view/20260213163857733) · [점신·포스텔러 MAU·테크랩스 매출 (한국경제 2026-02)](https://www.hankyung.com/article/2026021070861) · [포스텔러 가입자 750만 (KMJ)](https://www.kmjournal.net/news/articleView.html?idxno=8593) · [운세 앱 AI 탑재 6/10 (네이트, 원문 깨짐)](https://m.news.nate.com/view/20260408n42145)
- [타로 민간자격 470개·2030 (아시아경제 2025-08)](https://www.asiae.co.kr/en/article/2025080515311548024) · [네이버 엑스퍼트 운세·타로 1.9만 건 (아시아경제 2024-12)](https://www.asiae.co.kr/en/article/2024122714492037903) · [엠브레인 운세 이용 경험 84.5% (뉴시스 2022)](https://www.newsis.com/view/NISX20220119_0001730131)
- 앱스토어: [점신](https://apps.apple.com/kr/app/id960571015) · [포스텔러](https://apps.apple.com/us/app/id1262949138?l=ko) · [헬로우봇](https://apps.apple.com/kr/app/id1294957719) · [도사](https://apps.apple.com/kr/app/id6741585416) · [마이타로](https://apps.apple.com/KR/app/id6446103793) · [젠디](https://apps.apple.com/kr/app/id6740840101) · [궁타](https://apps.apple.com/us/app/id1037577911?l=ko) · [Labyrinthos](https://apps.apple.com/us/app/-/id1155180220)
- [헬로우봇 구독 도입 (미디어오늘)](https://www.mediatoday.co.kr/news/articleView.html?idxno=213775) · [헬로우봇 매출 (AI타임스)](https://www.aitimes.com/news/articleView.html?idxno=159171) · [포스텔러 타로 (Daum)](https://v.daum.net/v/F6HtDC2uLW) · [운세박사 타로 GPT (뉴스와이어)](https://www.newswire.co.kr/newsRead.php?no=1021564) · [카카오 챗봇 무료화](https://www.kakaocorp.com/page/detail/9756) · [스레드 이용자 평](https://www.threads.com/@arcanedrop/post/DFmVPtMTyHJ?hl=ko)
- [Galaxy Tarot (BlueStacks)](https://www.bluestacks.com/campaign/com.hemisphere3.tarot/en) · [Golden Thread → Labyrinthos (apkcombo)](https://apkcombo.com/golden-thread-tarot/com.ionicframework.tarot371308/) · [Co-Star Sensor Tower](https://app.sensortower.com/overview/1264782561?country=US) · [The Pattern Sensor Tower](https://app.sensortower.com/overview/1071085727?country=US) · [AI 점술 커뮤니티 (SF Standard 2026-05)](https://sfstandard.com/2026/05/21/ai-tarot-divination-uncertainty-gen-z/) · [ChatGPT 타로 (Our Culture)](https://ourculturemag.com/2025/05/29/when-chatgpt-meets-tarot-how-ai-is-transforming-online-tarot-readings/) · [Tarotoo AI 타로](https://tarotoo.com/ai-tarot)
- [AI 타로 리더 설계 (DEV, Elara)](https://dev.to/elara-tarot/building-an-ai-tarot-reader-from-random-cards-to-context-aware-reflection-38jf) · [AI 타로 일관성 과제 (DEV, TarotQA)](https://dev.to/tarotqa_1c7a6f23533345fd9/technical-challenges-and-solutions-in-ai-tarot-system-development-using-claude-37-452p) · [LLM 점술의 바넘 효과 (arXiv 2606.12418)](https://arxiv.org/pdf/2606.12418) · [긍정 AI 응답과 가짜 예측 신뢰 (arXiv 2409.15328)](https://arxiv.org/pdf/2409.15328) · [Neon Worlds 면책](https://neonworlds.dmvdigitalstudio.com/disclaimer) · [데일리 타로 푸시 비판 (Jenova)](https://www.jenova.ai/en/resources/ai-daily-tarot)
- [Rider–Waite Tarot (Wikipedia)](https://en.wikipedia.org/wiki/Rider%E2%80%93Waite_Tarot) · [RWS PD 정정기사 (Wild Hunt 2021)](https://wildhunt.org/2021/01/rider-waite-smith-tarot-deck-may-enter-public-domain.html) · [Is RWS public domain? (globalspiritualstudies)](https://globalspiritualstudies.com/is-rider-waite-smith-public-domain/) · [한국 저작권 보호기간 (위키문헌 길라잡이)](https://ko.wikisource.org/wiki/%EC%9C%84%ED%82%A4%EB%AC%B8%ED%97%8C:%EC%A0%80%EC%9E%91%EA%B6%8C_%EA%B8%B8%EB%9D%BC%EC%9E%A1%EC%9D%B4) · [US Games 상표 카탈로그](https://issuu.com/usgames/docs/2021_tarot_catalog/s/11524323) · [US Games 상표 (Justia)](https://trademark.justia.com/owners/u-s-games-systems-inc-2453218) · [Commons RWS_Tarot_17_Star.jpg](https://commons.wikimedia.org/wiki/File:RWS_Tarot_17_Star.jpg) · [마르세유 덱 연대 논란 (Leduc)](https://www.editionsleduc.com/extract/10491) · [AI 생성 타로 덱 (WOPC)](https://wopc.co.uk/tarot/tarot-of-the-everlasting-day-ai-generated-tarot) · [Zarya of the Dawn (Techopedia)](https://www.techopedia.com/?p=99418)
- [사주+타로 병행 리딩 (크몽 아티클)](https://kmong.com/article/1541)
