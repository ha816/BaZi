# 궁합 캐릭터 15종

| | |
|---|---|
| 상태 | 살아있음 — 2026-10-03 작성(`docs/COMPAT_CHARACTER_TYPES.md`), 2026-10-17 `specs/compatibility/`로 옮기며 스펙 형식으로. 사주 캐릭터 `specs/analysis/character.md`와 짝 |
| 화면 | 궁합 결과 인트로 공개 상자 · 팔자비교 탭 "두 분의 캐릭터" 카드 · 문답 "이럴 때 두 분은?" · 공유 랜딩 `/s/{id}`(kind=compat) · OG 이미지. 화면 안 순서·게이트는 `specs/compatibility/result.md`가 정하고, 이 문서는 **유형·칭호·설명·문답이 정해지는 규칙과 무엇을 노출하는가**를 정한다 |
| 관련 코드 | `src/kkachi/application/compatibility_character.py`(`build_compat_character` — `_PAIR_NAME`·`_SAME_NAME`·`_MOOD`·`_SUFFIX`·`_DESC`·`_SIPSIN_Q`·`_scenarios`) · `application/util/sipsin_meta.py`(`SIPSIN_ORDER`·`SIPSIN_TRAIT`, 설문조사와 공용) · `self_quiz.py`(`YES_AT` = 8) · `compatibility_service.py`(`build_compat_share_card().character`) · `frontend/src/components/compatibility/CompatTotal.tsx`(`CompatCharacterBox`·`CompatCharacterCard`·`CharacterArt`) · `CompatIntro.tsx` · `ScenarioCard.tsx` · `OgCard.tsx`(`CompatOgImage`·`loadCompatArt`) · `app/s/[id]/page.tsx` · `tests/application/test_compat_character.py` · `scripts/art_convert.sh` |
| 관련 API | `POST /compatibility` · `POST /compatibility/direct` · `POST /compatibility/invites/{id}/resolve` → `character {title, kind, key, roles[2], desc, scenarios[6~10]}`(응답 때마다 계산, 캐시에 저장 안 함) · `POST /compatibility/shares` → `/s/{id}`의 `card.character`(title·key·roles·desc — 이름 채움, scenarios 제외) |
| 관련 문서 | `docs/ROADMAP.md` V2-2(궁합 탭 고도화)·V6(분석에서 한 것을 궁합에도)·V3(설문조사와 같은 십신 표) · `specs/compatibility/result.md`(인트로·팔자비교 탭·문답 화면 순서) · `specs/analysis/character.md` |
| 마지막 확인 | 2026-10-17 — §3 표의 키·역할·비유를 `_PAIR_NAME`·`_SAME_NAME`과 `test_spec_table_matches_pair_names`로 대조. 수용 기준 1~4는 `uv run pytest tests/application/test_compat_character.py`, 5~8은 코드 읽기 |

## 1. 목적

두 사람의 궁합을 **칭호 한 줄**("끌리는 장작과 모닥불 커플")로 각인시키고, "이럴 때 두 분은?" 문답으로 사주 예측과 실제를 맞춰 보게 한다. 종합·영역별 점수와 달리 캐릭터는 **두 사람 일간(日干)의 오행 관계**만으로 정해지므로 15종 그림으로 그릴 수 있고, 공유 카드의 제목도 이 칭호다.

지키는 원칙
- 칭호·역할·설명·문답 문장의 출처는 `compatibility_character.py` 상수 하나. 이 문서 표와 글자까지 같다 — 바꿀 때 **같은 커밋**에서 둘 다 고친다.
- 그림은 **15종만**. 수식어·끝말·이름은 글자로 얹는다(135가지 칭호에 그림 135장을 만들지 않는다).
- 문답 답은 서버로 보내지 않는다(저장 여부는 열린 결정).

## 2. 유형이 정해지는 방식

궁합 캐릭터는 세 가지 입력으로 정해진다.

| 입력 | 값 | 칭호에 미치는 영향 |
|---|---|---|
| 두 사람 **일간(日干)의 오행** 쌍 | 상생 5 · 상극 5 · 같은 기운 5 = **15종** | 비유 핵심어 (예: 장작과 모닥불) — **이미지는 이 15종 기준** |
| **일주(日柱) 합·충** | 합(천간합·육합·반합) / 충(충·천간충·원진·형·해·파) / 없음 | 앞 수식어 (끌리는·티격태격 등) — 합이 충보다 우선 |
| **관계 유형** (입력 폼) | 연인·부부 / 친구·동료 / 가족 | 끝말(커플·콤비·가족) · 수식어 · 설명 문장 · 문답 질문 |

- 칭호 = `[수식어] + 비유 + 끝말` → 예: **끌리는 장작과 모닥불 커플**, **죽이 맞는 둑과 강물 콤비**, **투닥투닥 어깨를 맞댄 두 언덕 가족**
- 비유는 첫 번째 분(p1)의 역할부터 읽는다. p1이 火, p2가 木이면 "모닥불과 장작"
- 조합 수는 15 × 3(수식어) × 3(관계) = 135가지 칭호. **그림은 15장**만 만들고 수식어·끝말은 글자로 얹는다

