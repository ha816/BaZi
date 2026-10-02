from kkachi.application.util.util import josa
from kkachi.domain.ganji import Oheng, Pillar, Stem

# 궁합 캐릭터 — 두 사람 일간 오행 쌍을 비유 칭호로 + "이럴 때 두 분은?" 문답.
# 결과 dict의 스냅샷만 써서 옛 캐시에도 동작. 이름은 {p1}·{p2} 토큰, 관계 유형(lover/friend/family)에 따라 문장이 달라진다.

_EMOJI = {"木": "🌳", "火": "🔥", "土": "⛰️", "金": "⚔️", "水": "💧"}
_SUFFIX = {"lover": "커플", "friend": "콤비", "family": "가족"}

# 상생(A가 B를 생)·상극(A가 B를 극) 쌍의 비유 — (A의 이름, B의 이름)
_PAIR_NAME: dict[tuple[str, str], tuple[str, str]] = {
    ("木", "火"): ("장작", "모닥불"),
    ("火", "土"): ("햇볕", "들판"),
    ("土", "金"): ("광산", "보석"),
    ("金", "水"): ("바위", "샘물"),
    ("水", "木"): ("단비", "새싹"),
    ("木", "土"): ("뿌리", "대지"),
    ("土", "水"): ("둑", "강물"),
    ("水", "火"): ("소나기", "불꽃"),
    ("火", "金"): ("용광로", "원석"),
    ("金", "木"): ("조각칼", "원목"),
}
_SAME_NAME = {
    "木": ("나란히 선 두 그루 나무", "나무"),
    "火": ("마주 보는 두 불꽃", "불꽃"),
    "土": ("어깨를 맞댄 두 언덕", "언덕"),
    "金": ("나란히 빛나는 두 칼날", "칼날"),
    "水": ("만나서 하나 되는 두 물줄기", "물줄기"),
}

# 관계 종류 × 관계 유형 설명 — {a}=주는/이끄는 쪽, {b}=받는/따르는 쪽 (토큰 치환 전)
_DESC = {
    "generate": {
        "lover": "{a}님이 {b}님을 아낌없이 키워주는 사랑이에요. 받는 쪽이 고마움을 자주 표현하면 오래 따뜻해요.",
        "friend": "{a}님이 판을 깔아주고 {b}님이 그 위에서 빛나는 콤비예요. 가끔은 역할을 바꿔 보세요.",
        "family": "{a}님이 든든한 울타리가 되어주는 가족이에요. 받는 쪽의 작은 보답이 큰 힘이 돼요.",
    },
    "overcome": {
        "lover": "{a}님이 {b}님을 다듬고 이끄는 사이라 묘한 긴장감 속에 강하게 끌려요. 이끄는 쪽이 말투만 부드럽게 하면 최고의 짝이에요.",
        "friend": "{a}님이 방향을 잡고 {b}님이 따라가는 콤비예요. 한쪽만 늘 맞추고 있지 않은지 가끔 살펴 주세요.",
        "family": "{a}님이 규칙을 세우고 {b}님이 맞춰 가는 가족이에요. 잔소리보다 칭찬을 한 번 더 해 주세요.",
    },
    "same": {
        "lover": "같은 기운이라 말하지 않아도 통하는 사랑이에요. 고집도 닮아서, 부딪히면 한 사람이 먼저 웃어 주세요.",
        "friend": "같은 기운이라 취향과 속도가 꼭 맞는 콤비예요. 둘 다 약한 부분은 다른 친구에게 기대 보세요.",
        "family": "같은 기운이라 닮은 점이 많은 가족이에요. 서로의 단점도 닮았다는 걸 알면 덜 서운해요.",
    },
}
_GOOD_DAY = {"stem_combine", "branch_combine", "samhap"}
_BAD_DAY = {"branch_clash", "stem_clash", "wonjin", "hyung", "hae", "pa"}
# 일주 합/충에서 오는 수식어·덧붙임 문장 — 관계 유형별
_MOOD = {
    "good": {
        "lover": ("끌리는", "일주가 합으로 묶여 처음 만났을 때부터 끌리는 인연이에요."),
        "friend": ("죽이 맞는", "일주가 합으로 묶여 처음부터 죽이 잘 맞는 사이예요."),
        "family": ("정이 깊은", "일주가 합으로 묶여 함께 있으면 마음이 편한 사이예요."),
    },
    "bad": {
        "lover": ("티격태격", "일주가 부딪혀 자주 티격태격하지만, 그만큼 서로를 깨워주는 자극이 돼요."),
        "friend": ("티격태격", "일주가 부딪혀 자주 티격태격하지만, 그만큼 솔직한 사이예요."),
        "family": ("투닥투닥", "일주가 부딪혀 투닥거릴 때가 있지만, 미운 정도 정이라 금방 풀려요."),
    },
}


