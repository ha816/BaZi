from kkachi.domain.ganji import Oheng
from kkachi.domain.interpretation import InterpretBlock, InterpretTip


class PalmLineInterpreter:
    """손금선 점수(0~100) → InterpretBlock 해석."""

    def __call__(self, line_scores: dict[str, int]) -> list[InterpretBlock]:
        blocks = []
        for key, info in _PALM_LINE_INFO.items():
            score = line_scores.get(key, 50)
            level = "high" if score >= 65 else "mid" if score >= 40 else "low"
            blocks.append(InterpretBlock(
                category=f"{info['name']} ({info['domain']})",
                description=info[level],
                tips=[InterpretTip(label="선명도", text=_score_label(score))],
            ))
        return blocks


def _score_label(score: int) -> str:
    if score >= 75:
        return "매우 선명"
    if score >= 55:
        return "뚜렷한 편"
    if score >= 40:
        return "보통"
    return "흐릿한 편"


_PALM_LINE_INFO: dict[str, dict] = {
    "heart": {
        "name": "감정선",
        "domain": "연애운",
        "high": (
            "감정선이 선명하고 길게 뻗어 있어요. "
            "감수성이 풍부하고 표현력이 뛰어나 인연을 쉽게 만들어요. "
            "올해 인연운이 활발히 움직여요."
        ),
        "mid": (
            "감정선이 고른 편이에요. "
            "감정 표현과 절제 사이에서 균형을 잡는 타입으로, 안정적인 관계를 추구해요."
        ),
        "low": (
            "감정선이 다소 짧거나 흐릿해요. "
            "마음속에 감정이 있어도 표현이 어려울 수 있어요. 먼저 다가가는 연습이 도움이 돼요."
        ),
    },
    "head": {
        "name": "지능선",
        "domain": "재물운",
        "high": (
            "지능선이 뚜렷하고 길게 뻗어 있어요. "
            "논리적 사고와 분석력이 뛰어나 재물 흐름을 꿰뚫어보는 감각이 있어요."
        ),
        "mid": (
            "지능선이 안정적으로 이어져 있어요. "
            "실용적 판단력이 강하고 무리하지 않는 선에서 재물을 키워가요."
        ),
        "low": (
            "지능선이 짧거나 불규칙해요. "
            "직관형 사고 스타일로, 장기 계획을 세우는 습관이 재물운을 도와줘요."
        ),
    },
    "life": {
        "name": "생명선",
        "domain": "건강운",
        "high": (
            "생명선이 깊고 선명하게 이어져 있어요. "
            "생명력이 강하고 체력과 회복력이 뛰어난 편이에요."
        ),
        "mid": (
            "생명선이 고르게 이어져 있어요. "
            "균형 잡힌 체력으로 꾸준한 건강 관리가 뒷받침되면 좋아요."
        ),
        "low": (
            "생명선이 다소 흐리거나 짧아 보여요. "
            "체력 관리와 규칙적인 생활 습관에 더 신경 쓰는 것이 좋아요."
        ),
    },
}


def classify_hand_type(finger_ratio: float, aspect_ratio: float) -> Oheng:
    """손 비율로 오행형을 분류한다.

    finger_ratio  = 중지 길이(MCP→TIP) / 손바닥 너비(검지MCP→소지MCP)
    aspect_ratio  = 손바닥 높이(손목→중지MCP) / 손바닥 너비
    """
    scores: dict[Oheng, int] = {o: 0 for o in Oheng}

    # finger_ratio 구간별 점수
    if finger_ratio > 0.85:
        scores[Oheng.木] += 3
    elif finger_ratio > 0.75:
        scores[Oheng.木] += 1
        scores[Oheng.火] += 2
    elif finger_ratio > 0.65:
        scores[Oheng.火] += 1
        scores[Oheng.水] += 2
        scores[Oheng.金] += 1
    elif finger_ratio > 0.55:
        scores[Oheng.金] += 2
        scores[Oheng.土] += 1
    else:
        scores[Oheng.土] += 3

    # aspect_ratio 구간별 점수
    if aspect_ratio > 1.35:
        scores[Oheng.木] += 2
        scores[Oheng.火] += 1
    elif aspect_ratio > 1.15:
        scores[Oheng.火] += 2
        scores[Oheng.金] += 1
    elif aspect_ratio > 0.95:
        scores[Oheng.金] += 2
        scores[Oheng.水] += 1
    else:
        scores[Oheng.土] += 2
        scores[Oheng.水] += 1

    return max(scores, key=lambda k: scores[k])


class HandShapeInterpreter:
    """손 형태 수치 → InterpretBlock 해석."""

    def __call__(self, hand_type: Oheng, finger_ratio: float, aspect_ratio: float) -> list[InterpretBlock]:
        info = _HAND_TYPE_INFO[hand_type]
        advice = _HAND_ADVICE[hand_type]

        shape_block = InterpretBlock(
            category="손의 형태",
            description=f"{info['type']} — {info['desc']}",
            tips=[
                InterpretTip(label="형태 특징", text=info["measurement"]),
                InterpretTip(label="성격 키워드", text=info["keywords"]),
            ],
        )

        measure_desc = _build_measure_desc(finger_ratio, aspect_ratio)
        measure_block = InterpretBlock(
            category="측정 결과",
            description=measure_desc,
        )

        advice_block = InterpretBlock(
            category="손으로 보는 기운",
            description=advice["desc"],
            tips=[
                InterpretTip(label="강점", text=advice["strength"]),
                InterpretTip(label="보완할 점", text=advice["weakness"]),
            ],
        )

        return [shape_block, measure_block, advice_block]


