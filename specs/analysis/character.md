# 사주 캐릭터 20유형

| | |
|---|---|
| 상태 | 살아있음 — 2026-10-11 작성(`docs/SAJU_CHARACTER_TYPES.md`), 2026-10-17 `specs/analysis/`로 옮기며 스펙 형식으로. 궁합 캐릭터 `specs/compatibility/character.md`와 짝 |
| 화면 | 분석 결과 인트로 공개 화면 · 만세력 탭 "나의 캐릭터" 카드 · 공유 랜딩 `/s/{id}` · OG 이미지. 화면 안 순서·게이트는 `specs/analysis/result.md`가 정하고, 이 문서는 **유형이 정해지는 규칙·유형표·무엇을 노출하는가**를 정한다 |
| 관련 코드 | `src/kkachi/application/saju_character.py`(`_TYPES` 표 · `build_saju_character`) · `domain/natal.py`(`strength_pct`·`is_strong`) · `frontend/src/components/SajuCharacterCard.tsx` · `ResultIntro.tsx` · `OgCard.tsx`(`ShareOgImage`·`loadCharacterArt`) · `app/s/[id]/page.tsx` · `tests/application/test_saju_character.py`(표·그림·스펙 대조) · `scripts/art_convert.sh` |
| 관련 API | `POST /kkachi/interpret` · `POST /members/{m}/profiles/{p}/analyze` → `natal.character` · `POST /kkachi/shares` → `/s/{id}`의 `card.character`(title·line·jobs·key·stem·strength_label) |
| 관련 문서 | `docs/ROADMAP.md` V4(캐릭터 20유형) · `specs/analysis/result.md`(인트로·만세력 탭·공유 화면 순서) · `specs/compatibility/character.md` |
| 마지막 확인 | 2026-10-17 — §3 표는 `_TYPES`에서 만들었고 `test_spec_table_matches_types`가 글자까지 대조. 수용 기준 1~3은 `uv run pytest tests/application/test_saju_character.py`, 4~6은 코드 읽기 |

## 1. 목적

분석 직후 "내 얘기네?"를 만드는 **한 장**. 사주의 가장 큰 두 축인 일간(日干)과 신강·신약을 캐릭터 하나로 묶어, 유형명·한 줄 성향·선호하는 일로 바로 읽히게 한다. 백과사전 같은 탭을 보기 전에 자기 캐릭터를 먼저 만나게 하는 것이 V4의 목적이고, 공유 카드의 제목도 이 유형명이다.

지키는 원칙
- 유형은 **일간 10 × 신강/신약 2 = 20**. 중화(中和) 유형을 두지 않는다 — 강약 점수 50 이상이면 신강, 아니면 신약(2026-10-11, 사용자 결정).
- 표의 글자가 곧 화면 글자. 표를 바꾸면 `saju_character.py`의 `_TYPES`와 §3 표를 **같은 커밋**에서 같이 고친다(테스트가 어긋남을 잡는다).
- 그림은 자연물이 아니라 **대표 직업으로 의인화한 까치** — 유형이 썸네일에서도 한눈에 읽혀야 한다(자연물 시안 폐기, 2026-10-11).

## 2. 유형이 정해지는 방식

| 입력 | 값 | 어디서 |
|---|---|---|
| 일간(日干) | 甲·乙·丙·丁·戊·己·庚·辛·壬·癸 | `natal.saju.stem_of_day_pillar` |
| 신강·신약 | `strength_pct`(0~100)가 **50 이상이면 신강** | `natal.is_strong` — 일간을 뺀 자리별 가중치에 지장간 비중을 곱하고 월지 왕상휴수사를 섞은 점수(ROADMAP V4, 2026-10-11). 출생시간 미상은 세 기둥으로 판정 |

응답 `natal.character` — 일간·강약 외에는 전부 §3 표에서 나온다.

| 필드 | 뜻 | 예(戊 신강) |
|---|---|---|
| `key` | `{일간 한글}_{강\|약}` — 그림 파일 이름 | `무_강` |
| `stem` · `stem_korean` · `element` | 일간 한자·한글·오행 | `戊` · `무` · `土` |
| `strong` · `strength_label` · `strength_pct` | 신강 여부·라벨·점수 | `true` · `신강(身強)` · 63.2 |
| `title` | 유형명 — 화면 제목, 공유 미리보기 제목 | 든든한 수호자 |
| `line` | 한 줄 성향 | 흔들리지 않고 모두의 기준점이 된다 |
| `jobs` | 선호하는 일 2~3개 | 경영자, 공무원 |
| `jobs_avoid` | 선호하지 않는 일 3개 | 트렌드 마케터, 프리랜서, 서비스직 |
| `job` | 대표 직업 — 그림 소재, **화면 비노출** | CEO |
| `name` | 자연물 비유 — **화면 비노출**, 데이터에만 | 우뚝 선 산 |

## 3. 유형표

코드 `saju_character.py` `_TYPES`와 글자까지 같다(`test_spec_table_matches_types`). 순서는 일간 순, 신강 → 신약.