def _day_element(snap: dict | None) -> str:
    ds = (snap or {}).get("day_stem", "")
    try:
        return Stem.from_char(ds).element.name
    except (KeyError, ValueError, AttributeError):
        return ""


def _day_mood(result: dict) -> str:
    day = Pillar.日柱.korean
    kinds = {r.get("kind") for r in result.get("pillar_relations") or [] if r.get("pillar1") == day}
    if kinds & _GOOD_DAY:
        return "good"
    if kinds & _BAD_DAY:
        return "bad"
    return ""


def _title(e1: str, e2: str, mood: str, rel: str) -> tuple[str, str, list[dict], str, str, str]:
    """→ (칭호, 관계 종류, 역할 2개, a 토큰, b 토큰, 그림 키) — 그림 키는 주는 쪽 오행 먼저(예: 木火, 같은 기운은 土土)"""
    if e1 == e2:
        phrase, word = _SAME_NAME[e1]
        roles = [{"token": "{p1}", "name": word, "element": e1, "emoji": _EMOJI[e1]},
                 {"token": "{p2}", "name": word, "element": e2, "emoji": _EMOJI[e2]}]
        kind, a, b = "same", "{p1}", "{p2}"
        key = e1 + e1
    else:
        o1, o2 = Oheng[e1], Oheng[e2]
        if o1.generates == o2 or o1.overcomes == o2:
            first, second, a, b = e1, e2, "{p1}", "{p2}"
        else:
            first, second, a, b = e2, e1, "{p2}", "{p1}"
        kind = "generate" if Oheng[first].generates == Oheng[second] else "overcome"
        key = first + second
        n_first, n_second = _PAIR_NAME[(first, second)]
        name_of = {first: n_first, second: n_second}
        roles = [{"token": "{p1}", "name": name_of[e1], "element": e1, "emoji": _EMOJI[e1]},
                 {"token": "{p2}", "name": name_of[e2], "element": e2, "emoji": _EMOJI[e2]}]
        # 칭호는 {p1} 쪽 비유부터
        phrase = f"{name_of[e1]}{josa(name_of[e1], '과', '와')} {name_of[e2]}"
    prefix = f"{_MOOD[mood][rel][0]} " if mood else ""
    return f"{prefix}{phrase} {_SUFFIX.get(rel, '커플')}", kind, roles, a, b, key


def _count(snap: dict | None, *els: str) -> int:
    stats = (snap or {}).get("element_stats") or {}
    return sum(stats.get(e, 0) for e in els)


def _has(result: dict, idx: int, *names: str) -> bool:
    special = set(result.get("shared_sinsal") or []) | set(result.get(f"unique_sinsal_{idx}") or [])
    sibi = set((result.get(f"pillar{idx}_snapshot") or {}).get("sibi_sinsal") or [])
    return any(n in special or n in sibi for n in names)


def _pick(v1: float, v2: float) -> str:
    return "p1" if v1 > v2 else "p2" if v2 > v1 else "both"


def _strength(snap: dict | None) -> int:
    s = snap or {}
    if isinstance(s.get("strength"), int):
        return s["strength"]
    return {"신강(身強)": 1, "신약(身弱)": -1}.get(s.get("strength_label", ""), 0)