## 3. 15종 유형표

방향 표기: 상생 `A → B`는 A가 B를 생(生)함, 상극 `A ⊣ B`는 A가 B를 극(剋)함. 파일명은 주는 쪽(A) 오행을 먼저 쓴다.

### 3-1. 상생(相生) — 한쪽이 다른 쪽을 키워 준다 (5종)

| # | 파일명 | 오행 | A 역할 | B 역할 | 비유 | 그림 장면 (까치 두 마리) |
|---|---|---|---|---|---|---|
| 1 | `木火.png` | 🌳木 → 🔥火 | 장작 | 모닥불 | 장작과 모닥불 | 한 까치가 장작을 모아 주고, 다른 까치가 그 불 앞에서 환하게 빛난다. 밤, 따뜻한 주황빛 |
| 2 | `火土.png` | 🔥火 → ⛰️土 | 햇볕 | 들판 | 햇볕과 들판 | 해를 품은 까치가 들판 위를 비추고, 들판의 까치는 곡식 사이에서 쉰다. 한낮, 황금빛 |
| 3 | `土金.png` | ⛰️土 → ⚔️金 | 광산 | 보석 | 광산과 보석 | 바위산 동굴의 까치가 반짝이는 보석을 건네고, 받은 까치가 보석처럼 빛난다 |
| 4 | `金水.png` | ⚔️金 → 💧水 | 바위 | 샘물 | 바위와 샘물 | 단단한 바위 위 까치 아래로 맑은 샘물이 솟고, 물가 까치가 목을 축인다. 새벽, 은청색 |
| 5 | `水木.png` | 💧水 → 🌳木 | 단비 | 새싹 | 단비와 새싹 | 비구름을 탄 까치가 비를 뿌리고, 새싹 옆 까치가 잎을 펼친다. 봄비, 연두색 |

### 3-2. 상극(相剋) — 한쪽이 다른 쪽을 다듬고 이끈다 (5종)

| # | 파일명 | 오행 | A 역할 | B 역할 | 비유 | 그림 장면 (까치 두 마리) |
|---|---|---|---|---|---|---|
| 6 | `木土.png` | 🌳木 ⊣ ⛰️土 | 뿌리 | 대지 | 뿌리와 대지 | 나무뿌리를 내린 까치가 단단한 땅을 붙잡고, 땅의 까치가 그 뿌리를 품는다 |
| 7 | `土水.png` | ⛰️土 ⊣ 💧水 | 둑 | 강물 | 둑과 강물 | 둑 위 까치가 물길을 잡아 주고, 강물 위 까치가 그 길을 따라 흐른다 |
| 8 | `水火.png` | 💧水 ⊣ 🔥火 | 소나기 | 불꽃 | 소나기와 불꽃 | 비구름 까치와 불꽃 까치가 마주 보며 김이 피어오른다. 긴장감 있지만 귀엽게 |
| 9 | `火金.png` | 🔥火 ⊣ ⚔️金 | 용광로 | 원석 | 용광로와 원석 | 대장간 불 앞 까치가 원석을 달구고, 원석 까치가 반짝이는 도구로 변해 간다 |
| 10 | `金木.png` | ⚔️金 ⊣ 🌳木 | 조각칼 | 원목 | 조각칼과 원목 | 조각칼을 든 까치가 나무를 다듬고, 나무 까치가 멋진 조각이 되어 뿌듯해한다 |

### 3-3. 같은 기운(比和) — 닮은 두 사람 (5종)

| # | 파일명 | 오행 | 역할(둘 다) | 비유 | 그림 장면 (까치 두 마리) |
|---|---|---|---|---|---|
| 11 | `木木.png` | 🌳木 · 🌳木 | 나무 | 나란히 선 두 그루 나무 | 숲속에 나란히 선 두 나무에 까치가 한 마리씩 앉아 같은 쪽을 본다 |
| 12 | `火火.png` | 🔥火 · 🔥火 | 불꽃 | 마주 보는 두 불꽃 | 두 개의 등불을 든 까치가 마주 보고 웃는다. 불빛이 겹쳐 더 밝다 |
| 13 | `土土.png` | ⛰️土 · ⛰️土 | 언덕 | 어깨를 맞댄 두 언덕 | 나란한 두 언덕 꼭대기에서 까치 둘이 어깨를 기대고 노을을 본다 |
| 14 | `金金.png` | ⚔️金 · ⚔️金 | 칼날 | 나란히 빛나는 두 칼날 | 은빛 갑옷의 까치 둘이 칼을 나란히 들고 같은 방향을 지킨다 |
| 15 | `水水.png` | 💧水 · 💧水 | 물줄기 | 만나서 하나 되는 두 물줄기 | 두 물줄기를 타고 내려온 까치 둘이 합류 지점에서 만난다 |

"그림 장면" 열은 부록 A·B의 그림 소재다 — 화면 글자로 쓰지 않는다. 키·역할·비유는 `_PAIR_NAME`·`_SAME_NAME`과 글자까지 같다(`test_spec_table_matches_pair_names`).

## 4. 칭호 조합 — 수식어 · 끝말 (관계 유형별)

