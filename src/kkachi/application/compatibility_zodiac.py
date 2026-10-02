from dataclasses import asdict

from kkachi.application.interpreter.zodiac import PILLAR_ROLES
from kkachi.application.util.util import branch_relation, year_to_branch_char, year_to_ganji
from kkachi.application.util.zodiac_meta import zodiac_info
from kkachi.domain.ganji import SAMHAP_GROUPS, Oheng

# 궁합 "띠궁합" — 두 사람의 년지(띠)로 띠끼리 충합 + 앞으로 4년 각자의 띠 관계.
# 결과 dict의 스냅샷(년주)만 쓰므로 옛 캐시에도 동작. 이름은 {p1}·{p2} 토큰.

_GOOD = ("삼합", "육합")
_LABEL = {"나": "같은 띠", "삼합": "삼합(三合)", "육합": "육합(六合)", "충": "충(衝)", "원진": "원진(怨嗔)", "보통": "보통"}
_PAIR_TAIL = {
    "삼합": "띠끼리 가장 잘 맞는 짝으로, 함께 있으면 기운이 크게 모여요.",
    "육합": "서로 끌어당기며 조화롭게 맞춰 가는 짝이에요.",
    "충": "정반대 자리의 띠라 성향 차이가 크게 느껴질 수 있어요. 다름을 인정하면 서로의 시야를 넓혀주는 짝이에요.",
    "원진": "이유 없이 서운함이 쌓이기 쉬운 짝이라, 마음을 말로 자주 풀어주는 게 좋아요.",
    "보통": "특별한 충·합이 없는 무난한 짝이에요. 띠보다 일주·오행의 궁합이 더 크게 작용해요.",
}


# 12띠 원 순서 (子가 맨 위, 시계 방향) — 프론트 원 그림과 같은 순서
_BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
# 육합이 되면 바뀌는 오행 (ganji.BranchCombine 주석과 같음)
_YUKHAP_ELEMENT = {frozenset("子丑"): "土", frozenset("寅亥"): "木", frozenset("卯戌"): "火",
                   frozenset("辰酉"): "金", frozenset("巳申"): "水", frozenset("午未"): "土"}


def _el(name: str) -> str:
    return f"{Oheng[name].meaning}({name})"


def _mini(b: str) -> dict:
    z = zodiac_info(b)
    return {"branch": b, "korean": z.korean, "emoji": z.emoji}


def _chunghap(b1: str, b2: str) -> dict:
    """십이지 충합 — 두 띠 관계의 제목·풀이 + 삼합 세 자리/육합 오행 + 12띠 각자 관계 + 두 분 모두와 맞는 띠"""
    rel = branch_relation(b1, b2)
    k1, k2 = zodiac_info(b1).korean, zodiac_info(b2).korean
    trio: dict | None = None
    if rel == "삼합":
        group, el = next((g, e) for g, e in SAMHAP_GROUPS if b1 in g and b2 in g)
        third = next(iter(group - {b1, b2}))
        order = sorted(group, key=_BRANCHES.index)
        trio = {"branches": order, "element": el, "third": _mini(third)}
        title = f"{b1}{b2} 반합(半合) — {zodiac_info(third).korean}띠가 더해지면 {_el(el)}국 삼합"
        explain = (f"두 띠는 {'·'.join(zodiac_info(b).korean for b in order)} 삼합의 두 자리예요. "
                   f"{zodiac_info(third).korean}띠가 함께하면 {_el(el)}국 삼합이 완성돼 기운이 크게 모여요. "
                   "둘만이 아니라 셋 이상이 함께하는 모임·가족·팀에서 특히 빛나는 짝이에요.")
    elif rel == "육합":
        el = _YUKHAP_ELEMENT[frozenset(b1 + b2)]
        title = f"{b1}{b2} 육합(六合) — 합쳐지면 {_el(el)} 기운"
        explain = (f"{k1}띠와 {k2}띠는 서로 끌어당겨 하나로 묶이는 육합이에요. 합쳐지면 {_el(el)} 기운으로 바뀌어요. "
                   "여럿보다 둘만의 관계(연애·동업·단짝)에서 힘이 커지는 짝이에요.")
    elif rel == "충":
        title = f"{b1}{b2} 충(衝) — 12띠 원의 정반대 자리"
        explain = ("12띠 원에서 마주 보는(180°) 자리예요. 성향과 생활 리듬이 반대라 처음엔 부딪히기 쉽지만, "
                   "서로에게 없는 것을 보여주는 자극이 되기도 해요. 같은 일을 함께하기보다 역할을 나누면 충이 약해져요.")
    elif rel == "원진":
        title = f"{b1}{b2} 원진(怨嗔) — 서로 꺼리는 기운"
        explain = ("이유 없이 서운하고 꺼려지는 기운이 있는 짝이에요. 큰 다툼보다 작은 서운함이 조용히 쌓이는 형태라, "
                   "감정이 쌓이기 전에 자주 말로 풀어주는 게 가장 좋은 해법이에요.")
    elif rel == "나":
        title = f"{b1}{b2} 같은 띠 — 한 자리에 두 사람"
        explain = ("같은 띠는 12띠 원의 한 자리에 두 사람이 함께 선 셈이에요. 취향과 속도가 닮아 편하지만 같은 약점도 나눠 가져서, "
                   "둘 다 약한 부분은 바깥의 도움으로 채우면 좋아요.")
    else:
        title = f"{b1}{b2} 보통 — 충·합이 없는 사이"
        explain = ("삼합·육합·충·원진 어디에도 속하지 않는 사이예요. 띠로 보면 끌림도 마찰도 크지 않아, "
                   "두 분의 관계는 일주·오행 같은 다른 글자들이 더 크게 좌우해요.")
    ring = [{**_mini(b), "rel1": branch_relation(b1, b), "rel2": branch_relation(b2, b)} for b in _BRANCHES]
    friends = [_mini(r["branch"]) for r in ring
               if r["branch"] not in (b1, b2) and r["rel1"] in _GOOD and r["rel2"] in _GOOD]
    return {"relation": rel, "title": title, "explain": explain, "trio": trio, "ring": ring, "friends": friends}


