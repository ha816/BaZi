export const STEM_PROFILE: Record<string, { nickname: string; tagline: string; keywords: string[]; hint: string }> = {
  "甲": { nickname: "큰 나무",  tagline: "큰 나무 (大林木)",              keywords: ["도전", "리더십", "직진본능", "자존심"],   hint: "고집이 세 보일 수 있지만, 그 뚝심이 당신의 가장 큰 무기예요." },
  "乙": { nickname: "화초",     tagline: "화초 · 덩굴 (花草木)",          keywords: ["유연함", "친화력", "적응력", "눈치"],      hint: "부드럽게 감아 올라가는 덩굴처럼 관계와 환경을 내 편으로 만드는 능력이 있어요." },
  "丙": { nickname: "태양",     tagline: "태양 · 큰 불 (太陽火)",         keywords: ["열정", "존재감", "솔직함", "에너지"],     hint: "어딜 가도 존재감이 넘쳐요. 무대 위에 서면 더욱 빛나는 타입입니다." },
  "丁": { nickname: "촛불",     tagline: "촛불 · 등불 (燈燭火)",          keywords: ["섬세함", "집중력", "감수성", "예리함"],   hint: "겉으론 조용해 보여도 속에 깊은 열정이 있어요. 집중할 때의 몰입력이 대단합니다." },
  "戊": { nickname: "산",       tagline: "큰 산 · 성벽 (城牆土)",         keywords: ["포용력", "신뢰", "묵직함", "책임감"],     hint: "사람들이 본능적으로 기대고 싶어하는 타입이에요. 그 무게를 즐기세요." },
  "己": { nickname: "논밭",     tagline: "논밭 · 기름진 흙 (田園土)",     keywords: ["세심함", "배려", "꼼꼼함", "현실감각"],   hint: "디테일에 강하고 사람을 잘 챙겨요. 그 섬세한 감각이 큰 자산입니다." },
  "庚": { nickname: "검",       tagline: "큰 쇠 · 검 (劍戟金)",           keywords: ["결단력", "원칙", "추진력", "강직함"],     hint: "망설임 없는 결단력이 강점이에요. 때로는 부드러운 접근도 더 효과적일 수 있어요." },
  "辛": { nickname: "보석",     tagline: "보석 · 세공된 금속 (珠寶金)",   keywords: ["완벽주의", "심미안", "자존감", "날카로움"], hint: "스스로의 기준이 높은 편이에요. 그 높은 기준이 당신을 특별하게 만들어줘요." },
  "壬": { nickname: "바다",     tagline: "바다 · 강 (江河水)",            keywords: ["통찰력", "지략", "포용", "사유"],         hint: "큰 그림을 보는 전략적 사고가 뛰어나요. 흐름을 읽는 능력을 믿으세요." },
  "癸": { nickname: "빗물",     tagline: "비 · 이슬 (雨露水)",            keywords: ["직관", "감성", "배려", "내면의 힘"],      hint: "겉으로 드러나지 않는 깊은 감수성과 직관이 있어요. 혼자만의 시간이 에너지를 충전해줘요." },
};

