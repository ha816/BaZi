import hashlib
import random
from datetime import date

from kkachi.application.util.util import josa
from kkachi.domain.ganji import Oheng
from kkachi.domain.iching import HEXAGRAM_BY_LINES, TRIGRAMS, Hexagram
from kkachi.domain.user import User

QUESTION_MIN, QUESTION_MAX = 4, 80
CATEGORIES = ("연애", "일", "재물", "기타")
LEVELS = ("좋은 날", "평범한 날", "주의가 필요한 날")

# 위기 신호 — 괘를 뽑기 전에 본다(타로 리서치 §9-6 가드레일). 질문은 저장하지 않으므로 여기서 끝
_CRISIS = ("죽고 싶", "죽고싶", "자살", "자해", "살기 싫", "살기싫", "목숨", "사라지고 싶", "사라지고싶",
           "죽을래", "죽어버리", "죽어 버리", "뛰어내리", "끝내고 싶", "끝내고싶", "죽는 게 나", "죽는게 나")
CRISIS_MESSAGE = "지금 많이 힘드신 것 같아요. 괘보다 사람의 목소리가 먼저예요. 아래 번호는 24시간 열려 있어요."
HELPLINES = ({"name": "자살예방상담전화", "number": "109"}, {"name": "정신건강위기상담", "number": "1577-0199"})

# 영역 자동 감지 — 칩을 고르지 않았을 때. 연애 → 재물 → 일 순으로 먼저 걸리는 것. "일" 한 글자는 너무 넓어 안 쓴다
_CATEGORY_WORDS: dict[str, tuple[str, ...]] = {
    "연애": ("연애", "사랑", "남친", "여친", "남자친구", "여자친구", "썸", "고백", "결혼", "헤어", "이별", "재회", "짝사랑",
           "데이트", "소개팅", "애인", "남편", "아내", "커플", "그 사람", "그사람", "좋아하는 사람", "마음이 있", "연락이 올", "연락 올",
           "만나", "사귀", "사이가", "사이는"),
    "재물": ("돈", "투자", "주식", "코인", "부동산", "집을 사", "집 사", "대출", "월급", "연봉", "재테크", "매매", "빚", "저축",
           "복권", "적금", "펀드", "아파트", "전세", "월세", "수입", "빌려"),
    "일": ("회사", "직장", "이직", "취업", "면접", "사업", "프로젝트", "승진", "상사", "동료", "퇴사", "창업", "시험", "합격",
          "공부", "발표", "업무", "일자리", "알바", "팀장", "계약", "입사", "학교", "대학", "논문", "유학", "제안"),
}

# 변효 수에 따른 "앞으로" 머리 문장(지괘 문장 next는 그 뒤에 붙는다)
_STILL = "움직이는 줄이 없어요. {name}의 흐름이 한동안 그대로 이어지니, 지금 자리에서 할 수 있는 것부터 하세요."
_ONE = "아래에서 {n}번째 줄이 움직여 {tname}{ro} 바뀌어요."
_MANY = "줄 {k}개가 한꺼번에 움직여 크게 바뀌는 중이에요. {tname}{ro} 가요."

# 교차 1문장 — 괘의 오행(상괘·하괘) × 내게 필요한 기운(용신). 같음 > 生 > 剋 > 설기 > 보통. "용신" 말은 안 쓴다(아침 한 마디와 같은 쉬운 말)
_YONG_CROSS = {
    "same": "이 괘에는 내게 꼭 필요한 {yk}({y}) 기운이 들어 있어요.",
    "gen": "괘의 {ek}({e}) 기운이 내게 필요한 {yk}({y}){eul} 키워 줘요.",
    "overcome": "괘의 {ek}({e}) 기운이 내게 필요한 {yk}({y}){eul} 누르니, 답은 받되 결정은 하루 묵히세요.",
    "drain": "괘의 {ek}({e}) 기운이 내 {yk}({y}){eul} 빼 가니 힘을 아끼며 움직이세요.",
    "none": "괘의 기운은 내게 필요한 {yk}({y}){gwa} 바로 닿지 않으니 괘의 말을 그대로 들으세요.",
}
# 교차 2문장 — 오늘 일진 레벨 × 변효 있음/없음
_DAY_CROSS = {
    ("좋은 날", "still"): "오늘 일진도 좋으니 지금 흐름을 믿고 가세요.",
    ("좋은 날", "change"): "오늘 일진이 좋아 바뀌는 흐름이 순하게 풀려요.",
    ("평범한 날", "still"): "일진도 평범하니 급할 것 없는 날이에요.",
    ("평범한 날", "change"): "일진은 평범하니 변화를 차분히 받아들이세요.",
    ("주의가 필요한 날", "still"): "일진은 조심하라 하니 지금 자리를 지키는 게 답이에요.",
    ("주의가 필요한 날", "change"): "일진이 조심하라 하니 바뀌는 흐름에 서둘러 올라타지 마세요.",
}


def normalize_question(question: str) -> str:
    """공백 정리 + 끝 물음표·마침표 제거 — "이직할까?"와 "이직할까 ?"는 같은 질문(같은 괘)."""
    return " ".join(question.split()).rstrip("?!.。 ")