def _build_measure_desc(finger_ratio: float, aspect_ratio: float) -> str:
    finger_label = (
        "매우 긴 편" if finger_ratio > 0.85
        else "긴 편" if finger_ratio > 0.75
        else "보통" if finger_ratio > 0.65
        else "짧은 편" if finger_ratio > 0.55
        else "매우 짧은 편"
    )
    aspect_label = (
        "길고 좁은 편" if aspect_ratio > 1.35
        else "약간 긴 편" if aspect_ratio > 1.15
        else "정사각형에 가까운" if aspect_ratio > 0.95
        else "넓고 짧은 편"
    )
    return (
        f"손가락 길이는 손 너비 대비 {finger_label}이고, "
        f"손바닥 형태는 {aspect_label} 비율입니다."
    )


_HAND_TYPE_INFO: dict[Oheng, dict[str, str]] = {
    Oheng.木: {
        "type": "목형손(木型手)",
        "desc": "섬세하고 유연하며 예술적 감각이 돋보이는 손",
        "measurement": "손가락이 손바닥 너비보다 확연히 길고 전체적으로 가늘다",
        "keywords": "섬세함 · 창의력 · 표현력 · 빠른 판단",
    },
    Oheng.火: {
        "type": "화형손(火型手)",
        "desc": "열정적이고 직관적이며 창의적인 에너지가 넘치는 손",
        "measurement": "손가락이 길고 손바닥도 적당히 길어 균형 잡힌 비율",
        "keywords": "열정 · 직관 · 리더십 · 빠른 결단",
    },
    Oheng.土: {
        "type": "토형손(土型手)",
        "desc": "실용적이고 믿음직스러우며 안정감을 주는 손",
        "measurement": "손가락이 짧고 손바닥이 넓고 두꺼운 편",
        "keywords": "신뢰 · 지구력 · 현실감각 · 성실함",
    },
    Oheng.金: {
        "type": "금형손(金型手)",
        "desc": "결단력 있고 냉철하며 조직적인 성향이 반영된 손",
        "measurement": "손가락과 손바닥 비율이 균형 잡혀 각진 인상",
        "keywords": "원칙 · 냉철함 · 조직력 · 집중력",
    },
    Oheng.水: {
        "type": "수형손(水型手)",
        "desc": "유연하고 적응력이 뛰어나며 공감 능력이 반영된 손",
        "measurement": "손가락이 중간 길이에 손바닥이 둥글고 부드러운 인상",
        "keywords": "공감 · 유연성 · 적응력 · 지혜",
    },
}

_HAND_ADVICE: dict[Oheng, dict[str, str]] = {
    Oheng.木: {
        "desc": (
            "木의 기운이 강한 손입니다. 성장과 창조의 에너지가 충만하여 "
            "새로운 것을 시작하는 능력이 뛰어납니다. "
            "감수성이 풍부해 예술·글쓰기·기획 분야에서 두각을 나타냅니다."
        ),
        "strength": "새로운 아이디어 발굴, 빠른 실행력, 인간관계 확장",
        "weakness": "마무리 관리, 에너지 분산 주의 — 하나씩 완성하는 연습이 필요합니다",
    },
    Oheng.火: {
        "desc": (
            "火의 기운이 담긴 손입니다. 열정과 직관이 뛰어나 "
            "사람들을 이끌고 분위기를 만드는 능력이 강합니다. "
            "표현력이 풍부해 발표·영업·리더십 역할에서 빛납니다."
        ),
        "strength": "추진력, 설득력, 네트워킹 능력",
        "weakness": "감정 기복 관리, 급한 결정 자제 — 한 박자 쉬는 습관이 도움이 됩니다",
    },
    Oheng.土: {
        "desc": (
            "土의 기운이 가득한 손입니다. 성실함과 신뢰감이 가장 큰 자산으로, "
            "장기적인 프로젝트와 사람들에 대한 책임감이 뛰어납니다. "
            "꾸준한 노력으로 결국 성취를 이루는 타입입니다."
        ),
        "strength": "신뢰성, 지속력, 책임감, 현실적 판단",
        "weakness": "변화 수용, 새로운 시도에 대한 유연성 — 가끔 틀에서 벗어나는 경험이 성장을 도웁니다",
    },
    Oheng.金: {
        "desc": (
            "金의 기운이 흐르는 손입니다. 냉철한 판단력과 원칙을 중시하는 성향으로 "
            "복잡한 문제를 명확하게 정리하는 능력이 뛰어납니다. "
            "분석·법률·재무·기술 분야에서 강점을 발휘합니다."
        ),
        "strength": "분석력, 원칙 준수, 집중력, 정확성",
        "weakness": "감성 표현, 타인과의 공감 — 감정을 표현하는 연습이 관계를 풍요롭게 합니다",
    },
    Oheng.水: {
        "desc": (
            "水의 기운이 흐르는 손입니다. 뛰어난 공감 능력과 유연한 사고로 "
            "어떤 환경에서도 적응하고 사람들과 잘 어울립니다. "
            "직관이 강하고 감수성이 예민해 상담·교육·창작 분야와 잘 맞습니다."
        ),
        "strength": "공감 능력, 적응력, 직관, 포용력",
        "weakness": "결단력 강화, 우유부단함 극복 — 때로는 빠른 선택이 더 좋은 결과를 만듭니다",
    },
}