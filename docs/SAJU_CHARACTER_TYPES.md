# 사주 캐릭터 20유형 — 유형표와 이미지 생성 프롬프트

> 작성: 2026-10-11 · 유형 = 일간(日干) 10 × 신강/신약 2. 중화는 가까운 쪽으로 붙인다(판정 로직 개선 A안 진행 중)
> 그림은 외부(Gemini)에서 기준 까치(`frontend/public/kkachi/strength/신강.png`)를 첨부해 생성. 저장 위치: `frontend/public/kkachi/saju_character/{일간}_{강|약}.webp` (예 `갑_강.webp`, 1024px). Gemini 원본 PNG(2048px)도 같은 폴더에 둔다(화면은 WebP만 사용)

## 1. 유형표

| # | 파일명 | 일간 | 강약 | 캐릭터 | 유형명 | 한 줄 성향 | 선호하는 일 | 선호하지 않는 일 |
|---|---|---|---|---|---|---|---|---|
| 1 | `갑_강.png` | 갑목(甲木) | 신강 | 숲의 대장 나무 | 개척하는 리더 | 먼저 길을 내고 사람들을 이끈다 | 창업가, 기획자, 행정가 | 비서, 사무 보조원, 경리 |
| 2 | `갑_약.png` | 갑목(甲木) | 신약 | 숲을 이루는 어린 나무 | 함께 크는 성장가 | 혼자보다 함께 클 때 가장 높이 자란다 | 교사, HR, 커뮤니티 매니저 | 보험 설계사, 1인 사업가, 주식 트레이더 |
| 3 | `을_강.png` | 을목(乙木) | 신강 | 바위틈 들꽃 | 끈질긴 생존가 | 어떤 환경에서도 결국 꽃을 피운다 | 영업, 협상가, 스타트업 운영 | 이론 연구원, 행정 공무원, 생산직 사원 |
| 4 | `을_약.png` | 을목(乙木) | 신약 | 정원의 덩굴꽃 | 섬세한 조율가 | 분위기와 관계를 읽고 부드럽게 엮는다 | 디자이너, 상담사, 플로리스트 | 협상 전문가, 경찰관, 현장 소장 |
| 5 | `병_강.png` | 병화(丙火) | 신강 | 한낮의 태양 | 무대 위 주인공 | 존재만으로 주목받고 판을 밝힌다 | 방송인, 마케터, 연설가 | 회계사, 관제사, 연구 분석가 |
| 6 | `병_약.png` | 병화(丙火) | 신약 | 아침 햇살 | 분위기 메이커 | 주변을 따뜻하게 데우는 사람 | 홍보, 서비스 기획, 유아교육 | 구조조정 컨설턴트, 연구원, 감사관 |
| 7 | `정_강.png` | 정화(丁火) | 신강 | 대장간 불꽃 | 꺼지지 않는 장인 | 한 가지에 몰입해 끝까지 벼려낸다 | 연구원, 엔지니어, 셰프 | 외근 영업사원, 콜센터 상담원, 행사 MC |
| 8 | `정_약.png` | 정화(丁火) | 신약 | 창가의 촛불 | 마음을 밝히는 사람 | 조용히 곁을 지키며 길을 비춘다 | 상담사, 작가, 간호사 | 주식 트레이더, 무대 배우, 영업 사원 |
| 9 | `무_강.png` | 무토(戊土) | 신강 | 우뚝 선 산 | 든든한 수호자 | 흔들리지 않고 모두의 기준점이 된다 | 경영자, 공무원 | 트렌드 마케터, 프리랜서, 서비스직 |
| 10 | `무_약.png` | 무토(戊土) | 신약 | 완만한 언덕 | 품어주는 중재자 | 갈등을 받아내고 균형을 맞춘다 | 인사, 사회복지, 중재·조정 | 최고경영자, 운동선수, 전업 투자자 |
| 11 | `기_강.png` | 기토(己土) | 신강 | 비옥한 밭 | 실속 있는 운영자 | 가진 것을 계획적으로 불려 간다 | PM, 재무, 운영관리 | 공연 예술가, 탐험가, 전업 투자자 |
| 12 | `기_약.png` | 기토(己土) | 신약 | 작은 텃밭 | 키워주는 코치 | 남의 가능성을 알아보고 길러준다 | 교육, 코칭, 육아 콘텐츠 | 감사관, 구조조정 컨설턴트, 개척 영업사원 |
| 13 | `경_강.png` | 경금(庚金) | 신강 | 벼린 검 | 결단하는 승부사 | 망설임 없이 자르고 밀어붙인다 | 법조, 투자, 경찰·군인 | 간병인, 고객 상담원, 비서 |
| 14 | `경_약.png` | 경금(庚金) | 신약 | 다듬어지는 원석 | 원칙 있는 실무자 | 기준을 지키며 단단해져 간다 | 품질관리, 감사, 엔지니어 | 주식 트레이더, 사회자, 창업가 |
| 15 | `신_강.png` | 신금(辛金) | 신강 | 빛나는 보석 | 완벽한 스타일리스트 | 자기만의 기준으로 반짝인다 | 브랜드 디렉터, 패션, 아티스트 | 생산직 사원, 군인, 행정 사무원 |
| 16 | `신_약.png` | 신금(辛金) | 신약 | 은빛 바늘 | 디테일 장인 | 남들이 못 보는 작은 차이를 잡아낸다 | 편집자, QA, 세공·공예 | 정치인, 협상 전문가, 응급구조사 |
| 17 | `임_강.png` | 임수(壬水) | 신강 | 넓은 바다 | 큰 그림 전략가 | 멀리 보고 크게 움직인다 | 컨설턴트, 무역, 투자 | 서류 관리 사무원, 은행 창구 직원, 공예가 |
| 18 | `임_약.png` | 임수(壬水) | 신약 | 흐르는 강 | 세상을 잇는 연결자 | 사람과 기회를 이어 흐름을 만든다 | 통역, 물류·여행, 네트워커 | 최고경영자, 연구원, 단속 공무원 |
| 19 | `계_강.png` | 계수(癸水) | 신강 | 스며드는 비 | 꿰뚫는 통찰가 | 조용히 스며들어 본질을 파악한다 | 데이터 분석, 기획, 심리 | 영업 사원, 운동선수, 연예인 |
| 20 | `계_약.png` | 계수(癸水) | 신약 | 새벽 이슬 | 감성 몽상가 | 섬세한 감각으로 세상을 다르게 본다 | 작가, 음악가, 일러스트레이터 | 영업 사원, 군인, 소방관 |