| 관계 유형 | 일주 합일 때 수식어 | 일주 충일 때 수식어 | 끝말 | 예시 |
|---|---|---|---|---|
| 연인·부부 (`lover`) | 끌리는 | 티격태격 | 커플 | 끌리는 광산과 보석 커플 |
| 친구·동료 (`friend`) | 죽이 맞는 | 티격태격 | 콤비 | 죽이 맞는 단비와 새싹 콤비 |
| 가족 (`family`) | 정이 깊은 | 투닥투닥 | 가족 | 투닥투닥 어깨를 맞댄 두 언덕 가족 |

일주 합·충이 없으면 수식어 없이 "장작과 모닥불 커플"처럼 쓴다.

수식어에 붙는 덧붙임 문장:

| 관계 유형 | 합 | 충 |
|---|---|---|
| 연인 | 일주가 합으로 묶여 처음 만났을 때부터 끌리는 인연이에요. | 일주가 부딪혀 자주 티격태격하지만, 그만큼 서로를 깨워주는 자극이 돼요. |
| 친구 | 일주가 합으로 묶여 처음부터 죽이 잘 맞는 사이예요. | 일주가 부딪혀 자주 티격태격하지만, 그만큼 솔직한 사이예요. |
| 가족 | 일주가 합으로 묶여 함께 있으면 마음이 편한 사이예요. | 일주가 부딪혀 투닥거릴 때가 있지만, 미운 정도 정이라 금방 풀려요. |

## 5. 설명 문장 — 관계 종류 × 관계 유형

`{A}`는 주는·이끄는 쪽, `{B}`는 받는·따르는 쪽 이름으로 바뀐다.

| 관계 종류 | 연인·부부 | 친구·동료 | 가족 |
|---|---|---|---|
| 상생 | {A}님이 {B}님을 아낌없이 키워주는 사랑이에요. 받는 쪽이 고마움을 자주 표현하면 오래 따뜻해요. | {A}님이 판을 깔아주고 {B}님이 그 위에서 빛나는 콤비예요. 가끔은 역할을 바꿔 보세요. | {A}님이 든든한 울타리가 되어주는 가족이에요. 받는 쪽의 작은 보답이 큰 힘이 돼요. |
| 상극 | {A}님이 {B}님을 다듬고 이끄는 사이라 묘한 긴장감 속에 강하게 끌려요. 이끄는 쪽이 말투만 부드럽게 하면 최고의 짝이에요. | {A}님이 방향을 잡고 {B}님이 따라가는 콤비예요. 한쪽만 늘 맞추고 있지 않은지 가끔 살펴 주세요. | {A}님이 규칙을 세우고 {B}님이 맞춰 가는 가족이에요. 잔소리보다 칭찬을 한 번 더 해 주세요. |
| 같은 기운 | 같은 기운이라 말하지 않아도 통하는 사랑이에요. 고집도 닮아서, 부딪히면 한 사람이 먼저 웃어 주세요. | 같은 기운이라 취향과 속도가 꼭 맞는 콤비예요. 둘 다 약한 부분은 다른 친구에게 기대 보세요. | 같은 기운이라 닮은 점이 많은 가족이에요. 서로의 단점도 닮았다는 걸 알면 덜 서운해요. |

## 6. "이럴 때 두 분은?" 문답 — 십신 합집합 질문

**질문 고르기**: 두 사람 사주의 십신(十神, 일간 제외 일곱 글자)을 합쳐서, 둘 중 한 명이라도 가진 십신마다 질문 1개를 낸다. 그래서 두 사람마다 질문이 달라진다.
**사주 예측 답**: 새 스냅샷(`sipsin_score`가 있음)은 십신·지장간 조합 점수로 — 두 사람 다 8점(`YES_AT`, 설문조사와 같은 기준) 미만인 십신은 묻지 않고, 두 점수 차가 5점 미만이면 "두 분 다", 아니면 점수가 높은 쪽. 점수가 없는 옛 캐시는 개수로(같으면 "두 분 다"). 근거 문장에 개수·점수를 드러내지 않는다 — "겁재(劫財) 기운이 더 뚜렷한 쪽 — 승부욕과 경쟁심이 더 강해요", 둘 다면 "두 분 모두 겁재(劫財) 기운이 비슷하게 있어 — 승부욕과 경쟁심이 닮았어요".
**질문 수**: 최소 6개 · 최대 10개(십신 순서 `SIPSIN_ORDER`대로 앞에서 자름). 십신 질문이 6개보다 적으면 아래 6-2의 질문으로 채운다(앞장서는 쪽 → 먼저 맞추는 쪽 → 역마 → 도화 → 경청 → 보살핌 → 연락 → 기념일 → 돈 관리 순, 같은 문장은 건너뜀). 십신 정보가 없는 옛 캐시는 6-2의 고정 6문항.

십신 → 성향 표(`SIPSIN_ORDER`·`SIPSIN_TRAIT`)는 `application/util/sipsin_meta.py`에 있고, 한 사람용 "내 사주 맞춰 보기"(V3, `self_quiz.py`)와 같이 쓴다.

### 6-1. 십신별 질문