def _scenarios(result: dict, rel: str, kind: str, a: str) -> list[dict]:
    s1, s2 = result.get("pillar1_snapshot"), result.get("pillar2_snapshot")
    st1, st2 = _strength(s1), _strength(s2)
    leader = _pick(st1, st2)  # 신강 쪽이 이끈다
    yielder = _pick(-st1, -st2)  # 신약 쪽이 먼저 맞춘다
    giver = "p1" if a == "{p1}" else "p2"
    talk = _pick(_count(s1, "火") * 2 + _count(s1, "水"), _count(s2, "火") * 2 + _count(s2, "水"))
    money = _pick(_count(s1, "土", "金"), _count(s2, "土", "金"))
    care = _pick(_count(s1, "土"), _count(s2, "土"))
    listen = _pick(_count(s1, "水"), _count(s2, "水"))
    move1 = _has(result, 1, "역마살", "지살")
    move2 = _has(result, 2, "역마살", "지살")
    mover = ("both" if move1 and move2 else "p1" if move1 else "p2" if move2
             else _pick(_count(s1, "木"), _count(s2, "木")))
    charm1, charm2 = _has(result, 1, "도화살", "년살"), _has(result, 2, "도화살", "년살")
    mood_maker = "both" if charm1 and charm2 else "p1" if charm1 else "p2" if charm2 else talk

    def _label(snap: dict | None, v: int) -> str:
        lab = (snap or {}).get("strength_label", "")
        return f"{lab} {v:+d}" if isinstance((snap or {}).get("strength"), int) else lab

    lead_snap, lead_v = (s1, st1) if leader == "p1" else (s2, st2)
    yield_snap, yield_v = (s1, st1) if yielder == "p1" else (s2, st2)
    why = {
        "lead": f"{_label(lead_snap, lead_v)}로 일간 기운이 더 강해 마음먹으면 앞장서는 쪽",
        "yield": f"{_label(yield_snap, yield_v)}로 일간 기운이 더 여려 관계를 먼저 챙기는 편",
        "talk": "불(火)·물(水) 기운이 많아 마음을 말로 잘 꺼내는 편",
        "money": "흙(土)·쇠(金) 기운이 많아 계산이 꼼꼼한 편",
        "care": "흙(土) 기운이 많아 약속과 날짜를 잘 지키는 편",
        "listen": "물(水) 기운이 많아 들어주고 헤아리는 편",
        "move": "역마·지살 기운이 있어 움직이고 바꾸는 걸 즐기는 편" if (move1 or move2) else "나무(木) 기운이 많아 새로 시작하는 걸 좋아하는 편",
        "charm": "도화(桃花) 기운이 있어 자리를 밝히는 편" if (charm1 or charm2) else "불(火)·물(水) 기운이 많아 분위기를 띄우는 편",
        "give": "오행으로 상대를 생(生)하거나 이끄는 쪽" if kind != "same" else "기운이 같아 누가 먼저랄 것 없이 함께",
    }
    q_by_rel = {
        "lover": [
            ("싸우면 누가 먼저 사과할까?", yielder, "yield"),
            ("데이트 코스는 누가 정할까?", leader, "lead"),
            ("먼저 연락하는 쪽은?", talk, "talk"),
            ("기념일을 더 잘 챙기는 쪽은?", care, "care"),
            ("함께 돈 관리를 맡는다면?", money, "money"),
            ("\"우리 여행 갈까?\" 먼저 꺼내는 쪽은?", mover, "move"),
        ],
        "friend": [
            ("약속 장소는 누가 정할까?", leader, "lead"),
            ("모임의 분위기 메이커는?", mood_maker, "charm"),
            ("고민이 생기면 들어주는 쪽은?", listen, "listen"),
            ("먼저 연락하는 쪽은?", talk, "talk"),
            ("서운하면 먼저 풀자고 하는 쪽은?", yielder, "yield"),
            ("\"이거 같이 해볼래?\" 먼저 꺼내는 쪽은?", mover, "move"),
        ],
        "family": [
            ("가족 여행 계획은 누가 세울까?", leader, "lead"),
            ("집안 분위기 메이커는?", mood_maker, "charm"),
            ("속상할 때 들어주는 쪽은?", listen, "listen"),
            ("집안 살림·돈 관리를 맡는다면?", money, "money"),
            ("챙겨주고 보살피는 쪽은?", giver if kind != "same" else "both", "give"),
            ("새로운 일(이사·여행)을 먼저 꺼내는 쪽은?", mover, "move"),
        ],
    }
    out = []
    for q, who, key in q_by_rel.get(rel, q_by_rel["lover"]):
        reason = why[key] if who != "both" else "두 분이 비슷해서 그때그때 달라요"
        out.append({"q": q, "who": who, "reason": reason})
    return out


def build_compat_character(result: dict, relation_type: str = "lover") -> dict | None:
    """궁합 캐릭터 칭호·역할·설명 + 이럴 때 두 분은? 문답. 일간 정보가 없으면 None"""
    s1, s2 = result.get("pillar1_snapshot"), result.get("pillar2_snapshot")
    e1, e2 = _day_element(s1), _day_element(s2)
    if not e1 or not e2:
        return None
    rel = relation_type if relation_type in _SUFFIX else "lover"
    mood = _day_mood(result)
    title, kind, roles, a, b, key = _title(e1, e2, mood, rel)
    desc = _DESC[kind][rel].format(a=a, b=b)
    if mood:
        desc += " " + _MOOD[mood][rel][1]
    # key → 그림 frontend/public/kkachi/compat/{key}.png (docs/COMPAT_CHARACTER_TYPES.md 15종)
    return {"title": title, "kind": kind, "key": key, "roles": roles, "desc": desc, "scenarios": _scenarios(result, rel, kind, a)}