_PAIR_PRIORITY = {"삼합": 0, "육합": 1, "나": 2, "충": 3, "원진": 4}
_PILLAR_SHORT = ["년주", "월주", "일주", "시주"]


def _branches(snap: dict | None) -> list[str]:
    return [p[1] for p in (snap or {}).get("pillars") or [] if len(p) == 2]


def _pillar_zodiac(s1: dict | None, s2: dict | None) -> dict | None:
    """사주지지 — 네 기둥의 띠를 같은 자리끼리 나란히 + 다른 자리끼리 맺는 띠 관계 + 한 줄"""
    l1, l2 = _branches(s1), _branches(s2)
    if not l1 or not l2:
        return None
    columns = []
    for i in range(4):
        b1 = l1[i] if i < len(l1) else ""
        b2 = l2[i] if i < len(l2) else ""
        columns.append({
            "label": PILLAR_ROLES[i]["label"], "role": PILLAR_ROLES[i]["role"],
            "p1": _mini(b1) if b1 else None, "p2": _mini(b2) if b2 else None,
            "relation": branch_relation(b1, b2) if b1 and b2 else "",
        })
    cross = []
    for i, b1 in enumerate(l1):
        for j, b2 in enumerate(l2):
            if i == j:
                continue
            rel = branch_relation(b1, b2)
            if rel in _PAIR_PRIORITY:
                cross.append({"p1_pillar": _PILLAR_SHORT[i], "p2_pillar": _PILLAR_SHORT[j],
                              "p1": _mini(b1), "p2": _mini(b2), "relation": rel, "relation_label": _LABEL[rel]})
    cross.sort(key=lambda c: (_PAIR_PRIORITY[c["relation"]], _PILLAR_SHORT.index(c["p1_pillar"])))
    all_rels = [branch_relation(a, b) for a in l1 for b in l2]
    good = sum(r in _GOOD for r in all_rels)
    bad = sum(r in ("충", "원진") for r in all_rels)
    same = sum(r == "나" for r in all_rels)
    n = len(l1) * len(l2)
    if good > bad:
        tone = "끌어당기는 합이 더 많아, 어느 자리에서 만나도 손발이 잘 맞는 편이에요"
    elif bad > good:
        tone = "부딪히는 충·원진이 더 많아, 서로의 다름을 인정하는 연습이 관계를 단단하게 해요"
    else:
        tone = "합과 충돌이 비슷해, 잘 맞는 자리와 조심할 자리가 분명한 사이예요"
    tip = f"두 분의 띠 {len(l1)}개×{len(l2)}개, {n}쌍 중 합 {good}쌍·충돌 {bad}쌍·같은 띠 {same}쌍 — {tone}."
    return {"columns": columns, "cross": cross[:6], "tip": tip}