| # | `key` | 일간 | 강약 | 유형명(`title`) | 한 줄 성향(`line`) | 선호하는 일(`jobs`) | 선호하지 않는 일(`jobs_avoid`) | 대표 직업(`job`, 그림) | 캐릭터(`name`, 비노출) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `갑_강` | 갑목(甲木) | 신강 | 개척하는 리더 | 먼저 길을 내고 사람들을 이끈다 | 창업가, 기획자, 행정가 | 비서, 사무 보조원, 경리 | 창업가 | 숲의 대장 나무 |
| 2 | `갑_약` | 갑목(甲木) | 신약 | 함께 크는 성장가 | 혼자보다 함께 클 때 가장 높이 자란다 | 교사, HR, 커뮤니티 매니저 | 보험 설계사, 1인 사업가, 주식 트레이더 | 선생님 | 숲을 이루는 어린 나무 |
| 3 | `을_강` | 을목(乙木) | 신강 | 끈질긴 생존가 | 어떤 환경에서도 결국 꽃을 피운다 | 영업, 협상가, 스타트업 운영 | 이론 연구원, 행정 공무원, 생산직 사원 | 영업왕 | 바위틈 들꽃 |
| 4 | `을_약` | 을목(乙木) | 신약 | 섬세한 조율가 | 분위기와 관계를 읽고 부드럽게 엮는다 | 디자이너, 상담사, 플로리스트 | 협상 전문가, 경찰관, 현장 소장 | 플로리스트 | 정원의 덩굴꽃 |
| 5 | `병_강` | 병화(丙火) | 신강 | 무대 위 주인공 | 존재만으로 주목받고 판을 밝힌다 | 방송인, 마케터, 연설가 | 회계사, 관제사, 연구 분석가 | 방송인 | 한낮의 태양 |
| 6 | `병_약` | 병화(丙火) | 신약 | 분위기 메이커 | 주변을 따뜻하게 데우는 사람 | 홍보, 서비스 기획, 유아교육 | 구조조정 컨설턴트, 연구원, 감사관 | 유치원 선생님 | 아침 햇살 |
| 7 | `정_강` | 정화(丁火) | 신강 | 꺼지지 않는 장인 | 한 가지에 몰입해 끝까지 벼려낸다 | 연구원, 엔지니어, 셰프 | 외근 영업사원, 콜센터 상담원, 행사 MC | 셰프 | 대장간 불꽃 |
| 8 | `정_약` | 정화(丁火) | 신약 | 마음을 밝히는 사람 | 조용히 곁을 지키며 길을 비춘다 | 상담사, 작가, 간호사 | 주식 트레이더, 무대 배우, 영업 사원 | 간호사 | 창가의 촛불 |
| 9 | `무_강` | 무토(戊土) | 신강 | 든든한 수호자 | 흔들리지 않고 모두의 기준점이 된다 | 경영자, 공무원 | 트렌드 마케터, 프리랜서, 서비스직 | CEO | 우뚝 선 산 |
| 10 | `무_약` | 무토(戊土) | 신약 | 품어주는 중재자 | 갈등을 받아내고 균형을 맞춘다 | 인사, 사회복지, 중재·조정 | 최고경영자, 운동선수, 전업 투자자 | 중재자 | 완만한 언덕 |
| 11 | `기_강` | 기토(己土) | 신강 | 실속 있는 운영자 | 가진 것을 계획적으로 불려 간다 | PM, 재무, 운영관리 | 공연 예술가, 탐험가, 전업 투자자 | 재무 관리자 | 비옥한 밭 |
| 12 | `기_약` | 기토(己土) | 신약 | 키워주는 코치 | 남의 가능성을 알아보고 길러준다 | 교육, 코칭, 육아 콘텐츠 | 감사관, 구조조정 컨설턴트, 개척 영업사원 | 코치 | 작은 텃밭 |
| 13 | `경_강` | 경금(庚金) | 신강 | 결단하는 승부사 | 망설임 없이 자르고 밀어붙인다 | 법조, 투자, 경찰·군인 | 간병인, 고객 상담원, 비서 | 판사 | 벼린 검 |
| 14 | `경_약` | 경금(庚金) | 신약 | 원칙 있는 실무자 | 기준을 지키며 단단해져 간다 | 품질관리, 감사, 엔지니어 | 주식 트레이더, 사회자, 창업가 | 엔지니어 | 다듬어지는 원석 |
| 15 | `신_강` | 신금(辛金) | 신강 | 완벽한 스타일리스트 | 자기만의 기준으로 반짝인다 | 브랜드 디렉터, 패션, 아티스트 | 생산직 사원, 군인, 행정 사무원 | 패션 디렉터 | 빛나는 보석 |
| 16 | `신_약` | 신금(辛金) | 신약 | 디테일 장인 | 남들이 못 보는 작은 차이를 잡아낸다 | 편집자, QA, 세공·공예 | 정치인, 협상 전문가, 응급구조사 | 보석 세공사 | 은빛 바늘 |
| 17 | `임_강` | 임수(壬水) | 신강 | 큰 그림 전략가 | 멀리 보고 크게 움직인다 | 컨설턴트, 무역, 투자 | 서류 관리 사무원, 은행 창구 직원, 공예가 | 선장 | 넓은 바다 |
| 18 | `임_약` | 임수(壬水) | 신약 | 세상을 잇는 연결자 | 사람과 기회를 이어 흐름을 만든다 | 통역, 물류·여행, 네트워커 | 최고경영자, 연구원, 단속 공무원 | 여행 가이드 | 흐르는 강 |
| 19 | `계_강` | 계수(癸水) | 신강 | 꿰뚫는 통찰가 | 조용히 스며들어 본질을 파악한다 | 데이터 분석, 기획, 심리 | 영업 사원, 운동선수, 연예인 | 데이터 탐정 | 스며드는 비 |
| 20 | `계_약` | 계수(癸水) | 신약 | 감성 몽상가 | 섬세한 감각으로 세상을 다르게 본다 | 작가, 음악가, 일러스트레이터 | 영업 사원, 군인, 소방관 | 일러스트레이터 | 새벽 이슬 |