export const SIPSIN_INFO: Record<string, { korean: string; tagline: string; desc: string }> = {
  "比肩": { korean: "비견", tagline: "든든한 내 편, 강한 고집",    desc: "주체성이 강하고 자기 주관대로 밀고 나가는 힘" },
  "劫財": { korean: "겁재", tagline: "선의의 경쟁자",              desc: "남에게 지기 싫어하는 승부욕과 강한 추진력" },
  "食神": { korean: "식신", tagline: "전문가적 기질",              desc: "하나를 깊게 파고드는 연구심과 풍요의 기운" },
  "傷官": { korean: "상관", tagline: "천재적인 표현력",            desc: "임기응변이 뛰어나고 기존 틀을 깨는 혁신적 아이디어" },
  "正財": { korean: "정재", tagline: "성실한 자산가",              desc: "꼬박꼬박 들어오는 고정 수입과 안정적인 관리 능력" },
  "偏財": { korean: "편재", tagline: "통 큰 사업가",              desc: "큰 재물이나 기회를 포착하는 수완과 유연함" },
  "正官": { korean: "정관", tagline: "바른 생활 리더",             desc: "원칙을 중시하고 조직 내에서 신뢰받는 명예와 직위" },
  "偏官": { korean: "편관", tagline: "카리스마 넘치는 해결사",     desc: "강한 책임감과 어려운 난관을 돌파하는 권력 의지" },
  "正印": { korean: "정인", tagline: "사랑받는 학자",              desc: "정통적인 지식 습득과 윗사람에게 보살핌받는 기운" },
  "偏印": { korean: "편인", tagline: "독창적인 전략가",            desc: "비주류 지식과 기술을 습득하는 직관력과 창의성" },
};

export const SIPSIN_CATEGORIES: { label: string; hanja: string; keyword: string; members: string[]; color: string; bg: string; description: string }[] = [
  { label: "자아", hanja: "自我", keyword: "주체성, 경쟁력", members: ["比肩", "劫財"], color: "#B8945A", bg: "#F5F0E7",
    description: "나 자신·형제·동료·경쟁자처럼 나와 같은 결의 기운이에요. 강하면 자기 주관과 추진력이 살아나고, 약하면 주변 페이스에 끌려가기 쉬워 동료의 도움이 중요해집니다." },
  { label: "출력", hanja: "出力", keyword: "표현력, 창의성", members: ["食神", "傷官"], color: "#5B8C6A", bg: "#EEF4F0",
    description: "표현·창작·말·자녀처럼 내가 밖으로 만들어내는 영역이에요. 강하면 톡톡 튀는 표현력과 창의성이 살아나고, 약하면 속마음을 드러내지 못해 답답함이 쌓일 수 있어요." },
  { label: "재물", hanja: "財物", keyword: "경제 활동",     members: ["偏財", "正財"], color: "#4A7BA5", bg: "#ECF1F6",
    description: "돈·자산·소유처럼 내가 다스리는 자원이며, 남자에게는 배우자도 이 영역에 속해요. 강하면 경제 감각과 현실 추진력이 살아나고, 약하면 환경의 도움을 받는 흐름이 됩니다." },
  { label: "권위", hanja: "權威", keyword: "책임감, 명예",   members: ["偏官", "正官"], color: "#7B68A0", bg: "#F2F0F7",
    description: "직장·상사·법·규율처럼 나를 묶고 책임을 지우는 영역이며, 여자에게는 배우자도 여기 속해요. 강하면 책임감과 명예욕·리더십이 커지고, 약하면 조직에서 자기 자리를 만드는 데 시간이 걸리는 편입니다." },
  { label: "입력", hanja: "入力", keyword: "수용성, 학문",   members: ["偏印", "正印"], color: "#B85A8A", bg: "#F7EBEF",
    description: "어머니·학문·도움·지식처럼 나를 길러주는 영역이에요. 강하면 배움과 인덕이 좋고, 약하면 스스로 길을 찾는 자수성가형이 됩니다." },
];

export const UNSEONG_PHASE: Record<string, { label: string; color: string; bg: string }> = {
  성장기: { label: "🌱 성장기(봄·새싹)", color: "#5B8C6A", bg: "#EEF4F0" },
  번영기: { label: "👑 번영기(여름·만개)", color: "#B8945A", bg: "#F5F0E7" },
  수렴기: { label: "🌙 수렴기(가을·낙엽)", color: "#4A7BA5", bg: "#ECF1F6" },
  태동기: { label: "🔄 태동기(겨울·씨앗)", color: "#7E7E8A", bg: "#F0F0F2" },
};

