from kkachi.application.util.sipsin_meta import SIPSIN_ORDER, SIPSIN_TRAIT, sipsin_korean
from kkachi.application.util.util import josa
from kkachi.domain.ganji import Sipsin

# "내 사주 맞춰 보기" (ROADMAP V3) — 분석 결과의 십신 개수로 10문항 예측을 만든다.
# 결과 dict(natal.sipsin)만 보므로 캐시된 옛 분석에도 동작. 설문 답으로 출생시간을 추정하지 않는다(사용자 결정).

_SELF_Q: dict[Sipsin, str] = {
    Sipsin.比肩: "한번 정한 건 남이 뭐래도 내 방식대로 하는 편인가요?",
    Sipsin.劫財: "게임이나 내기에서 지면 유독 분한 편인가요?",
    Sipsin.食神: "맛있는 걸 먹으며 여유 부리는 시간이 꼭 필요한 편인가요?",
    Sipsin.傷官: "불합리하다 싶으면 윗사람에게도 할 말은 하는 편인가요?",
    Sipsin.偏財: "기분이 좋으면 통 크게 한턱 내는 편인가요?",
    Sipsin.正財: "지출을 기록하고 꼼꼼히 아끼는 편인가요?",
    Sipsin.偏官: "급한 상황에서 망설이지 않고 바로 결정하는 편인가요?",
    Sipsin.正官: "약속 시간과 규칙을 칼같이 지키는 편인가요?",
    Sipsin.偏印: "혼자만의 시간이 없으면 쉽게 지치는 편인가요?",
    Sipsin.正印: "새로운 걸 배우고 자격을 따는 걸 좋아하는 편인가요?",
}
_PREDICT_LABEL = {"yes": "그렇다", "no": "아니다"}


def build_self_quiz(natal: dict) -> list[dict]:
    """natal 결과 dict → [{q, basis, count, predict(yes|no), reason}] 10문항. 십신이 1개라도 있으면 그렇다. 십신 정보가 없으면 []"""
    entries = natal.get("sipsin") or []
    if not entries:
        return []
    counts: dict[str, int] = {}
    for e in entries:
        counts[e.get("sipsin_name", "")] = counts.get(e.get("sipsin_name", ""), 0) + 1
    out = []
    for sp in SIPSIN_ORDER:
        n = counts.get(sp.name, 0)
        predict = "yes" if n >= 1 else "no"
        kor = f"{sipsin_korean(sp)}({sp.name})"
        trait = SIPSIN_TRAIT[sp] + josa(SIPSIN_TRAIT[sp], "이", "가")
        if n >= 2:
            why = f"사주에 {kor}{josa(sipsin_korean(sp), '이', '가')} {n}개 — {trait} 뚜렷한 편"
        elif n == 1:
            why = f"사주에 {kor}{josa(sipsin_korean(sp), '이', '가')} 1개 — {trait} 있는 편"
        else:
            why = f"사주에 {kor}{josa(sipsin_korean(sp), '이', '가')} 없어요 — {trait} 약한 편"
        out.append({
            "q": _SELF_Q[sp], "basis": sp.name, "count": n, "predict": predict,
            "reason": f"{why}이라 '{_PREDICT_LABEL[predict]}'{josa(_PREDICT_LABEL[predict], '으로', '로')} 예측했어요",
        })
    return out