## 4. 화면·공유 카드에서 보이는 것

어디에 어떤 순서로 보이는지는 `specs/analysis/result.md`(§3 인트로, 만세력 탭 ③, 수용 기준 2·13·19). 여기서는 **무엇을 쓰고 무엇을 숨기는가**만.

| 자리 | 보이는 것 | 숨기는 것 |
|---|---|---|
| 결과 인트로 공개 화면 | 그림 → "○○님의 캐릭터" → 유형명 → 한 줄 → 까치 인사 | 선호하는 일·`job`·`name` |
| 만세력 탭 "나의 캐릭터" 카드([✨ 나의 캐릭터 확인하기] 뒤) | 까치 팁 → 그림 → 유형명·한 줄 → **선호하는 일 \| 선호하지 않는 일** 칩 → 기운 % 게이지(가운데 50에서 신강·신약 쪽으로) | `job`·`name` |
| 공유 랜딩 `/s/{id}` 맨 위 상자 | 그림(파일 있을 때) → "○○님의 사주 캐릭터" → 유형명 → 선호하는 일 칩 | 일간·신강/신약 표기·한 줄(2026-10-23)·선호하지 않는 일·`job`·`name` |
| 궁합 결과(인트로 상자·두 분의 캐릭터 카드·공유 랜딩·OG, 2026-10-18) | 두 사람의 그림만 나란히(`character.roles[i].character_key` = 각자의 `key`, `specs/compatibility/character.md` §7) | 유형명·한 줄·선호하는 일 — 궁합 쪽은 칭호·역할 칩이 글자를 맡는다 |
| OG 이미지(링크 미리보기) | 왼쪽 360px 그림(`og/{art_key}.jpg`, 있을 때) → "○○님의 사주 캐릭터" → 유형명(13자) → 팔자 타일 → 선호하는 일 최대 3개 → 구분선 밑 한 줄: 까치 아이콘·"사주까치"(왼쪽) \| "나는 어떤 캐릭터일까? 30초 만에 →"(오른쪽). 제목 "○○님은 {유형명}"(이름 없으면 "나는 …"), 설명은 팔자 요약 | 맨 위 "○○님의 사주 카드" 제목·일간·신강/신약·한 줄·용신 줄(2026-10-23)·이모지(satori가 못 그림)·`name` |

## 5. 규칙

한다
- 유형표·문구의 출처는 `saju_character.py` `_TYPES` 하나. §3 표와 글자까지 같고, 바꿀 때 같은 커밋에서 둘 다 고친다.
- **성별로 그림을 고른다(2026-10-23)**: 백엔드가 캐릭터에 그림 키 `art_key`를 싣는다 — 남성은 `key` 그대로(`갑_강`), 여성은 `{key}_여`(조바위를 쓴 여성판, 부록 E). 분석 결과는 분석 때 성별, 프로필 연도 캐시는 응답 때 프로필 성별로 다시 맞추고, 공유 카드에도 `art_key`만 싣는다(성별 값 자체는 싣지 않음). 궁합은 `roles[i].art_key`가 각자의 성별을 따른다. 화면·랜딩·OG는 `art_key` 그림이 없으면 `key` 그림으로, 그것도 없으면 아래 대체로 떨어진다. 유형 키 `key`는 성별과 무관(표·테스트·궁합 유형 그대로).
- 그림 파일은 `frontend/public/kkachi/saju_character/{key}.webp`(화면용 1024px, 여성판 `{key}_여.webp`)와 `saju_character/og/{key}.jpg`(OG용 512px, satori가 WebP를 못 읽어 따로 둠). 원본 PNG(2048px)도 같은 폴더에 커밋한다(Gemini 워터마크는 그대로). 변환은 `bash scripts/art_convert.sh frontend/public/kkachi/saju_character`.
- 그림이 없으면 화면은 기본 까치(`FALLBACK_IMG`, onError), 공유 랜딩은 파일 존재로 판단해 그림 칸을 비우고, OG는 글자만.
- 같은 그림 파일을 궁합 결과에서도 쓴다(두 사람 나란히, 2026-10-18). 그림을 바꾸면 양쪽에 같이 반영된다.
- 선호하는 일·선호하지 않는 일은 **직업명** 2~3개(분야명·"부동산" 같은 자산명 금지, 2026-10-11). 두 목록은 겹치지 않는다.

하지 않는다
- 중화 유형을 두지 않는다. 일주(日柱) 60개로 쪼개지도 않는다 — 일주는 세부 설명용.
- 자연물 비유 이름(`name`)과 대표 직업(`job`)을 화면·공유 카드·OG에 쓰지 않는다 — 유치해 보여서(2026-10-11, 사용자 결정).
- 프론트가 유형을 다시 계산하지 않는다. `lib/ganji.ts`·`SajuCharacterCard`의 천간 표는 이모지·색 같은 표시 메타만(해석 분기 금지).

