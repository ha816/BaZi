from kkachi.domain.interpretation import SamhapInfo, ZodiacInfo


_ZODIAC_DATA: dict[str, dict] = {
    "子": {
        "korean": "쥐", "emoji": "🐭", "keyword": "지혜·적응",
        "traits": ["빠른 두뇌 회전", "뛰어난 임기응변", "사교적 인맥 관리"],
        "strength": "어떤 환경에서도 빠르게 적응하고 기회를 포착하는 능력이 탁월합니다.",
        "weakness": "너무 계산적으로 보일 수 있고, 지나치게 눈치를 보다 결단이 늦어질 수 있어요.",
        "compatible": ["辰", "申"],
    },
    "丑": {
        "korean": "소", "emoji": "🐂", "keyword": "성실·인내",
        "traits": ["끈질긴 인내력", "성실한 실행력", "안정적인 신뢰감"],
        "strength": "묵묵히 맡은 일을 해내는 뚝심과 신뢰를 쌓는 능력이 강점입니다.",
        "weakness": "변화에 느리게 반응하고 고집이 세져 유연성이 부족해 보일 수 있어요.",
        "compatible": ["酉", "巳"],
    },
    "寅": {
        "korean": "호랑이", "emoji": "🐯", "keyword": "용기·추진",
        "traits": ["대담한 도전 정신", "강한 리더십", "열정적인 추진력"],
        "strength": "어려운 상황에서도 앞장서고 사람들을 이끄는 카리스마가 있습니다.",
        "weakness": "충동적으로 행동하거나 타인의 의견을 무시하는 독불장군 기질이 나올 수 있어요.",
        "compatible": ["午", "戌"],
    },
    "卯": {
        "korean": "토끼", "emoji": "🐰", "keyword": "온화·예술",
        "traits": ["섬세한 감수성", "뛰어난 예술 감각", "부드러운 소통 능력"],
        "strength": "사람을 편안하게 만드는 분위기와 창의적인 감각이 강점입니다.",
        "weakness": "상처를 쉽게 받고 갈등을 회피하다 보니 중요한 결정을 미루는 경향이 있어요.",
        "compatible": ["未", "亥"],
    },
    "辰": {
        "korean": "용", "emoji": "🐲", "keyword": "카리스마·야망",
        "traits": ["뛰어난 카리스마", "큰 그림을 보는 시야", "강한 자기 확신"],
        "strength": "비전을 제시하고 사람들을 움직이는 특유의 매력과 추진력이 있습니다.",
        "weakness": "권위적으로 굴거나 자기 주장이 너무 강해 팀워크를 해칠 수 있어요.",
        "compatible": ["子", "申"],
    },
    "巳": {
        "korean": "뱀", "emoji": "🐍", "keyword": "직관·지략",
        "traits": ["날카로운 통찰력", "치밀한 전략 수립", "깊은 집중력"],
        "strength": "겉으론 조용하지만 상황을 꿰뚫어 보고 정확한 판단을 내리는 능력이 탁월합니다.",
        "weakness": "의심이 많아지면 인간관계에 벽을 치고 혼자 끌어안는 경향이 생겨요.",
        "compatible": ["酉", "丑"],
    },
    "午": {
        "korean": "말", "emoji": "🐴", "keyword": "열정·자유",
        "traits": ["넘치는 열정 에너지", "자유로운 영혼", "빠른 행동력"],
        "strength": "한번 불타오르면 누구도 못 따라오는 폭발적인 열정과 실행력이 있습니다.",
        "weakness": "지속력이 약하고 구속받는 것을 극도로 싫어해 조직 생활에서 마찰이 생길 수 있어요.",
        "compatible": ["寅", "戌"],
    },
    "未": {
        "korean": "양", "emoji": "🐑", "keyword": "배려·감수성",
        "traits": ["따뜻한 공감 능력", "섬세한 감수성", "예술·창작 기질"],
        "strength": "상대의 감정을 잘 읽고 배려하는 능력, 창의적인 아이디어 발상이 강점입니다.",
        "weakness": "우유부단하고 남의 눈치를 너무 봐서 자신의 의견을 제대로 표현 못할 수 있어요.",
        "compatible": ["卯", "亥"],
    },
    "申": {
        "korean": "원숭이", "emoji": "🐒", "keyword": "재치·변통",
        "traits": ["뛰어난 재치와 유머", "빠른 상황 판단", "다재다능한 적응력"],
        "strength": "어떤 상황도 유연하게 전환하고 사람들을 즐겁게 만드는 능력이 있습니다.",
        "weakness": "변덕스러워 보이거나 깊이 없이 넓기만 하다는 인상을 줄 수 있어요.",
        "compatible": ["子", "辰"],
    },
    "酉": {
        "korean": "닭", "emoji": "🐓", "keyword": "정확·미적감각",
        "traits": ["꼼꼼한 정확성", "뛰어난 미적 감각", "정직한 직설 화법"],
        "strength": "디테일을 놓치지 않는 완벽주의와 깔끔한 정리 정돈 능력이 강점입니다.",
        "weakness": "비판적이고 까다로워 보이거나 잔소리가 많다는 인상을 줄 수 있어요.",
        "compatible": ["巳", "丑"],
    },
    "戌": {
        "korean": "개", "emoji": "🐶", "keyword": "충직·정의",
        "traits": ["변치 않는 충성심", "정의로운 신념", "헌신적인 책임감"],
        "strength": "한번 믿은 사람을 끝까지 지키는 의리와 옳은 길을 가는 강직함이 있습니다.",
        "weakness": "융통성이 없고 흑백 논리에 빠지거나 걱정이 많아질 수 있어요.",
        "compatible": ["寅", "午"],
    },
    "亥": {
        "korean": "돼지", "emoji": "🐷", "keyword": "순수·복",
        "traits": ["순수한 마음씨", "넉넉한 인복", "낙천적인 긍정 마인드"],
        "strength": "사람을 끌어당기는 따뜻함과 복을 부르는 긍정 에너지가 강점입니다.",
        "weakness": "사람을 너무 믿거나 게을러질 수 있고, 본인의 한계를 그릴 줄 알아야 해요.",
        "compatible": ["卯", "未"],
    },
}