| 십신 | 성향 | 연인·부부 | 친구·동료 | 가족 |
|---|---|---|---|---|
| 비견(比肩) | 자존심과 독립심 | 싸우고 나서 먼저 굽히지 않는 쪽은? | "내 방식대로 할게"가 더 많은 쪽은? | 고집으로 치면 더 센 쪽은? |
| 겁재(劫財) | 승부욕과 경쟁심 | 게임이나 내기에서 절대 안 지려는 쪽은? | 내기만 하면 눈에 불을 켜는 쪽은? | 가족 윷놀이에서 제일 진지한 쪽은? |
| 식신(食神) | 먹고 즐기는 여유 | 데이트 맛집 찾기를 맡는 쪽은? | "뭐 먹을래?"에 바로 답하는 쪽은? | 주말에 맛있는 걸 해 먹자고 하는 쪽은? |
| 상관(傷官) | 말솜씨와 직설 | 서운한 건 바로 말로 하는 쪽은? | 할 말은 꼭 하는 쪽은? | 잔소리에 바로 말대꾸하는 쪽은? |
| 편재(偏財) | 통 큰 씀씀이와 사교성 | 기분 내서 한턱 쏘는 쪽은? | 모임에서 계산을 먼저 하는 쪽은? | 통 크게 선물하는 쪽은? |
| 정재(正財) | 꼼꼼한 살림과 저축 | 데이트 비용을 꼼꼼히 챙기는 쪽은? | 더치페이 계산을 정확히 하는 쪽은? | 가계부를 쓰는 쪽은? |
| 편관(偏官) | 결단력과 추진력 | 급할 때 바로 결정하는 쪽은? | "그냥 지금 가자" 하는 쪽은? | 집안의 큰 결정을 밀어붙이는 쪽은? |
| 정관(正官) | 규칙과 책임감 | 약속 시간을 칼같이 지키는 쪽은? | 약속 시간을 칼같이 지키는 쪽은? | 집안 규칙을 잘 지키는 쪽은? |
| 편인(偏印) | 직감과 혼자만의 시간 | 혼자 있는 시간이 꼭 필요한 쪽은? | 갑자기 연락이 뜸해지는 쪽은? | 자기 방에 혼자 있는 시간이 긴 쪽은? |
| 정인(正印) | 배움과 보살핌 | 아플 때 약 챙겨 주는 쪽은? | 새로 배운 걸 알려주는 쪽은? | 아플 때 약 챙겨 주는 쪽은? |

### 6-2. 채움용(그리고 옛 캐시용) 강약·오행·신살 질문

| 판정 근거 | 연인·부부 질문 | 친구·동료 질문 | 가족 질문 |
|---|---|---|---|
| 강약 점수가 **높은** 쪽 | 데이트 코스는 누가 정할까? | 약속 장소는 누가 정할까? | 가족 여행 계획은 누가 세울까? |
| 강약 점수가 **낮은** 쪽 | 싸우면 누가 먼저 사과할까? | 서운하면 먼저 풀자고 하는 쪽은? | — |
| 火×2 + 水가 많은 쪽 | 먼저 연락하는 쪽은? | 먼저 연락하는 쪽은? | — |
| 土가 많은 쪽 | 기념일을 더 잘 챙기는 쪽은? | — | — |
| 土 + 金이 많은 쪽 | 함께 돈 관리를 맡는다면? | — | 집안 살림·돈 관리를 맡는다면? |
| 水가 많은 쪽 | — | 고민이 생기면 들어주는 쪽은? | 속상할 때 들어주는 쪽은? |
| 도화살·년살 보유 (없으면 火·水) | — | 모임의 분위기 메이커는? | 집안 분위기 메이커는? |
| 역마살·지살 보유 (없으면 木) | "우리 여행 갈까?" 먼저 꺼내는 쪽은? | "이거 같이 해볼래?" 먼저 꺼내는 쪽은? | 새로운 일(이사·여행)을 먼저 꺼내는 쪽은? |
| 오행으로 생·극하는 쪽 (같은 기운이면 둘 다) | — | — | 챙겨주고 보살피는 쪽은? |

동점이면 답은 "두 분 다", 근거는 "두 분이 비슷해서 그때그때 달라요".

화면에서는 **사주 맞춰 보기**로 쓴다: [이름1님 / 이름2님 / 둘 다] 3지선다로 5문항씩 페이지를 넘기며 전부 답한 뒤(답하는 동안 사주 예측은 숨김) 한꺼번에 사주 예측과 맞춘다. 결과는 **일치율 + 구간별 까치 해설 한 문장 + 문항별 비교**(다른 문항을 근거와 함께 먼저, 일치한 문항은 뒤에 짧게). "모르겠어요" 선택지와 신뢰도·사주 스타일 라벨은 2026-10-15에 뺐다(분석 설문조사와 같게). 화면 순서·버튼·페이지 규칙은 `specs/compatibility/result.md`.

답은 화면 안에서만 쓰고 서버에 보내지 않는다. "다시 답하기"로 처음부터 다시 할 수 있다.

## 7. 화면·공유 카드에서 보이는 것