def check_question(question: str) -> str | None:
    """위기 신호면 "crisis", 아니면 None. 괘를 뽑기 전에 부른다."""
    q = question.replace(" ", "")
    return "crisis" if any(w.replace(" ", "") in q for w in _CRISIS) else None


def categorize(question: str) -> str:
    for category, words in _CATEGORY_WORDS.items():
        if any(w in question for w in words):
            return category
    return "기타"


def cast(seed: int) -> list[int]:
    """3동전법 — 동전 셋(앞 3·뒤 2)을 여섯 번. 값 6(노음·변함) 1/8 · 7(소양) 3/8 · 8(소음) 3/8 · 9(노양·변함) 1/8. 아래→위."""
    rng = random.Random(seed)
    return [6 + sum(rng.random() < 0.5 for _ in range(3)) for _ in range(6)]


def ask(question: str, today: date, user: User | None = None, category: str | None = None) -> dict:
    """질문 괘 — 같은 사람·날짜·질문이면 같은 괘(seed = sha256). 저장 없음, 다시 뽑기 없음.
    반환: 본괘(hexagram, line = 지금 한 줄)·변효(values·mode)·지괘(transformed, line = 앞으로 한 줄)·change(변화 머리 문장)·area(영역 한 줄).
    cross(일진·용신 교차)는 사주가 있을 때 컨트롤러가 cross_line으로 채운다."""
    q = normalize_question(question)
    identity = f"{user.birth_dt:%Y-%m-%dT%H:%M}|{user.gender}" if user else ""
    digest = hashlib.sha256(f"kkachi-iching-v1|{identity}|{today.isoformat()}|{q}".encode()).digest()
    values = cast(int.from_bytes(digest[:8], "big"))
    yang = [v in (7, 9) for v in values]
    changing = [v in (6, 9) for v in values]
    primary = HEXAGRAM_BY_LINES[tuple(yang)]
    moved = [i for i, c in enumerate(changing) if c]
    mode = "still" if not moved else "one" if len(moved) == 1 else "many"
    transformed = HEXAGRAM_BY_LINES[tuple(y != c for y, c in zip(yang, changing))] if moved else None
    if transformed is None:
        change = _STILL.format(name=primary.name)
    elif mode == "one":
        change = _ONE.format(n=moved[0] + 1, tname=transformed.name, ro=_ro(transformed.name))
    else:
        change = _MANY.format(k=len(moved), tname=transformed.name, ro=_ro(transformed.name))
    cat = category if category in CATEGORIES else categorize(q)
    area_text = {"연애": primary.love, "일": primary.work, "재물": primary.money}.get(cat)
    return {
        "date": today.isoformat(),
        "identity": "person" if user else "date",
        "question": q,
        "category": cat,
        "values": values,
        "mode": mode,
        "hexagram": _hex_view(primary, list(zip(yang, changing)), primary.now),
        "transformed": _hex_view(transformed, [(y != c, False) for y, c in zip(yang, changing)], transformed.next) if transformed else None,
        "change": change,
        "area": {"label": cat, "text": area_text} if area_text else None,
        "cross": None,
    }


def cross_line(answer: dict, yongshin: Oheng, level: str) -> str:
    """오늘 일진·내게 필요한 기운(용신) × 괘 → 교차 두 문장. 1문장은 괘의 오행(상괘·하괘)과 용신의 관계,
    2문장은 일진 레벨 × 변효 있음/없음. 두 체계의 길흉을 더하지 않는다 — 괘가 답, 사주는 배경(리서치 §6)."""
    if level not in LEVELS:
        level = "평범한 날"
    elements = []
    for key in ("upper", "lower"):
        el = Oheng[answer["hexagram"][key]["element"]]
        if el not in elements:
            elements.append(el)
    yk, y = yongshin.value[0], yongshin.name
    kind, hit = "none", yongshin
    for check, test in (("same", lambda e: e == yongshin), ("gen", lambda e: e.generates == yongshin),
                        ("overcome", lambda e: e.overcomes == yongshin), ("drain", lambda e: yongshin.generates == e)):
        found = next((e for e in elements if test(e)), None)
        if found is not None:
            kind, hit = check, found
            break
    first = _YONG_CROSS[kind].format(yk=yk, y=y, ek=hit.value[0], e=hit.name, eul=josa(yk, "을", "를"), gwa=josa(yk, "과", "와"))
    return f"{first} {_DAY_CROSS[(level, 'still' if answer['mode'] == 'still' else 'change')]}"


def _ro(word: str) -> str:
    """(으)로 — 받침 없거나 ㄹ 받침이면 "로"(우물로), 그 밖의 받침은 "으로"."""
    code = ord(word[-1]) - 0xAC00
    jong = code % 28 if 0 <= code <= 11171 else 0
    return "로" if jong in (0, 8) else "으로"


def _hex_view(h: Hexagram, lines: list[tuple[bool, bool]], line: str) -> dict:
    up, low = TRIGRAMS[h.upper], TRIGRAMS[h.lower]
    return {
        "id": h.id,
        "key": h.key,
        "name": h.name,
        "hanja": h.hanja,
        "traditional": h.traditional,
        "upper": {"name": up.name, "hanja": up.hanja, "element": up.element},
        "lower": {"name": low.name, "hanja": low.hanja, "element": low.element},
        "keywords": list(h.keywords),
        "lines": [{"yang": y, "changing": c} for y, c in lines],
        "line": line,
    }