## 6. 수용 기준

1. 어떤 생년월일이든 `natal.character.key`는 `갑_강`…`계_약` 20개 중 하나이고, `strength_pct`가 50 이상이면 `_강`, 아니면 `_약`이다.
2. 20유형 모두 `title`·`line`·`job`이 비어 있지 않고 `jobs`는 2~3개, `jobs_avoid`는 3개이며 두 목록이 겹치지 않는다. §3 표는 `_TYPES`와 칸마다 같다 (`tests/application/test_saju_character.py`).
3. `saju_character/{key}.webp` 20장과 `saju_character/og/{key}.jpg` 20장이 모두 있다.
4. 인트로·나의 캐릭터 카드·공유 랜딩·OG 어디에도 `name`(우뚝 선 산 등)과 `job`(CEO 등)이 보이지 않는다. 보이는 글자는 유형명·한 줄·선호하는 일(·선호하지 않는 일은 카드에서만)까지다.
5. 공유 링크 미리보기 제목은 "○○님은 {유형명}"이고, OG 그림은 왼쪽, 오른쪽에 유형명·한 줄·팔자 타일·선호하는 일 최대 3개가 있다. `og/{key}.jpg`를 지우면 글자만 남고 레이아웃이 깨지지 않는다.
6. 그림 파일을 지워도 화면은 기본 까치로 떨어지고 콘솔 에러 없이 나머지가 그대로 보인다.

## 7. 열린 결정

| 항목 | 누가 | 메모 |
|---|---|---|
| 선호하는 일·선호하지 않는 일 직업명 다듬기 | 사용자 | 2026-10-11 1차 정리(라벨·직업명). 남은 어색한 항목은 §3 표와 `_TYPES` 동시에 |
| 그림 재생성(워터마크·짝 일관성) | 사용자 | 지금 20장은 Gemini 원본 그대로. 다시 만들면 부록 D 프롬프트 → `scripts/art_convert.sh` |

## 8. 변경 이력

| 날짜 | 변경 | 왜 |
|---|---|---|
| 2026-10-23 | **공유 카드 정리** — "○○님의 사주 캐릭터" 라벨, 일간·신강/신약 표기·한 줄 설명·용신 줄·맨 위 제목 제거, OG는 그림 360px + 구분선 밑 한 줄(까치·사주까치 \| CTA), 링크 미리보기 설명은 팔자 요약만 | 사용자 지시(어색한 표현·불필요한 정보) |
| 2026-10-23 | **여성판 그림 20장 + 성별로 고르기** — 조바위·댕기·노리개를 단 여성 까치(부록 E, 원본 `saju_character/og_여/{key}_여.png` → `{key}_여.webp`·`og/{key}_여.jpg`). 백엔드 `art_key`(분석·프로필 캐시·공유 카드·궁합 roles), 화면·랜딩·OG는 `art_key` → `key` → 대체 순 | 남녀가 같은 그림을 보면 품질이 떨어져 보여서(사용자 지시) |
| 2026-10-18 | 궁합 결과(인트로·카드·랜딩·OG)에서 두 사람의 캐릭터 그림을 재사용 | 궁합 전용 15장 대신(사용자 결정) |
| 2026-10-17 | `docs/SAJU_CHARACTER_TYPES.md` → `specs/analysis/character.md`. 유형이 정해지는 방식·노출 규칙·수용 기준을 추가하고 표를 코드에서 다시 만들었다(대표 직업·캐릭터 열 추가, 대조 테스트). 그림 제작 자료는 부록으로 | 유형표·노출 규칙은 코드가 지키는 약속이라 스펙(사용자 결정) |
| 2026-10-17 | 복붙용 통합 프롬프트를 `SAJU_CHARACTER_PROMPTS.md`에서 이 문서로 합침 | 문서 정리 |
| 2026-10-16 | 공유 카드·OG에 그림(`og/{key}.jpg`)·유형명·선호하는 일 | V4 |
| 2026-10-11 | 유형표·그림 20장(직업 의인화)·강약 판정 `strength_pct`·라벨 "선호하는 일 \| 선호하지 않는 일"·직업명 정리 | V4 |

---

## 부록 — 그림 제작 자료

화면이나 표를 고칠 때는 읽지 않아도 된다. 그림을 새로 만들거나 고칠 때만. 그림은 외부(Gemini)에서 기준 까치 `frontend/public/kkachi/strength/신강.png`를 첨부해 만들고, 원본 PNG를 `frontend/public/kkachi/saju_character/{key}.png`로 저장한 뒤 `scripts/art_convert.sh`로 WebP·JPG를 만든다.

## 부록 A. 생성 순서

1. 기준 그림 `frontend/public/kkachi/strength/신강.png`를 첨부하고 **공통 프롬프트(부록 B) + 유형별 장면(부록 C)**을 붙여 넣는다. (첫 시안은 자연물 장면이라 유형이 한눈에 안 읽혀서 **대표 직업으로 의인화**하는 방식으로 바꿈, 2026-10-11)
2. 일간마다 **신강을 먼저** 만들고, 마음에 드는 신강 그림을 다시 첨부해 "같은 배경·같은 까치로 신약 버전" 프롬프트로 신약을 만든다 → 짝끼리 배경이 이어져 보인다.
3. 결과에 글자가 들어가면 "remove all text" 로 한 번 더 요청한다.