어디에 어떤 순서로 보이는지는 `specs/compatibility/result.md`(§3 인트로 3, 팔자비교 탭 ②, 문답, 수용 기준 2·13·19). 여기서는 **무엇을 쓰고 무엇을 숨기는가**만.

카드에 얹는 글자(화면·공유 카드 공통)

| 자리 | 내용 | 예 |
|---|---|---|
| 맨 위 작은 글씨 | 관계 유형 궁합 · 두 분은 | 연인·부부 궁합 · 두 분은 |
| 큰 제목 | 칭호(§4) | 끌리는 광산과 보석 커플 |
| 점수 | 종합 점수 + 라벨(인트로 상자·캐릭터 카드) | 79점 · 잘 맞는 인연 |
| 역할 칩 2개 | 이름 = 이모지 역할(한글오행) — `roles[0]`이 첫 번째 분 | 승민님 = ⛰️ 광산(흙土) · 하늘님 = ⚔️ 보석(쇠金) |
| 아래 한 줄 | 설명(§5, 합·충 덧붙임 포함) | 승민님이 하늘님을 아낌없이 키워주는 사랑이에요. 일주가 합으로 묶여 … |

자리별 그림과 글자

| 자리 | 그림 | 글자 |
|---|---|---|
| 인트로 공개 상자(드럼롤 뒤) | `compat/{key}.webp`, 없으면 두 역할 이모지 + ♥ | 위 표 전부 + 까치 인사. 캐릭터가 없는 옛 결과는 점수 + 한 줄만 |
| 팔자비교 탭 "두 분의 캐릭터" 카드 | 같은 상자 | 까치 팁 "○○님은 이모지 **역할**, ○○님은 이모지 **역할** — 상생/상극/비화 한 줄 사이예요" + 같은 상자. 게이트 없음 |
| 문답 카드 | — | 질문 · [이름1님 / 이름2님 / 둘 다] · 맞춘 뒤 일치율·해설·문항별 근거(§6) |
| 공유 랜딩 `/s/{id}` 종합 궁합 카드 | `compat/{key}.webp`(서버가 파일 존재로 판단), 없으면 역할 이모지 | 칭호 박스 · 역할 칩 · 설명 |
| OG 이미지 | `compat/og/{key}.jpg`가 있으면 왼쪽 232px(점수 칸 240→180, 일간 타일 190→170) | 헤더 아래 "두 분은 {칭호}" + 일간 타일 아래 "= 광산(土)" + 설명 첫 문장. **이모지 없음**(satori) |
| 공유 문구 · 미리보기 설명 | — | "○○님과 ○○님은 {칭호}! 궁합 N점…" · "두 분은 {칭호} · {설명 또는 라벨}" |

## 8. 규칙

한다
- 칭호·역할·설명·문답의 출처는 `compatibility_character.py` 상수 하나. §3~§6 표와 글자까지 같고 바꿀 때 같은 커밋에서 둘 다 고친다.
- 그림 파일 이름은 `key` — 주는·극하는 쪽(A) 오행이 앞, 같은 기운은 두 글자가 같다(`木火`, `土土`). 원본 `frontend/public/kkachi/compat/{key}.png` → `bash scripts/art_convert.sh frontend/public/kkachi/compat` → 화면 `compat/{key}.webp`(1024px) · OG `compat/og/{key}.jpg`(512px). 원본 PNG도 같은 폴더에 커밋.
- 그림은 A(주는 쪽)가 왼쪽. p1이 B 쪽이어도 같은 그림을 쓰고 역할 칩으로 누가 누구인지 보여준다. 칭호의 비유는 언제나 **첫 번째 분(p1) 역할부터** 읽는다.
- 파일이 없으면 화면은 두 역할 이모지(브라우저 onError), 공유 랜딩은 파일 존재로 판단, OG는 글자만 — **파일만 넣으면 코드 변경 없이 노출**된다.
- 모르는 관계 유형은 연인으로 본다. 일간 스냅샷이 없으면 `character`를 주지 않는다.
- 캐릭터·문답은 응답 때마다 다시 계산한다(`compatibilities` 캐시에 저장 안 함) — 문장을 고치면 옛 결과에도 바로 반영. 십신 점수가 없는 옛 캐시는 개수 기준(§6).

하지 않는다
- 수식어·끝말·이름을 그림에 넣지 않는다. 그림에 글자를 넣지 않는다.
- OG에 이모지를 쓰지 않는다 — 역할 칩은 "승민님 = 광산(土)".
- 문답 답을 서버로 보내지 않는다. 근거 문장에 십신 개수·점수를 쓰지 않는다.
- 프론트가 칭호·설명·예측을 다시 계산하지 않는다 — `KIND_LABEL`(상생/상극/비화 한 줄)처럼 표시 메타만.

## 9. 수용 기준