_SAMHAP_GROUPS: list[tuple[tuple[str, str, str], str]] = [
    (("申", "子", "辰"), "水"),
    (("巳", "酉", "丑"), "金"),
    (("寅", "午", "戌"), "火"),
    (("亥", "卯", "未"), "木"),
]

_YUGHAP_PAIRS: list[tuple[str, str]] = [
    ("子", "丑"), ("寅", "亥"), ("卯", "戌"), ("辰", "酉"), ("巳", "申"), ("午", "未"),
]

_WONJIN_PAIRS: list[tuple[str, str]] = [
    ("子", "未"), ("丑", "午"), ("寅", "酉"), ("卯", "申"), ("辰", "亥"), ("巳", "戌"),
]

_CLASH_PAIRS: list[tuple[str, str]] = [
    ("子", "午"), ("丑", "未"), ("寅", "申"), ("卯", "酉"), ("辰", "戌"), ("巳", "亥"),
]

_RELATION_LABELS: dict[str, str] = {
    "나":   "나",
    "삼합": "삼합(三合)",
    "육합": "육합(六合)",
    "보통": "보통",
    "원진": "원진(怨嗔)",
    "충":   "충(衝)",
}

BRANCH_ORDER: list[str] = list(_ZODIAC_DATA.keys())


def zodiac_info(branch: str) -> ZodiacInfo:
    data = _ZODIAC_DATA[branch]
    return ZodiacInfo(
        branch=branch,
        korean=data["korean"],
        emoji=data["emoji"],
        keyword=data["keyword"],
        traits=list(data["traits"]),
        strength=data["strength"],
        weakness=data["weakness"],
        compatible=list(data["compatible"]),
    )


def relation_of(a: str, b: str) -> tuple[str, str]:
    if a == b:
        return "나", _RELATION_LABELS["나"]
    if any(a in g and b in g for g, _ in _SAMHAP_GROUPS):
        return "삼합", _RELATION_LABELS["삼합"]
    if any({x, y} == {a, b} for x, y in _YUGHAP_PAIRS):
        return "육합", _RELATION_LABELS["육합"]
    if any({x, y} == {a, b} for x, y in _CLASH_PAIRS):
        return "충", _RELATION_LABELS["충"]
    if any({x, y} == {a, b} for x, y in _WONJIN_PAIRS):
        return "원진", _RELATION_LABELS["원진"]
    return "보통", _RELATION_LABELS["보통"]


def samhap_of(branch: str, pillar_branches: list[str]) -> SamhapInfo | None:
    for group, element in _SAMHAP_GROUPS:
        if branch in group:
            members = list(group)
            partners = [b for b in members if b != branch]
            in_pillars = any(b in partners for b in pillar_branches)
            return SamhapInfo(
                element=element,
                label=f"{element} 삼합",
                members=members,
                in_pillars=in_pillars,
            )
    return None
