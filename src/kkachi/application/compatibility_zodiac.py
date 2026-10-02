from dataclasses import asdict

from kkachi.application.util.util import branch_relation, year_to_branch_char, year_to_ganji
from kkachi.application.util.zodiac_meta import zodiac_info

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