1. 두 사람 일간 오행이 같으면 `kind`는 `same`이고 `key`는 같은 글자 둘(`土土`), 상생이면 `generate`에 주는 쪽 오행이 앞(`木火`), 상극이면 `overcome`에 극하는 쪽이 앞(`金木`). p1이 받는 쪽이어도 `key`는 같고 `roles[0]`은 p1의 역할이다.
2. 칭호는 `[수식어 ]{p1 역할}과/와 {p2 역할} {끝말}` — 일주 합(천간합·육합·삼합)이면 끌리는/죽이 맞는/정이 깊은, 충(충·천간충·원진·형·해·파)이면 티격태격/티격태격/투닥투닥, 둘 다 없으면 수식어 없음. 합이 충보다 우선. 끝말은 커플/콤비/가족, 모르는 관계 유형은 커플.
3. 설명은 §5 표의 문장에 {A}·{B} 이름이 들어간 것이고, 합·충이 있으면 §4의 덧붙임 문장이 한 칸 띄고 이어진다.
4. 문답은 6~10개. `sipsin_score`가 있으면 두 사람 중 한쪽이라도 8점 이상인 십신마다 1문항(차 5점 미만은 두 분 다), 6개 미만이면 6-2 순서로 같은 문장 없이 채우고, 십신 정보가 없는 옛 캐시는 6-2의 고정 6문항이다. 같은 십신이라도 관계 유형마다 질문 문장이 다르다 (`test_compat_character.py`).
5. 일간 스냅샷이 없는 결과는 `character`가 없고, 인트로는 점수 + 한 줄만, 두 분의 캐릭터 카드는 없다.
6. `compat/{key}.webp`를 넣으면 인트로 상자·두 분의 캐릭터 카드·공유 랜딩에 그림이 뜨고, 빼면 두 역할 이모지(+♥)로 돌아간다. `compat/og/{key}.jpg`를 넣으면 OG 왼쪽에 그림이 들어가며 점수·일간 칸이 좁아지고, 빼면 글자만 남는다 — 어느 쪽도 코드 변경 없이.
7. OG 어디에도 이모지가 없고, 역할은 "○○님 = 광산(土)"처럼 글자다.
8. 공유 카드 `card.character`에는 `scenarios`가 없고 `desc`와 `roles`의 `{p1}`·`{p2}`가 두 사람 이름으로 채워져 있다.

## 10. 열린 결정

| 항목 | 누가 | 메모 |
|---|---|---|
| 15장 그림 + 드럼 까치(`drum_kkachi.png`) 반입 | 사용자(Gemini) | 부록 B 프롬프트 → `scripts/art_convert.sh`. 화면·랜딩·OG 자리는 전부 준비됨(2026-10-17) |
| 실기기 카톡 미리보기로 OG 확인 | 사용자 | 그림 반입 뒤 |
| 두 분의 캐릭터 카드 내용 보강 | 사용자 검토 | 분석 카드의 선호하는 일·게이지에 대응하는 "잘 맞는 순간 / 부딪히기 쉬운 순간" 칩 — 15유형 문구가 필요하면 §3 표와 코드 동시에 |
| 문답 답 저장 여부 | 사용자 | 저장하면 공유 카드 "일치율"도 다시 검토(ROADMAP V3) |

## 11. 변경 이력

| 날짜 | 변경 | 왜 |
|---|---|---|
| 2026-10-17 | `docs/COMPAT_CHARACTER_TYPES.md` → `specs/compatibility/character.md`. 목적·노출 규칙·수용 기준 추가, 문답 절을 2026-10-15 화면(3지선다·일치율)과 점수 규칙(8점·5점)에 맞게 고침, 그림 제작안·복붙용 프롬프트는 부록으로, 15종 키·역할 대조 테스트 | 유형표·칭호·문답 규칙은 코드가 지키는 약속이라 스펙(사용자 결정) |
| 2026-10-17 | 그림 파이프라인 — 복붙용 프롬프트 16개(15종 + 드럼 까치), `scripts/art_convert.sh`, OG 그림 자리, 화면 그림을 WebP로 | V6 |
| 2026-10-15 | 문답 3지선다("모르겠어요" 제거), 신뢰도·사주 스타일 라벨 → 일치율 + 까치 해설 | V6 1차 — 분석 설문조사와 같게 |
| 2026-10-09 | 공유 카드·OG에 칭호·역할·설명(`build_compat_share_card().character`) | V2-2 |
| 2026-10-03 | 작성 — 15종 표·칭호 조합·설명 문장·문답(십신 합집합, 사주 맞춰 보기)·이미지 카드 제작안 | V2-2 |

---

## 부록 — 그림 제작 자료

화면이나 표를 고칠 때는 읽지 않아도 된다. 그림을 만들거나 고칠 때만.

## 부록 A. 그림 카드 제작안

### A-1. 범위와 규격

| 항목 | 정한 값 |
|---|---|
| 수량 | **15장** (§3의 15종 그대로). 관계 유형·수식어·이름은 그림 위에 글자로 얹는다 |
| 원본 규격 | 정사각 PNG(Gemini 기본 2048 × 2048 그대로). 화면·OG 모두 정사각으로 넣으므로(사주 카드 V4와 같은 자리) 가로 띠 제약은 없다 — 두 까치를 가운데에, 사방 10% 여백 |
| 스타일 | 기존 까치 그림(`good_kkachi.png`, `strength/신강.png`)과 같은 톤 — 갓을 쓴 까치, 수채화풍 배경, 따뜻한 색. 글자는 그림에 넣지 않는다 |
| 크기 | 화면용 WebP는 한 장 100KB 안팎(사주 캐릭터와 같음), OG용 JPG 50KB 안팎. 원본 PNG(6~7MB)는 사주 캐릭터처럼 같은 폴더에 함께 커밋 |

