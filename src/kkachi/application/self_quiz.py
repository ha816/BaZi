from kkachi.application.util.sipsin_meta import SIPSIN_ORDER, SIPSIN_TRAIT, sipsin_korean
from kkachi.application.util.util import josa
from kkachi.domain.ganji import Sipsin

# 설문조사(ROADMAP V3) — 분석 결과의 십신·지장간 조합으로 10문항 예측을 만든다.
# 결과 dict(natal.pillars·sipsin·jizan_gan)만 보므로 캐시된 옛 분석에도 동작. 설문 답으로 출생시간을 추정하지 않는다(사용자 결정).
#
# 십신별 점수 = 드러난 천간 자리 가중 + 지지 속 지장간(여기·중기·본기 비중만큼) 자리 가중 + 투출 보너스.
# 자리 가중은 신강·신약(natal_adapter._get_strength_pct)과 같은 값 — 일간 제외 합 95점.
# 투출: 지장간에 숨은 글자가 천간에도 그대로 드러나면 그 기운이 뿌리째 선다고 보고 보너스.
# 2026-10-13 생년월일 300개 표본: 8점 이상을 '그렇다'로 두면 한 사람당 평균 5.2개(최소 3·최대 8) — 옛 개수 규칙(평균 5.1)과 균형이 같다.

# 그렇다/아니다로 답하는 문장형 — "좋은 성향이니 그렇다"로 쏠리지 않게 구체적인 행동으로 (2026-10-13)
_SELF_Q: dict[Sipsin, str] = {
    Sipsin.比肩: "다들 반대해도 내가 옳다 싶으면 그대로 밀고 나간다",
    Sipsin.劫財: "가벼운 게임이라도 지면 \"한 판 더!\"를 외친다",
    Sipsin.食神: "아무리 바빠도 맛있는 걸 먹는 시간은 꼭 챙긴다",
    Sipsin.傷官: "이상하다 싶으면 윗사람 앞에서도 말을 꺼낸다",
    Sipsin.偏財: "기분 좋은 날엔 \"오늘은 내가 쏠게\"가 먼저 나온다",
    Sipsin.正財: "물건을 사기 전에 가격을 여러 번 비교해 본다",
    Sipsin.偏官: "급한 일이 터지면 고민보다 몸이 먼저 움직인다",
    Sipsin.正官: "약속 시간에 늦는 건 스스로 용납이 안 된다",
    Sipsin.偏印: "사람을 만나고 나면 혼자 충전하는 시간이 꼭 필요하다",
    Sipsin.正印: "궁금한 게 생기면 찾아보고 배워야 직성이 풀린다",
}
_PLACE = ["태어난 해", "태어난 달", "태어난 날", "태어난 시간"]
_STEM_W = {0: 8, 1: 12, 3: 10}           # 년간·월간·시간 (일간은 나 자신이라 제외)
_BRANCH_W = {0: 8, 1: 30, 2: 15, 3: 12}  # 년지·월지·일지·시지
_TOUCHUL_BONUS = 5
_YES_AT = 8
_STRONG_AT = 20


def _score(natal: dict) -> dict[str, dict]:
    """십신 이름 → {score, best(가장 큰 자리 문구), best_w, touchul(드러난 천간 자리 문구 | None)}"""
    out = {sp.name: {"score": 0.0, "best": "", "best_w": 0.0, "touchul": None} for sp in SIPSIN_ORDER}

    def add(name: str, w: float, where: str):
        if name not in out or w <= 0:
            return
        o = out[name]
        o["score"] += w
        if w > o["best_w"]:
            o["best"], o["best_w"] = where, w

    pillars = natal.get("pillars") or []
    entries = iter(natal.get("sipsin") or [])
    jizan = natal.get("jizan_gan") or []
    stems: list[tuple[str, str, int]] = []  # (글자, 십신, 자리)
    for pi, _ in enumerate(pillars):
        if pi != 2:
            e = next(entries, None)
            if e:
                stems.append((e.get("char", ""), e.get("sipsin_name", ""), pi))
                add(e.get("sipsin_name", ""), _STEM_W[pi], f"{_PLACE[pi]} 천간")
        branch = next(entries, None)
        hidden = jizan[pi] if pi < len(jizan) else []
        if hidden:
            for h in hidden:
                add(h.get("sipsin_name", ""), _BRANCH_W[pi] * h.get("weight", 0) / 100, f"{_PLACE[pi]} 지지 속")
        elif branch:  # 지장간이 없는 옛 결과 — 지지 본기 십신에 자리 가중 전부
            add(branch.get("sipsin_name", ""), _BRANCH_W[pi], f"{_PLACE[pi]} 지지")
    hidden_chars = {h.get("stem") for hs in jizan for h in hs}
    for ch, name, pi in stems:
        if ch in hidden_chars and name in out and out[name]["touchul"] is None:
            out[name]["score"] += _TOUCHUL_BONUS
            out[name]["touchul"] = f"{_PLACE[pi]} 천간"
    return out


def _reason(sp: Sipsin, s: dict, yes: bool) -> str:
    kor = f"{sipsin_korean(sp)}({sp.name})"
    trait = SIPSIN_TRAIT[sp] + josa(SIPSIN_TRAIT[sp], "이", "가")
    if yes and s["touchul"]:
        return f"{s['touchul']}에 드러나고 지지에도 뿌리를 둔 {kor} 기운 — {trait} 뚜렷한 편이에요"
    if yes and s["score"] >= _STRONG_AT:
        return f"{s['best']}에 자리한 {kor} 기운이 커서 — {trait} 뚜렷한 편이에요"
    if yes:
        return f"{s['best']}에 {kor} 기운이 있어 — {trait} 드러나는 편이에요"
    if s["score"] > 0:
        return f"{kor} 기운이 {s['best']}에 조금 숨어 있을 뿐이라 — {trait} 잔잔한 편이에요"
    return f"{kor} 기운이 사주에 드러나지 않아 — {trait} 잔잔한 편이에요"


def build_self_quiz(natal: dict) -> list[dict]:
    """natal 결과 dict → [{q, basis, count, score, predict(yes|no), reason}] 10문항. 십신 정보가 없으면 []"""
    entries = natal.get("sipsin") or []
    if not entries:
        return []
    counts: dict[str, int] = {}
    for e in entries:
        counts[e.get("sipsin_name", "")] = counts.get(e.get("sipsin_name", ""), 0) + 1
    scores = _score(natal)
    out = []
    for sp in SIPSIN_ORDER:
        s = scores[sp.name]
        yes = s["score"] >= _YES_AT
        out.append({
            "q": _SELF_Q[sp], "basis": sp.name, "count": counts.get(sp.name, 0), "score": round(s["score"], 1),
            "predict": "yes" if yes else "no", "reason": _reason(sp, s, yes),
        })
    return out
