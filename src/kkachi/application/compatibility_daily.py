from datetime import date

from kkachi.application.fortune_rules import (
    _get_day_stembrach,
    _get_solar_term,
    _is_son_eomneun_nal,
    _level_domain,
    compute_fortune,
)
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


# 오늘 일진과 그 사람 일지의 관계 → 타일 한 줄
_REL_LABEL = {
    "육합": "오늘 일진과 합(合) — 결이 맞는 날",
    "삼합": "오늘 일진과 삼합(三合) — 힘이 실리는 날",
    "같음": "오늘 일진과 같은 지지 — 익숙한 리듬",
    "보통": "오늘 일진과 무난한 사이",
    "충": "오늘 일진과 충(衝) — 변수 있는 날",
}

# 영역별 "함께" 문구 — 두 사람 점수 중 낮은 쪽 레벨 기준 (시운 영역 키 재물·연애·직업·건강)
_TOGETHER = {
    "재물": {"좋음": "함께 돈을 쓰거나 결정하기 좋은 날", "보통": "큰 지출은 평소대로", "주의": "큰 지출·계약은 오늘 미루세요"},
    "연애": {"좋음": "데이트·깊은 대화에 힘이 실리는 날", "보통": "편안하게 곁에 있기 좋은 날", "주의": "서운한 말은 오늘 꺼내지 마세요"},
    "직업": {"좋음": "같이 일을 도모하기 좋은 날", "보통": "각자 할 일에 집중하는 날", "주의": "역할을 나눠 각자 페이스로"},
    "건강": {"좋음": "함께 몸을 움직이기 좋은 날", "보통": "무리하지 않는 선에서", "주의": "둘 다 쉬어 가는 날"},
}


def compute_daily_compat(natal1: NatalInfo, natal2: NatalInfo, today: date, name1: str, name2: str) -> dict:
    """두 사람의 '오늘' 관계. 오늘 일지가 두 사람 일지와 맺는 충·합 + 오늘 오행이 두 용신에 닿는지로 점수(base 50, 0~100).
    타고난 궁합(정식 분석)과 달리 '오늘 함께 움직이기 좋은가'만 본다.
    2026-10-18 보강: 각자의 오늘(시운과 같은 compute_fortune, 날씨·대운 없이)·영역별 함께 문구·팁을 함께 돌려준다 —
    date·day_pillar·score·level·headline은 그대로(홈 배지가 쓴다)."""
    day_sb = _get_day_stembrach(today)
    today_branch = day_sb.branch
    today_el = day_sb.stem.element
    n1, n2 = name1 or "첫째 분", name2 or "둘째 분"

    b1 = natal1.saju[Pillar.日柱].branch
    b2 = natal2.saju[Pillar.日柱].branch
    rel1 = _branch_relation(today_branch, b1)
    rel2 = _branch_relation(today_branch, b2)

    score = 50
    reasons: list[str] = []
    _DELTA = {"육합": 10, "삼합": 7, "같음": 4, "보통": 0, "충": -12}
    for who, rel in ((n1, rel1), (n2, rel2)):
        score += _DELTA[rel]
        if rel in ("육합", "삼합"):
            reasons.append(f"{who}에게 결이 맞는 날")
        elif rel == "충":
            reasons.append(f"{who}에겐 변수 있는 날")

    # 오늘 오행이 두 사람 용신에 닿으면 공통으로 힘이 실림
    yong_hits = [n for n, nat in ((n1, natal1), (n2, natal2)) if today_el == nat.yongshin]
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

    # 각자의 오늘 — 시운 화면과 같은 계산(날씨·대운·세운은 뺀다). 이름은 아침 한 마디 접두에 쓰인다
    f1 = compute_fortune(natal1, today, name=name1)
    f2 = compute_fortune(natal2, today, name=name2)
    persons = [
        {
            "name": who, "relation": rel, "relation_label": _REL_LABEL[rel],
            "yongshin": nat.yongshin.name, "yongshin_hit": today_el == nat.yongshin,
            "score": f.total_score, "level": f.level, "headline": f.headline, "action": f.action, "caution": f.caution,
        }
        for who, nat, rel, f in ((n1, natal1, rel1, f1), (n2, natal2, rel2, f2))
    ]
    # 영역별 — 둘 중 낮은 점수가 '함께'의 수준
    domains = []
    for key, d1 in f1.domain_scores.items():
        d2 = f2.domain_scores.get(key)
        if not d2:
            continue
        lvl = _level_domain(min(d1["score"], d2["score"]))
        domains.append({"key": key, "score1": d1["score"], "score2": d2["score"], "level": lvl, "label": _TOGETHER.get(key, {}).get(lvl, "")})

    son_nal = _is_son_eomneun_nal(today)
    tips: list[str] = []
    if len(yong_hits) == 2:
        tips.append("두 분 모두 용신 기운이 드는 날이에요. 미뤄 둔 결정을 함께 내려 보세요.")
    elif yong_hits:
        tips.append(f"{yong_hits[0]}에게 용신 기운이 드는 날 — 그분이 앞장서면 일이 잘 풀려요.")
    clash = [who for who, rel in ((n1, rel1), (n2, rel2)) if rel == "충"]
    if clash:
        tips.append(f"{'·'.join(clash)}에게 변수 있는 날이에요. 중요한 약속은 컨디션을 먼저 살피고 잡으세요.")
    if rel1 in ("육합", "삼합") and rel2 in ("육합", "삼합"):
        tips.append("두 분 다 오늘 일진과 결이 맞아요. 함께 외출하거나 사람을 만나기 좋아요.")
    if son_nal:
        tips.append("손없는 날이에요. 이사·계약처럼 둘이 함께 결정할 일을 하기 좋아요.")
    if not tips:
        tips.append("튀는 기운 없이 잔잔한 날이에요. 평소 루틴을 함께 지키는 하루로 보내세요.")

    term = _get_solar_term(today)
    return {
        "date": today.isoformat(),
        "day_pillar": str(day_sb),
        "score": score,
        "level": level,
        "headline": headline,
        "day_element": today_el.name,
        "solar_term": term[0] if term else None,
        "son_eomneun_nal": son_nal,
        "persons": persons,
        "domains": domains,
        "tips": tips[:3],
    }