export const UNSEONG_INFO: Record<string, { korean: string; phase: string; tagline: string; desc: string }> = {
  "長生": { korean: "장생", phase: "성장기", tagline: "새로 시작되는 기운",     desc: "새로운 시작, 주변의 도움과 사랑을 받는 기운" },
  "沐浴": { korean: "목욕", phase: "성장기", tagline: "들떠 있는 호기심",       desc: "호기심 왕성, 주목받고 싶어 하는 에너지" },
  "冠帶": { korean: "관대", phase: "성장기", tagline: "추진력이 폭발하는 단계", desc: "의욕이 앞서고 추진력이 폭발하는 시기" },
  "建祿": { korean: "건록", phase: "번영기", tagline: "스스로 자립하는 기운",   desc: "스스로의 힘으로 안정적인 기반을 닦는 탄탄한 기운" },
  "帝旺": { korean: "제왕", phase: "번영기", tagline: "에너지 절정",            desc: "에너지의 정점, 최고의 권위와 지배력을 발휘" },
  "衰":   { korean: "쇠",   phase: "번영기", tagline: "노련하게 조율하는 단계", desc: "힘은 지났지만 경험과 지혜로 여유롭게 조율" },
  "病":   { korean: "병",   phase: "수렴기", tagline: "감수성이 깊어지는 단계", desc: "활동력은 줄지만 감수성과 동정심이 깊어지는 단계" },
  "死":   { korean: "사",   phase: "수렴기", tagline: "고요한 멈춤",            desc: "겉의 움직임은 없으나 내면의 집중력이 극대화" },
  "墓":   { korean: "묘",   phase: "수렴기", tagline: "내공의 저장",            desc: "내실을 다지고 절약하며 미래를 준비하는 시기" },
  "絕":   { korean: "절",   phase: "태동기", tagline: "끊고 새로 시작하는 전환", desc: "과거 정리 후 새로운 반전을 꿈꾸는 드라마틱한 지점" },
  "胎":   { korean: "태",   phase: "태동기", tagline: "씨앗이 잉태되는 단계",   desc: "새 생명이 잉태된 상태, 무한한 가능성의 시작" },
  "養":   { korean: "양",   phase: "태동기", tagline: "보호받으며 자라는 단계", desc: "안전하게 보호받으며 세상 밖으로 나갈 준비" },
};

export const SIBI_SINSAL_INFO: Record<string, { hanja: string; meaning: string }> = {
  "겁살":   { hanja: "劫殺",   meaning: "빼앗김·사고·도난 주의" },
  "재살":   { hanja: "災殺",   meaning: "재앙·갈등의 기운" },
  "천살":   { hanja: "天殺",   meaning: "하늘이 내리는 변고" },
  "지살":   { hanja: "地殺",   meaning: "이동·변동·출장" },
  "년살":   { hanja: "年殺",   meaning: "매력·인기·도화" },
  "월살":   { hanja: "月殺",   meaning: "어두운 그림자·우울" },
  "망신살": { hanja: "亡身殺", meaning: "체면 손상·구설" },
  "장성살": { hanja: "將星殺", meaning: "리더십·권위·결단력" },
  "반안살": { hanja: "攀鞍殺", meaning: "출세·승진·명예" },
  "역마살": { hanja: "驛馬殺", meaning: "이동·변화·해외" },
  "육해살": { hanja: "六害殺", meaning: "방해·갈등·장애물" },
  "화개살": { hanja: "華蓋殺", meaning: "예술·학문·고독" },
};