## 부록 B. 공통 프롬프트 (매번 맨 앞에 붙임)

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Profession and scene:
```

신약 변형 프롬프트 (같은 일간의 신강 그림을 첨부해서):

```
Keep the same magpie, the same art style and a similar color palette as the attached image.
Change the profession and scene to the one described below.
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends).
It must look kind and content, NOT weak, sad or sick. No text of any kind.
Profession and scene:
```

## 부록 C. 유형별 직업 의인화 장면 (`Profession and scene:` 뒤에 붙임)

강/약 원칙: **신강 = 혼자 무대의 중심, 당당한 포즈, 강한 빛** · **신약 = 누군가를 돕거나 함께 일하는 장면, 부드러운 빛**

| # | 파일명 | 대표 직업 | Profession and scene |
|---|---|---|---|
| 1 | `갑_강.png` | 창업가 | Startup founder. Smart modern hanbok-style blazer, confidently pitching on a small stage, one wing pointing at a big screen showing a rising arrow drawing, a sapling growing out of a pot on the podium. Wood accent: a huge tree silhouette behind the window. Deep green palette, bold spotlight. |
| 2 | `갑_약.png` | 선생님 | Kind teacher. Cardigan and round glasses, standing at a chalkboard with only simple drawings of a tree and leaves, teaching a row of baby chick students at tiny desks, each desk with a small sprout pot. Fresh green palette, soft classroom sunlight. |
| 3 | `을_강.png` | 영업왕 | Top salesperson. Sharp suit with a small wildflower pinned on the lapel, briefcase in one wing, giving a firm wing-shake to a bird client, determined grin, busy city street with flowers growing from cracks in the pavement. Green and pink palette. |
| 4 | `을_약.png` | 플로리스트 | Florist. Linen apron, arranging a beautiful bouquet in a cozy flower shop full of climbing vines and hanging plants, a small sparrow customer smiling at the counter. Pastel green and lilac palette, soft spring light. |
| 5 | `병_강.png` | 방송인·MC | TV host. Shiny stage outfit, holding a microphone with wings spread wide in the center of a stage, big round sun-like spotlights behind, confetti in the air. Bright red and gold palette. |
| 6 | `병_약.png` | 유치원 선생님 | Kindergarten teacher. Bright apron, handing out sun-shaped balloons to happy baby chicks in a sunny playground, everyone smiling. Soft orange and peach palette, warm morning glow. |
| 7 | `정_강.png` | 셰프 | Master chef. White chef jacket (still wearing the gat), focused eyes, tossing a flaming wok over a roaring stove, sparks and fire glowing in a professional kitchen. Deep red and ember-orange palette. |
| 8 | `정_약.png` | 간호사 | Caring nurse. Nurse uniform, holding a small warm lantern-like lamp at night, gently checking on a little bird resting in a cozy bed, hanji paper window. Warm candle-amber palette, comforting mood. |
| 9 | `무_강.png` | CEO | Company CEO. Dignified dark suit, standing tall behind a big wooden desk, arms crossed, calm and reliable expression, a huge window showing majestic mountains above the clouds. Ochre and stone-brown palette. |
| 10 | `무_약.png` | 중재자·상담가 | Mediator. Soft hanbok vest, sitting at a round table pouring tea for two small birds who just made up, peaceful smiles, window showing gentle rolling hills at sunset. Warm beige and grass-green palette. |
| 11 | `기_강.png` | 재무·PM | Project manager / finance pro. Neat vest and arm sleeves, clipboard in one wing and a traditional abacus in the other, standing in front of a tidy board of picture-only sticky notes, baskets of golden harvest neatly stacked. Golden yellow and brown palette. |
| 12 | `기_약.png` | 코치 | Coach. Track jacket and a whistle, cheering on baby chicks practicing in a small grassy field next to a vegetable patch, giving a thumbs-up wing. Soft brown and sprout-green palette, nurturing morning light. |
| 13 | `경_강.png` | 판사 | Judge. Black judge robe over the feathers, raising a wooden gavel with a decisive fierce expression, a gleaming silver balance scale beside, sharp clean courtroom light. Silver-white and steel-blue palette. |
| 14 | `경_약.png` | 엔지니어·품질관리 | Engineer. Safety vest and a small headlamp strapped to the gat, carefully inspecting a shiny gear with a magnifying glass, tools lined up neatly on a workbench, a small owl apprentice taking notes with drawings. Cool grey and silver palette. |
| 15 | `신_강.png` | 패션 디렉터 | Fashion director. Stylish tailored outfit with a sparkling gemstone brooch on the gat, posing on a runway under glittering lights, camera flashes around. White-gold and jewel-tone palette. |
| 16 | `신_약.png` | 보석 세공사 | Jewelry craftsman. Leather apron and a jeweler's loupe on one eye, delicately setting a tiny sparkling gem into a silver ring with fine tweezers, a small mouse helper holding the lamp. Silver and pale lavender palette, focused lamp light. |
| 17 | `임_강.png` | 선장·무역가 | Trading ship captain. Captain's coat, standing at the helm of a traditional ship on the vast ocean, holding a telescope toward the horizon, a globe and rolled maps (no writing) beside. Deep navy and teal palette, big waves. |
| 18 | `임_약.png` | 여행 가이드 | Travel guide. Explorer vest and a small blank flag, leading a happy group of tourist birds along a winding riverside path, pointing at a beautiful view. Clear blue and jade palette, gentle flowing light. |
| 19 | `계_강.png` | 데이터 분석가·탐정 | Analyst-detective. Long coat, holding a magnifying glass, studying a wall of glowing picture-only charts and connected photos with red strings, rainy night window behind. Indigo and silver-blue palette, mysterious insightful mood. |
| 20 | `계_약.png` | 일러스트레이터 | Illustrator. Paint-smudged smock (keep only the gat, no beret), painting a dreamy picture at an easel in a dawn meadow covered with sparkling dewdrops, a small bird friend holding the palette. Pastel blue and dawn-pink palette. |

## 부록 D. 복붙용 통합 이미지 프롬프트

> 부록 B 공통 프롬프트 + 부록 C 유형별 장면을 하나로 합친 것(2026-10-17 `SAJU_CHARACTER_PROMPTS.md`에서 합침 — 궁합 `specs/compatibility/character.md` 부록 B와 같은 자리). 장면을 고치면 부록 C를 먼저 고치고 여기를 다시 만든다.
> 사용법: Gemini에 기준 까치 `frontend/public/kkachi/strength/신강.png`를 첨부하고 아래 블록 하나를 그대로 붙여 넣는다. 신약은 같은 일간의 신강 결과도 함께 첨부하면 짝이 더 잘 맞는다. 원본 PNG는 `frontend/public/kkachi/saju_character/{파일명}`에 저장하고 `scripts/art_convert.sh`로 화면용 WebP·OG용 JPG를 만든다(화면은 WebP만 사용).

### Part 1. 신강(身強) 10종

#### 1. 갑목(甲木) 신강 — 숲의 대장 나무 · 개척하는 리더 (창업가) → `갑_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Startup founder. Smart modern hanbok-style blazer, confidently pitching on a small stage, one wing pointing at a big screen showing a rising arrow drawing, a sapling growing out of a pot on the podium. Wood accent: a huge tree silhouette behind the window. Deep green palette, bold spotlight.
```

#### 2. 을목(乙木) 신강 — 바위틈 들꽃 · 끈질긴 생존가 (영업왕) → `을_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Top salesperson. Sharp suit with a small wildflower pinned on the lapel, briefcase in one wing, giving a firm wing-shake to a bird client, determined grin, busy city street with flowers growing from cracks in the pavement. Green and pink palette.
```

#### 3. 병화(丙火) 신강 — 한낮의 태양 · 무대 위 주인공 (방송인·MC) → `병_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
TV host. Shiny stage outfit, holding a microphone with wings spread wide in the center of a stage, big round sun-like spotlights behind, confetti in the air. Bright red and gold palette.
```

#### 4. 정화(丁火) 신강 — 대장간 불꽃 · 꺼지지 않는 장인 (셰프) → `정_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Master chef. White chef jacket (still wearing the gat), focused eyes, tossing a flaming wok over a roaring stove, sparks and fire glowing in a professional kitchen. Deep red and ember-orange palette.
```

#### 5. 무토(戊土) 신강 — 우뚝 선 산 · 든든한 수호자 (CEO) → `무_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Company CEO. Dignified dark suit, standing tall behind a big wooden desk, arms crossed, calm and reliable expression, a huge window showing majestic mountains above the clouds. Ochre and stone-brown palette.
```

#### 6. 기토(己土) 신강 — 비옥한 밭 · 실속 있는 운영자 (재무·PM) → `기_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Project manager / finance pro. Neat vest and arm sleeves, clipboard in one wing and a traditional abacus in the other, standing in front of a tidy board of picture-only sticky notes, baskets of golden harvest neatly stacked. Golden yellow and brown palette.
```

#### 7. 경금(庚金) 신강 — 벼린 검 · 결단하는 승부사 (판사) → `경_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Judge. Black judge robe over the feathers, raising a wooden gavel with a decisive fierce expression, a gleaming silver balance scale beside, sharp clean courtroom light. Silver-white and steel-blue palette.
```

#### 8. 신금(辛金) 신강 — 빛나는 보석 · 완벽한 스타일리스트 (패션 디렉터) → `신_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Fashion director. Stylish tailored outfit with a sparkling gemstone brooch on the gat, posing on a runway under glittering lights, camera flashes around. White-gold and jewel-tone palette.
```

#### 9. 임수(壬水) 신강 — 넓은 바다 · 큰 그림 전략가 (선장·무역가) → `임_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Trading ship captain. Captain's coat, standing at the helm of a traditional ship on the vast ocean, holding a telescope toward the horizon, a globe and rolled maps (no writing) beside. Deep navy and teal palette, big waves.
```

#### 10. 계수(癸水) 신강 — 스며드는 비 · 꿰뚫는 통찰가 (데이터 분석가·탐정) → `계_강.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: confident and bold — the magpie is the center of the scene, strong pose, strong light.
Profession and scene:
Analyst-detective. Long coat, holding a magnifying glass, studying a wall of glowing picture-only charts and connected photos with red strings, rainy night window behind. Indigo and silver-blue palette, mysterious insightful mood.
```

---

### Part 2. 신약(身弱) 10종

> 같은 일간의 신강 결과를 함께 첨부하면 짝이 더 잘 맞는다.

#### 11. 갑목(甲木) 신약 — 숲을 이루는 어린 나무 · 함께 크는 성장가 (선생님) → `갑_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Kind teacher. Cardigan and round glasses, standing at a chalkboard with only simple drawings of a tree and leaves, teaching a row of baby chick students at tiny desks, each desk with a small sprout pot. Fresh green palette, soft classroom sunlight.
```

#### 12. 을목(乙木) 신약 — 정원의 덩굴꽃 · 섬세한 조율가 (플로리스트) → `을_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Florist. Linen apron, arranging a beautiful bouquet in a cozy flower shop full of climbing vines and hanging plants, a small sparrow customer smiling at the counter. Pastel green and lilac palette, soft spring light.
```

#### 13. 병화(丙火) 신약 — 아침 햇살 · 분위기 메이커 (유치원 선생님) → `병_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Kindergarten teacher. Bright apron, handing out sun-shaped balloons to happy baby chicks in a sunny playground, everyone smiling. Soft orange and peach palette, warm morning glow.
```

#### 14. 정화(丁火) 신약 — 창가의 촛불 · 마음을 밝히는 사람 (간호사) → `정_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Caring nurse. Nurse uniform, holding a small warm lantern-like lamp at night, gently checking on a little bird resting in a cozy bed, hanji paper window. Warm candle-amber palette, comforting mood.
```

#### 15. 무토(戊土) 신약 — 완만한 언덕 · 품어주는 중재자 (중재자·상담가) → `무_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Mediator. Soft hanbok vest, sitting at a round table pouring tea for two small birds who just made up, peaceful smiles, window showing gentle rolling hills at sunset. Warm beige and grass-green palette.
```

#### 16. 기토(己土) 신약 — 작은 텃밭 · 키워주는 코치 (코치) → `기_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Coach. Track jacket and a whistle, cheering on baby chicks practicing in a small grassy field next to a vegetable patch, giving a thumbs-up wing. Soft brown and sprout-green palette, nurturing morning light.
```

#### 17. 경금(庚金) 신약 — 다듬어지는 원석 · 원칙 있는 실무자 (엔지니어·품질관리) → `경_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Engineer. Safety vest and a small headlamp strapped to the gat, carefully inspecting a shiny gear with a magnifying glass, tools lined up neatly on a workbench, a small owl apprentice taking notes with drawings. Cool grey and silver palette.
```

#### 18. 신금(辛金) 신약 — 은빛 바늘 · 디테일 장인 (보석 세공사) → `신_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Jewelry craftsman. Leather apron and a jeweler's loupe on one eye, delicately setting a tiny sparkling gem into a silver ring with fine tweezers, a small mouse helper holding the lamp. Silver and pale lavender palette, focused lamp light.
```

#### 19. 임수(壬水) 신약 — 흐르는 강 · 세상을 잇는 연결자 (여행 가이드) → `임_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Travel guide. Explorer vest and a small blank flag, leading a happy group of tourist birds along a winding riverside path, pointing at a beautiful view. Clear blue and jade palette, gentle flowing light.
```

#### 20. 계수(癸水) 신약 — 새벽 이슬 · 감성 몽상가 (일러스트레이터) → `계_약.png`

```
Use the attached image as the character reference. Redraw the SAME magpie character:
a cute chibi Korean magpie wearing a black traditional Korean gat hat with a chin strap tied in a small bow,
black-and-white plumage with blue-tinted wing feathers, big expressive amber eyes, small grey beak.
Keep the character design, proportions, colors and the gat exactly the same as the reference.
ANTHROPOMORPHIZE it: the magpie stands upright like a person, wears the outfit of the profession below
and uses its wings like hands to hold the profession's tools. Always keep the gat on.
The profession must be instantly recognizable at a glance, even as a small thumbnail.
Add the element motif only as a subtle accent in the background or props.
Style: the same as the reference — clean cartoon line art, soft painterly watercolor background,
warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), the magpie centered, full body, about 60% of the image height,
at least 10% empty margin on every side (the image will be cropped to other ratios).
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs must show only pictures or blank shapes).
Mood: warm, gentle and cooperative — the magpie works WITH others (small birds, chicks, friends). It must look kind and content, NOT weak, sad or sick.
Profession and scene:
Illustrator. Paint-smudged smock (keep only the gat, no beret), painting a dreamy picture at an easel in a dawn meadow covered with sparkling dewdrops, a small bird friend holding the palette. Pastel blue and dawn-pink palette.
```


## 부록 E. 여성판 그림 프롬프트 (2026-10-23 초안)

지금 20장은 모두 갓(남성 양반 모자)을 쓴 남성 까치라, 여성 사용자도 같은 그림을 본다. 여성판 20장을 **같은 장면·같은 직업·같은 구도**로 만들어 짝을 맞춘다. 직업은 바꾸지 않는다(성별로 직업을 나누지 않음).

**디자인 결정(초안)**
- 갓 대신 **조바위**(조선 여성의 검은 비단 방한모 — 정수리가 트이고 귀를 덮으며, 앞뒤에 붉은 술·작은 옥 장식). 검은 모자 실루엣이 남아 "갓 쓴 까치" 브랜드가 이어진다.
- 뒷머리 깃털 한 가닥을 땋아 **붉은 댕기**, 가슴께 작은 **노리개** 술 하나. 속눈썹 조금, 볼 홍조 조금.
- 몸 비율·깃털 색·눈 색·부리는 남성판과 똑같이. 옷은 같은 직업복을 여성 체형에 맞게(한복풍이면 저고리+치마).
- 하지 않는 것: 직업·포즈·배경·조연 새 바꾸기, 핑크 일색, 짙은 화장, 리본 과다.

**생성 순서**
1. **여성 기준 까치 1장**을 먼저 만든다(아래 E-1) — 기준 그림 `frontend/public/kkachi/strength/신강.png` 첨부. 결과는 `frontend/public/kkachi/originals/까치_여.png`(2026-10-23 완료). 짝이 되는 **남성 기준** `originals/까치_남.png`는 E-0으로 만든다.
2. 유형마다 **남성판 그림 `saju_character/{key}.png` + 여성 기준 `originals/까치_여.png`** 두 장을 첨부하고 E-2를 붙여 넣는다(2026-10-23 20장 완료, `saju_character/og_여/{key}_여.png` — 생성 시각이 아니라 직업 장면으로 이름 매핑).
3. 원본은 `frontend/public/kkachi/saju_character/{key}_여.png`(예 `갑_강_여.png`)로 저장 → `bash scripts/art_convert.sh frontend/public/kkachi/saju_character`(WebP·OG JPG 자동).
4. 화면 연결(성별로 `{key}_여.webp` 고르고 없으면 남성판으로)은 그림이 다 모인 뒤 코드 작업 — 열린 결정 참고.

### E-0. 남성 기준 까치 (1회, 여성 기준과 짝)

`originals/까치_여.png`(자세·배경·화풍) + `strength/신강.png`(갓 모양) 두 장을 첨부한다. 결과는 `originals/까치_남.png`(2026-10-23 완료). 남성판 새 그림을 만들 때 첫 장면 참고 대신 기준으로 쓴다.

```
Two images are attached.
Image 1 = the pose, framing, background and art-style reference (a female magpie).
Image 2 = the hat reference (a male magpie wearing a black gat).
Draw the MALE version of the magpie in Image 1 with EXACTLY the same pose, camera angle, size in frame,
plain warm off-white watercolor background, line weight, shading and color palette as Image 1.
Same chibi body proportions, black-and-white plumage with blue-tinted wing feathers, big amber eyes, small grey beak.
Changes for the male version:
- Replace the jobawi cap with the black traditional Korean gat from Image 2: wide flat brim, tall crown,
  black chin strap tied in a small bow under the beak.