def _year_branch(snap: dict | None) -> str:
    pillars = (snap or {}).get("pillars") or []
    return pillars[0][1] if pillars and len(pillars[0]) == 2 else ""


def _pair_line(b1: str, b2: str) -> str:
    z1, z2 = zodiac_info(b1), zodiac_info(b2)
    rel = branch_relation(b1, b2)
    if rel == "나":
        return f"두 분 모두 {z1.korean}띠 — 같은 띠라 생각과 리듬이 닮았어요. 단점도 닮아서 부딪히면 둘 다 물러서지 않을 수 있어요."
    return f"{{p1}}님 {z1.korean}띠와 {{p2}}님 {z2.korean}띠는 {_LABEL[rel]} — {_PAIR_TAIL[rel]}"


def _years_line(rows: list[dict]) -> str:
    both = [r for r in rows if r["rel1"] in _GOOD and r["rel2"] in _GOOD]
    clash = [r for r in rows if "충" in (r["rel1"], r["rel2"])]
    parts: list[str] = []
    if both:
        r = both[0]
        parts.append(f"{r['year']}년({r['kor']}띠 해)은 두 분 모두에게 합이 드는 해라 함께 큰일을 벌이기 좋아요")
    else:
        one = next((r for r in rows if r["rel1"] in _GOOD or r["rel2"] in _GOOD), None)
        if one:
            who = "{p1}" if one["rel1"] in _GOOD else "{p2}"
            parts.append(f"{one['year']}년({one['kor']}띠 해)은 {who}님에게 합이 드는 해라 그분이 앞장서면 좋아요")
    if clash:
        r = clash[0]
        who = "두 분 모두" if r["rel1"] == r["rel2"] == "충" else ("{p1}님" if r["rel1"] == "충" else "{p2}님")
        parts.append(f"{r['year']}년은 {who}에게 충이 드는 해라 변화가 많으니 서로 일정을 넉넉히 잡아 주세요")
    if not parts:
        return "앞으로 4년은 띠로 보면 두 분 모두 큰 충·합 없이 무난하게 흘러가요."
    return ". ".join(parts) + "."


def build_compat_zodiac(result: dict, base_year: int) -> dict | None:
    """두 사람 띠 정보·띠 관계 한 줄·연도별(4년) 각자 관계. 스냅샷이 없으면 None"""
    b1 = _year_branch(result.get("pillar1_snapshot"))
    b2 = _year_branch(result.get("pillar2_snapshot"))
    if not b1 or not b2:
        return None
    rel = branch_relation(b1, b2)
    rows = []
    for i in range(4):
        year = base_year + i
        b = year_to_branch_char(year)
        z = zodiac_info(b)
        rows.append({
            "year": year, "ganji": year_to_ganji(year), "branch": b, "kor": z.korean, "emoji": z.emoji,
            "rel1": branch_relation(b1, b), "rel2": branch_relation(b2, b),
        })
    return {
        "p1": asdict(zodiac_info(b1)),
        "p2": asdict(zodiac_info(b2)),
        "relation": rel,
        "relation_label": _LABEL[rel],
        "headline": _pair_line(b1, b2),
        "chunghap": _chunghap(b1, b2),
        "pillars": _pillar_zodiac(result.get("pillar1_snapshot"), result.get("pillar2_snapshot")),
        "years": rows,
        "years_line": _years_line(rows),
    }


def zodiac_summary_line(result: dict) -> str:
    """한눈에용 한 줄 — 띠 관계만"""
    b1 = _year_branch(result.get("pillar1_snapshot"))
    b2 = _year_branch(result.get("pillar2_snapshot"))
    if not b1 or not b2:
        return ""
    rel = branch_relation(b1, b2)
    k1, k2 = zodiac_info(b1).korean, zodiac_info(b2).korean
    if rel == "나":
        return f"두 분 모두 {k1}띠라 리듬이 닮은 짝이에요."
    tail = {"삼합": "띠끼리 가장 잘 맞아요", "육합": "서로 끌어당기는 짝이에요", "충": "성향 차이가 큰 짝이에요",
            "원진": "서운함이 쌓이지 않게 말로 풀어주세요", "보통": "무난한 짝이에요"}[rel]
    return f"{{p1}}님 {k1}띠와 {{p2}}님 {k2}띠는 {_LABEL[rel]} — {tail}."