### A-2. 그림 지시문 틀

이미지 생성 도구에 넣을 공통 문장과 유형별 장면(§3의 "그림 장면" 열)을 합쳐 쓴다.

```
Two cute Korean magpies wearing traditional gat hats, soft watercolor illustration,
warm storybook style, same character design as the existing Saju-Kkachi mascot.
Left magpie embodies {A 역할} ({A 오행}), right magpie embodies {B 역할} ({B 오행}).
Scene: {그림 장면}. Square 1:1, both magpies inside the center horizontal band,
no text, no letters.
```

### A-3. 적용 순서

- [ ] 15장 그림 생성(부록 B) → 원본 PNG를 `frontend/public/kkachi/compat/{key}.png`로 저장 → `bash scripts/art_convert.sh frontend/public/kkachi/compat` → WebP·JPG 확인
- [ ] 드럼 치는 까치 `frontend/public/kkachi/drum_kkachi.png` (부록 B 마지막 프롬프트, 1024px로 줄여 저장) — 인트로 두근두근 화면. 없으면 기본 까치 + 🥁
- [x] 한눈에 "두 분은" 박스에 그림 자리 — `compat/{key}.png`를 먼저 찾고 없으면 역할 이모지 (2026-10-03, 2026-10-17부터 `.webp`)
- [x] OG 이미지에 궁합 캐릭터 그림 자리 (2026-10-17) — `compat/og/{key}.jpg`가 있으면 왼쪽 232px에 그림, 점수·일간 칸을 좁힘(`OgCard.CompatOgImage characterArt`, `loadCompatArt`). 파일만 넣으면 노출
- [x] 궁합 공유 카드(`/s/{id}` kind=compat)·OG 이미지에 칭호·역할 넣기 (2026-10-09) — 백엔드 `build_compat_share_card().character`(title·key·roles·desc, 이름 채움·scenarios 제외). 페이지는 `compat/{key}.png`가 있으면 그림, 없으면 역할 이모지(서버 렌더라 파일 존재로 판단). OG는 글자만 — 헤더 아래 "두 분은 {칭호}" 줄 + 일간 타일 아래 "= 광산(土)" + 설명 첫 문장
- [ ] 실기기에서 카톡 미리보기로 OG 확인

## 부록 B. 복붙용 통합 프롬프트 (2026-10-17)

사주 캐릭터(`specs/analysis/character.md` 부록 B)와 같은 방식 — 기준 그림 `frontend/public/kkachi/strength/신강.png`(또는 마음에 드는 사주 캐릭터 WebP 한 장)를 **첨부**하고 아래 블록을 그대로 붙여 넣는다. 결과에 글자가 들어가면 "remove all text"로 한 번 더. 저장 이름은 표의 파일명 그대로(`木火.png` …) → 부록 A-3 변환 스크립트.

공통 틀(참고용 — 아래 15개 블록에는 이미 들어가 있다):

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies {A 역할} ({A 오행}), the RIGHT magpie embodies {B 역할} ({B 오행}).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: {장면}
```

### B-1. `木火.png` — 장작과 모닥불

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies firewood logs (Wood 木), the RIGHT magpie embodies a glowing campfire (Fire 火).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Night camp under stars. The left magpie carries a bundle of firewood and places a log onto the fire; the right magpie stands in front of the crackling campfire, lit up warm and bright, wings spread happily. Warm orange and amber palette, soft sparks.
```

### B-2. `火土.png` — 햇볕과 들판

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies warm sunshine (Fire 火), the RIGHT magpie embodies a wide golden field (Earth 土).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: High noon over a golden grain field. The left magpie floats in the sky holding a small glowing sun like a lantern, beams falling on the field; the right magpie rests contentedly among tall ripe grain and a few pumpkins. Golden yellow and ochre palette.
```

### B-3. `土金.png` — 광산과 보석

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a rocky mountain mine (Earth 土), the RIGHT magpie embodies a sparkling gemstone (Metal 金).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Entrance of a cozy mountain mine cave with lanterns. The left magpie wears a mining helmet and holds out a big sparkling gem it just found; the right magpie receives it and glitters like a jewel, with little sparkles around. Stone-brown and sapphire palette.
```

### B-4. `金水.png` — 바위와 샘물

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a sturdy rock (Metal 金), the RIGHT magpie embodies a clear spring (Water 水).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Dawn in a quiet valley. The left magpie stands firm on a big smooth boulder; from beneath the rock a crystal-clear spring bubbles out into a small pool, where the right magpie drinks and splashes happily. Silver-blue and mint palette, misty morning light.
```

### B-5. `水木.png` — 단비와 새싹

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies gentle spring rain (Water 水), the RIGHT magpie embodies a fresh sprout (Wood 木).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Spring meadow. The left magpie rides a small fluffy rain cloud and sprinkles gentle rain with a watering can; the right magpie stands beside a bright green sprout, spreading its wings like new leaves, droplets shining. Light green and sky-blue palette.
```