- Remove the braid, the red daenggi ribbon, the norigae ornament and the eyelashes. Keep a light blush only.
- Calm, friendly, confident expression (not angry).
Composition: square 1:1 (1024x1024), magpie centered, full body, about 60% of the image height, 10% margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
```

### E-1. 여성 기준 까치 (1회)

```
Use the attached image as the character reference. Redraw the SAME cute chibi Korean magpie character
as a FEMALE version. Keep the body proportions, black-and-white plumage with blue-tinted wing feathers,
big expressive amber eyes, small grey beak, line art and painterly style exactly the same.
Changes for the female version:
- Replace the black gat hat with a black silk "jobawi" (traditional Korean women's winter cap):
  open crown, rounded sides covering the ears, a small red silk tassel and a tiny jade ornament on the front and back.
  It must keep a dark, clearly visible headwear silhouette similar in size to the gat.
- One braided feather lock at the back of the head tied with a red "daenggi" ribbon.
- A small "norigae" tassel ornament hanging at the chest.
- Slightly longer eyelashes and a soft blush on the cheeks. Friendly, confident expression.
Do NOT make everything pink, no heavy makeup, no extra bows, no jewelry other than the jobawi ornament and norigae.
Pose: standing upright, full body, front three-quarter view, wings relaxed. Plain soft watercolor background.
Composition: square 1:1 (1024x1024), magpie centered, about 60% of the image height, 10% margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks.
```

### E-2. 유형별 여성판 (20회, 장면 설명 없이 같은 블록)

```
Two images are attached.
Image 1 = the scene reference (male version). Image 2 = the female character reference.
Recreate Image 1 as faithfully as possible — the SAME profession, outfit type, pose, props, background,
supporting characters, color palette, lighting and composition — but replace the magpie with the FEMALE magpie from Image 2.
- The jobawi cap replaces the gat. Anything attached to the gat in Image 1 (brooch, headlamp, etc.)
  goes on the jobawi instead. Keep the red daenggi ribbon and the small norigae.
- Tailor the outfit for a woman but keep it the same profession and instantly recognizable
  (a hanbok-style outfit becomes a jeogori jacket with a chima skirt; suits, coats, uniforms and aprons stay the same kind).
- Keep the mood of Image 1 (confident and bold, or warm and cooperative).
Style: clean cartoon line art, soft painterly watercolor background, warm cinematic lighting, gentle glow particles.
Composition: square 1:1 (1024x1024), magpie centered, full body, about 60% of the image height, at least 10% margin on every side.
Absolutely NO text, letters, numbers, Korean/Chinese characters, logos, signatures or watermarks
(screens, boards, books and signs show only pictures or blank shapes).
```

결과에 글자가 들어가면 "remove all text, keep everything else the same"으로 한 번 더 요청한다. 짝(같은 일간의 신강·신약)끼리 조바위·댕기 색이 다르게 나오면, 먼저 만든 쪽 여성판을 Image 2 대신 첨부해 맞춘다.
