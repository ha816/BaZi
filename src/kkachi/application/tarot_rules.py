import hashlib
import random
from datetime import date

from kkachi.application.util.util import josa
from kkachi.domain.tarot import CARDS, TarotCard
from kkachi.domain.user import User

REVERSED_RATE = 0.25  # 매일 역방향이면 아침부터 무거워서 넷 중 하나만

# 교차 한 줄(2026-11-06 고도화 — 옛 6셀×2문장은 카드가 무엇이든 같은 말이었다). 두 문장:
# 1문장 = (오늘 일진 레벨, 카드 밝기) 판정 틀에 카드 이름·첫 키워드를 끼움. 일진 headline은 안 붙인다 — 홈 ① 오늘의 나와 겹친다
# 카드 밝기: 보통 정방향 밝음·역방향 그늘이지만, 무거운 카드(탑·달·검 10…)는 정방향이 그늘이고 그중 대부분은 역방향이 풀림(밝음)
_HEAVY_UP = {"major_15", "major_16", "major_18", "wands_05", "wands_10", "cups_04", "cups_05", "cups_07",
             "swords_02", "swords_03", "swords_05", "swords_08", "swords_09", "swords_10", "pents_05"}
_BRIGHT_REV = _HEAVY_UP - {"major_16", "wands_05"}  # 탑·지팡이 5는 뒤집혀도 그늘(예고된 위기·소모전)
_CROSS_VERDICT: dict[tuple[str, str], str] = {
    ("좋은 날", "밝음"): "좋은 일진에 {name}도 {rev}{kw}{eul} 말하며 힘을 보태요.",
    ("좋은 날", "그늘"): "일진은 좋은데 {name}{ga} {rev}{kw}{eul} 조심하라고 해요.",
    ("평범한 날", "밝음"): "평범한 일진에 {name}{ga} {rev}{kw}{eul} 말하며 힘을 보태요.",
    ("평범한 날", "그늘"): "평범한 일진인데 {name}{ga} {rev}{kw}{eul} 짚어요.",
    ("주의가 필요한 날", "밝음"): "일진은 조심하라는데 {name}{neun} {rev}{kw}{eul} 말하며 밝게 나왔어요.",
    ("주의가 필요한 날", "그늘"): "일진도 조심하라 하고 {name}도 {rev}{kw}{eul} 짚어요.",
}
# 두 신호의 합 — 밝은 카드는 주의 날만 반반(mixed), 그늘진 카드는 좋은 날만 반반
_CROSS_TONE: dict[tuple[str, str], str] = {
    ("좋은 날", "밝음"): "go", ("평범한 날", "밝음"): "go", ("주의가 필요한 날", "밝음"): "mixed",
    ("좋은 날", "그늘"): "mixed", ("평범한 날", "그늘"): "hold", ("주의가 필요한 날", "그늘"): "hold",
}
# 2문장 = 카드의 영역(수트: 지팡이 일·추진, 잔 마음·관계, 검 생각·결정, 동전 돈·몸, 메이저 큰 흐름) × 두 신호의 합
_CROSS_ACTION: dict[str, dict[str, str]] = {
    "지팡이": {"go": "하고 싶던 일은 오늘 한 걸음 내디디세요.", "mixed": "일은 크게 벌이지 말고 하나만 고르세요.", "hold": "밀어붙이기보다 속도를 늦추세요."},
    "잔": {"go": "마음을 전하기 좋은 날이에요.", "mixed": "사람 일은 가볍게, 깊은 얘기는 다음에 하세요.", "hold": "서운한 말은 하루 묵혀 두세요."},
    "검": {"go": "미뤄 둔 결정을 또렷하게 내리세요.", "mixed": "말은 아끼고 결정은 하나만 하세요.", "hold": "말과 결정은 내일로 미루세요."},
    "동전": {"go": "돈과 몸을 챙기는 일이 잘 풀려요.", "mixed": "큰 지출만 피하면 무난해요.", "hold": "지출과 계약은 피하고 몸을 쉬게 하세요."},
    "메이저": {"go": "큰 흐름이 밀어주니 흐름을 타세요.", "mixed": "큰 변화는 하루 더 지켜보세요.", "hold": "큰 결정과 변화는 서두르지 마세요."},
}


def draw_daily(today: date, user: User | None = None) -> dict:
    """오늘의 타로카드 — 사람(생년월일시·성별)과 날짜로 정해진다. 같은 입력이면 늘 같은 카드라 저장 없이 캐시 효과.
    identity에 profile_id를 쓰지 않는 이유: 직접 입력 → 가입·프로필 저장 순간 카드가 바뀌지 않게(둘이 같은 카드).
    user가 없으면 날짜만으로 뽑는다(비로그인 홈 티저 — 모두 같은 카드). 반환 {date, identity: person|date, card}."""
    identity = f"{user.birth_dt:%Y-%m-%dT%H:%M}|{user.gender}" if user else ""
    digest = hashlib.sha256(f"kkachi-tarot-v1|{identity}|{today.isoformat()}".encode()).digest()
    rng = random.Random(int.from_bytes(digest[:8], "big"))
    card = CARDS[rng.randrange(len(CARDS))]
    reversed_ = rng.random() < REVERSED_RATE
    return {"date": today.isoformat(), "identity": "person" if user else "date", "card": _card_view(card, reversed_)}


def cross_line(card: dict, level: str) -> str:
    """오늘 일진 레벨(좋은 날·평범한 날·주의가 필요한 날) × 카드(_card_view) → 교차 두 문장.
    1문장은 두 신호의 합 + 카드 이름·첫 키워드(조사는 josa — "지팡이 3이"), 2문장은 카드 영역(수트, 메이저는 큰 흐름)에 맞는 행동.
    카드 밝기는 방향에 무거운 카드 예외(_HEAVY_UP·_BRIGHT_REV)를 얹어 정한다. 모르는 레벨은 평범한 날로."""
    if level not in ("좋은 날", "평범한 날", "주의가 필요한 날"):
        level = "평범한 날"
    reversed_ = card["orientation"] == "역방향"
    bright = (card["key"] in _BRIGHT_REV) if reversed_ else (card["key"] not in _HEAVY_UP)
    key = (level, "밝음" if bright else "그늘")
    name, kw = card["name"], card["keywords"][0]
    verdict = _CROSS_VERDICT[key].format(
        name=name, kw=kw, rev="뒤집혀 " if reversed_ else "",
        ga=josa(name, "이", "가"), neun=josa(name, "은", "는"), eul=josa(kw, "을", "를"),
    )
    return f"{verdict} {_CROSS_ACTION[card['suit'] or '메이저'][_CROSS_TONE[key]]}"


def _card_view(card: TarotCard, reversed_: bool) -> dict:
    """방향에 맞는 문장만 평탄화 — 프론트가 정·역을 분기하지 않게."""
    return {
        "id": card.id,
        "key": card.key,
        "name": card.name,
        "arcana": card.arcana,
        "number": card.number,
        "suit": card.suit,
        "orientation": "역방향" if reversed_ else "정방향",
        "keywords": list(card.keywords_rev if reversed_ else card.keywords_up),
        "line": card.line_rev if reversed_ else card.line_up,
        "love": card.love_rev if reversed_ else card.love_up,
        "work": card.work_rev if reversed_ else card.work_up,
        "money": card.money_rev if reversed_ else card.money_up,
    }
