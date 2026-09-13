from datetime import date

from kkachi.application.fortune_rules import _get_day_stembrach
from kkachi.domain.ganji import SAMHAP_GROUPS, Branch, Pillar
from kkachi.domain.natal import NatalInfo


def _branch_relation(a: Branch, b: Branch) -> str:
    if a == b:
        return "같음"
    if a.combines == b:
        return "육합"
    if a.clashes == b:
        return "충"
    if any(a.name in g and b.name in g for g, _ in SAMHAP_GROUPS):
        return "삼합"
    return "보통"


def compute_daily_compat(natal1: NatalInfo, natal2: NatalInfo, today: date, name1: str, name2: str) -> dict:
    """두 사람의 '오늘' 관계. 오늘 일지가 두 사람 일지와 맺는 충·합 + 오늘 오행이 두 용신에 닿는지로 점수.
    base 50, 0~100. 타고난 궁합(정식 분석)과 달리 '오늘 함께 움직이기 좋은가'만 본다."""
    day_sb = _get_day_stembrach(today)
    today_branch = day_sb.branch
    today_el = day_sb.stem.element

    b1 = natal1.saju[Pillar.日柱].branch
    b2 = natal2.saju[Pillar.日柱].branch
    rel1 = _branch_relation(today_branch, b1)
    rel2 = _branch_relation(today_branch, b2)

    score = 50
    reasons: list[str] = []
    _DELTA = {"육합": 10, "삼합": 7, "같음": 4, "보통": 0, "충": -12}
    for who, rel in ((name1 or "첫째 분", rel1), (name2 or "둘째 분", rel2)):
        score += _DELTA[rel]
        if rel in ("육합", "삼합"):
            reasons.append(f"{who}에게 결이 맞는 날")
        elif rel == "충":
            reasons.append(f"{who}에겐 변수 있는 날")

    # 오늘 오행이 두 사람 용신에 닿으면 공통으로 힘이 실림
    yong_hits = [n for n, nat in ((name1, natal1), (name2, natal2)) if today_el == nat.yongshin]
    if len(yong_hits) == 2:
        score += 12
        reasons.append("두 분 모두 용신 기운이 드는 날")
    elif len(yong_hits) == 1:
        score += 6

    # 두 사람 일지끼리 타고난 관계도 살짝 반영
    innate = _branch_relation(b1, b2)
    if innate in ("육합", "삼합"):
        score += 4
    elif innate == "충":
        score -= 4

    score = max(0, min(100, score))
    if score >= 65:
        level, headline = "좋음", "오늘은 함께 움직이기 좋은 날이에요."
    elif score >= 45:
        level, headline = "보통", "오늘은 무난하게 통하는 날이에요."
    else:
        level, headline = "주의", "오늘은 서로 페이스를 존중하면 좋은 날이에요."

    if reasons:
        headline += " " + ", ".join(dict.fromkeys(reasons)) + "."
    return {
        "date": today.isoformat(),
        "day_pillar": str(day_sb),
        "score": score,
        "level": level,
        "headline": headline,
    }