export const SINSAL_INFO: Record<string, { hanja: string; tagline: string; desc: string; color: string; bg: string; border: string }> = {
  "도화살":   { hanja: "桃花殺",   tagline: "복숭아꽃의 향기",      color: "#C06B8A", bg: "#F7EFF3", border: "#E0B5C8", desc: "가만히 있어도 시선이 모이는 강력한 매력과 스타성. 퍼스널 브랜딩·마케팅·예술 분야에서 타고난 강점을 발휘합니다." },
  "역마살":   { hanja: "驛馬殺",   tagline: "지치지 않는 엔진",     color: "#5B8C6A", bg: "#EEF4F0", border: "#A8C9B5", desc: "한곳에 머물기보다 끊임없이 움직이고 새 환경을 개척할 때 운이 풀립니다. 해외·여행·유통 분야에서 빛납니다." },
  "화개살":   { hanja: "華蓋殺",   tagline: "화려한 덮개",          color: "#7B68A0", bg: "#F2F0F7", border: "#C5BCDB", desc: "예술적 감수성과 종교·철학적 깊이가 있는 에너지. 고독해 보이지만 창의성과 전문 지식이 깊은 학자·아티스트의 기운." },
  "천을귀인": { hanja: "天乙貴人", tagline: "최고의 조력자",        color: "#B8945A", bg: "#F5F0E7", border: "#D9C49A", desc: "위기의 순간 귀인이 나타나거나 큰 화를 면하게 해주는 가장 복된 기운. 사람 복이 많고 고비마다 도움의 손길이 찾아옵니다." },
  "문창귀인": { hanja: "文昌貴人", tagline: "문서와 학문의 별",     color: "#4A7BA5", bg: "#ECF1F6", border: "#9BB8D0", desc: "시험·자격증·학업 운이 강하고 문서 처리 능력이 뛰어납니다. 지식으로 인정받고 전문성을 쌓아나가는 기운." },
  "장성살":   { hanja: "將星殺",   tagline: "대장군의 기개",        color: "#8B6A3E", bg: "#F5EFE5", border: "#C9A96E", desc: "대중을 압도하는 카리스마와 결단력. 리더십이 강하고 큰일을 도모할 때 발휘되는 강력한 에너지." },
  "백호살":   { hanja: "白虎殺",   tagline: "백호의 폭발적 집중력", color: "#C75B52", bg: "#F7EDEC", border: "#E0A8A3", desc: "에너지가 워낙 강해서 사고나 급변을 주의해야 하지만, 전문직에서 폭발적인 집중력으로 남들이 못 하는 일을 해냅니다." },
  "천덕귀인": { hanja: "天德貴人", tagline: "하늘이 덮어주는 복",   color: "#C9A554", bg: "#F7F2E5", border: "#DDC785", desc: "큰 위기에서도 다치지 않고 빠져나가는 보호의 기운. 길게 보면 복이 깃들어 자연스럽게 잘 풀리는 사주예요." },
  "월덕귀인": { hanja: "月德貴人", tagline: "조용히 흐르는 평안",   color: "#6B9A8B", bg: "#EFF4F2", border: "#B5CFC5", desc: "갈등을 피하고 평화롭게 풀리는 운. 충돌보다 조율로 일이 풀리는, 인간관계가 부드러운 타입이에요." },
};

export const SINSAL_ORDER = ["도화살", "역마살", "화개살", "천을귀인", "문창귀인", "장성살", "백호살", "천덕귀인", "월덕귀인"];

export const SINSAL_COMBOS: { needs: string[]; message: string }[] = [
  { needs: ["문창귀인", "장성살"],    message: "똑똑한 리더 탄생! 지략과 카리스마를 모두 갖춘 당신은 조직의 핵심이 될 상이네요!" },
  { needs: ["도화살", "역마살"],      message: "카리스마 넘치는 글로벌 스타! 어딜 가도 주목받고, 낯선 곳에서 오히려 더 빛나는 타입이에요." },
  { needs: ["천을귀인", "문창귀인"],  message: "귀인의 도움으로 빛나는 학자! 배움의 길에서 뜻밖의 좋은 사람을 계속 만나게 돼요." },
  { needs: ["도화살", "장성살"],      message: "매력적인 리더! 인기와 권위를 동시에 갖춘 드문 조합이에요. 무대가 클수록 빛납니다." },
  { needs: ["역마살", "천을귀인"],    message: "움직일수록 귀인이 나타나는 타입이에요. 새로운 환경이 새로운 행운을 데려옵니다." },
];

export const PILLAR_LABELS_SHORT = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"];