### B-6. `木土.png` — 뿌리와 대지

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies deep tree roots (Wood 木), the RIGHT magpie embodies solid ground (Earth 土).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Cross-section view of a hillside. The left magpie sits on a tree whose roots reach deep into the earth, gripping it firmly; the right magpie rests inside the warm soil, hugging the roots with a cozy smile. Forest-green and warm brown palette.
```

### B-7. `土水.png` — 둑과 강물

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a riverside levee (Earth 土), the RIGHT magpie embodies a flowing river (Water 水).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: A winding river seen from the bank. The left magpie stands on a sturdy earthen levee, guiding the water's path with a small flag; the right magpie floats along the river on a leaf boat, following the course cheerfully. Ochre and river-blue palette.
```

### B-8. `水火.png` — 소나기와 불꽃

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a sudden rain shower (Water 水), the RIGHT magpie embodies a lively flame (Fire 火).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Two magpies face each other at close range: the left one sits on a small dark rain cloud with raindrops falling, the right one glows like a flame with little fire wisps; cute puffs of steam rise where rain meets fire. Playful tension, both grinning. Blue and red-orange palette.
```

### B-9. `火金.png` — 용광로와 원석

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a blazing forge (Fire 火), the RIGHT magpie embodies raw ore turning into a tool (Metal 金).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: A blacksmith's workshop. The left magpie works the glowing forge with bellows and tongs, sparks flying; the right magpie, holding a rough ore stone, is halfway transformed into a shining polished tool, proud and sparkling. Ember-orange and steel-silver palette.
```

### B-10. `金木.png` — 조각칼과 원목

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a carving knife (Metal 金), the RIGHT magpie embodies a block of wood (Wood 木).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: A woodcarver's studio with shavings on the floor. The left magpie holds a carving knife and shapes a wooden figure with focused care; the right magpie stands beside a log that is becoming a beautiful carved sculpture of itself, looking proud. Silver and warm wood-brown palette.
```

### B-11. `木木.png` — 나란히 선 두 그루 나무

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a tall tree (Wood 木), the RIGHT magpie embodies a tall tree (Wood 木).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: A quiet forest. Two trees stand side by side; one magpie perches on each tree, both looking toward the same sunrise, branches intertwined above them. Deep and fresh green palette, soft morning light.
```

### B-12. `火火.png` — 마주 보는 두 불꽃

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a bright lantern flame (Fire 火), the RIGHT magpie embodies a bright lantern flame (Fire 火).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Evening festival. Two magpies each hold a glowing paper lantern and face each other, smiling; their lights overlap into one bigger, brighter glow between them, sparks dancing. Red, orange and gold palette.
```

### B-13. `土土.png` — 어깨를 맞댄 두 언덕

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a gentle hill (Earth 土), the RIGHT magpie embodies a gentle hill (Earth 土).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Two rounded hills side by side at sunset. A magpie sits on each hilltop, leaning shoulder to shoulder, watching the sunset together, tiny wildflowers on the slopes. Warm ochre, beige and sunset-pink palette, calm mood.
```

### B-14. `金金.png` — 나란히 빛나는 두 칼날

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a gleaming sword (Metal 金), the RIGHT magpie embodies a gleaming sword (Metal 金).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Two magpies in matching silver armor stand back to back, each holding a shining sword raised in the same direction, guarding together, determined but cute. Silver-white and steel-blue palette, clean cool light.
```

### B-15. `水水.png` — 만나서 하나 되는 두 물줄기

```
Use the attached image as the character reference. Draw TWO of the SAME chibi Korean magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference, for BOTH magpies.
The two magpies are a pair: the LEFT magpie embodies a flowing stream (Water 水), the RIGHT magpie embodies a flowing stream (Water 水).
Show the relationship through the scene and props — who gives, who receives, or how they stand together.
Both must look friendly and happy with each other; the element motifs are props or background accents, not costumes.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), both magpies centered and fully visible, together about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
Scene: Two streams curve down a green valley and meet in a sparkling pool. One magpie rides each stream on a lily pad and they meet at the confluence with a joyful splash, wings touching. Deep blue and turquoise palette, fresh water light.
```

### B-16. `drum_kkachi.png` — 두근두근 드럼 까치 (인트로 공개 전 화면, `CompatTotal.RevealGate`)

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright behind a small traditional Korean drum (buk), holding two drumsticks
in its wings, mid-beat, eyes squeezed with excitement, cheeks blushing, little motion lines and heart-shaped sparkles
around the drum — a playful "drumroll before the big reveal" moment.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background in warm ivory and gold,
gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie and drum centered, full body, about 60% of the image height,
at least 10% empty margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
```

저장: `frontend/public/kkachi/drum_kkachi.png` — 화면에서 160px 원형으로 쓰므로 `magick drum.png -resize 1024x1024 frontend/public/kkachi/drum_kkachi.png`로 줄여 둔다. 파일이 없으면 기본 까치 + 🥁 이모지로 대신한다.