## 2. 생성 순서

1. 기준 그림 `strength/신강.png`를 첨부하고 (첫 시안 `docs/Gemini_Generated_Image_aoxdifaoxdifaoxd.png`는 자연물 장면이라 유형이 한눈에 안 읽혀서, **대표 직업으로 의인화**하는 방식으로 바꿈) **공통 프롬프트 + 유형별 장면**을 붙여 넣는다.
2. 일간마다 **신강을 먼저** 만들고, 마음에 드는 신강 그림을 다시 첨부해 "같은 배경·같은 까치로 신약 버전" 프롬프트로 신약을 만든다 → 짝끼리 배경이 이어져 보인다.
3. 결과에 글자가 들어가면 "remove all text" 로 한 번 더 요청한다.

## 3. 공통 프롬프트 (매번 맨 앞에 붙임)

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

## 4. 유형별 직업 의인화 장면 (`Profession and scene:` 뒤에 붙임)

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

---

## 5. 복붙용 통합 이미지 프롬프트

> 위 §3 공통 프롬프트 + §4 유형별 장면을 하나로 합친 것(2026-10-17 `SAJU_CHARACTER_PROMPTS.md`에서 이 문서로 합침 — 궁합 `COMPAT_CHARACTER_TYPES.md` §7과 같은 자리). 장면을 고치면 §4를 먼저 고치고 여기를 다시 만든다.
> 사용법: Gemini에 기준 까치 `frontend/public/kkachi/strength/신강.png`를 첨부하고 아래 블록 하나를 그대로 붙여 넣는다. 신약은 같은 일간의 신강 결과도 함께 첨부하면 짝이 더 잘 맞는다. 원본 PNG는 `frontend/public/kkachi/saju_character/{파일명}`에 저장하고, 같은 폴더에 화면용 1024px WebP로 변환해 둔다(화면은 WebP만 사용)

---

# Part 1. 신강(身強) 10종

### 1. 갑목(甲木) 신강 — 숲의 대장 나무 · 개척하는 리더 (창업가) → `갑_강.png`

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

### 2. 을목(乙木) 신강 — 바위틈 들꽃 · 끈질긴 생존가 (영업왕) → `을_강.png`

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

### 3. 병화(丙火) 신강 — 한낮의 태양 · 무대 위 주인공 (방송인·MC) → `병_강.png`

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

### 4. 정화(丁火) 신강 — 대장간 불꽃 · 꺼지지 않는 장인 (셰프) → `정_강.png`

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

### 5. 무토(戊土) 신강 — 우뚝 선 산 · 든든한 수호자 (CEO) → `무_강.png`

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

### 6. 기토(己土) 신강 — 비옥한 밭 · 실속 있는 운영자 (재무·PM) → `기_강.png`

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

### 7. 경금(庚金) 신강 — 벼린 검 · 결단하는 승부사 (판사) → `경_강.png`

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

### 8. 신금(辛金) 신강 — 빛나는 보석 · 완벽한 스타일리스트 (패션 디렉터) → `신_강.png`

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

### 9. 임수(壬水) 신강 — 넓은 바다 · 큰 그림 전략가 (선장·무역가) → `임_강.png`

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

### 10. 계수(癸水) 신강 — 스며드는 비 · 꿰뚫는 통찰가 (데이터 분석가·탐정) → `계_강.png`

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

# Part 2. 신약(身弱) 10종

> 같은 일간의 신강 결과를 함께 첨부하면 짝이 더 잘 맞는다.

### 11. 갑목(甲木) 신약 — 숲을 이루는 어린 나무 · 함께 크는 성장가 (선생님) → `갑_약.png`

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

### 12. 을목(乙木) 신약 — 정원의 덩굴꽃 · 섬세한 조율가 (플로리스트) → `을_약.png`

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

### 13. 병화(丙火) 신약 — 아침 햇살 · 분위기 메이커 (유치원 선생님) → `병_약.png`

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

### 14. 정화(丁火) 신약 — 창가의 촛불 · 마음을 밝히는 사람 (간호사) → `정_약.png`

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

### 15. 무토(戊土) 신약 — 완만한 언덕 · 품어주는 중재자 (중재자·상담가) → `무_약.png`

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

### 16. 기토(己土) 신약 — 작은 텃밭 · 키워주는 코치 (코치) → `기_약.png`

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

### 17. 경금(庚金) 신약 — 다듬어지는 원석 · 원칙 있는 실무자 (엔지니어·품질관리) → `경_약.png`

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

### 18. 신금(辛金) 신약 — 은빛 바늘 · 디테일 장인 (보석 세공사) → `신_약.png`

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

### 19. 임수(壬水) 신약 — 흐르는 강 · 세상을 잇는 연결자 (여행 가이드) → `임_약.png`

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

### 20. 계수(癸水) 신약 — 새벽 이슬 · 감성 몽상가 (일러스트레이터) → `계_약.png`

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
