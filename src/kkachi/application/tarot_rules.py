import hashlib
import random
from datetime import date

from kkachi.domain.tarot import CARDS, TarotCard
from kkachi.domain.user import User

REVERSED_RATE = 0.25  # 매일 역방향이면 아침부터 무거워서 넷 중 하나만

# (오늘 일진 레벨, 카드 방향) → 교차 한 줄 두 개(날짜로 회전). 일진 headline은 안 붙인다 — 홈 ① 오늘의 나와 겹친다
_CROSS: dict[tuple[str, str], tuple[str, str]] = {
    ("좋은 날", "정방향"): (
        "오늘 일진도 좋은 날이고 카드도 밝은 쪽이에요. 미뤄 둔 일을 오늘 하세요.",
        "사주와 카드가 같은 방향을 가리켜요. 자신 있게 움직여도 되는 날이에요.",
    ),
    ("좋은 날", "역방향"): (
        "일진은 좋은 날인데 카드는 그늘진 쪽이에요. 기운은 있으니 속도만 늦추세요.",
        "운은 밀어주는데 마음에 걸리는 게 있어요. 걸리는 그것부터 정리하면 좋은 날이 돼요.",
    ),
    ("평범한 날", "정방향"): (
        "일진은 잔잔한데 카드가 밝아요. 카드가 가리키는 한 가지에 힘을 쓰세요.",
        "큰 흐름은 조용한 날이에요. 카드의 주제 하나만 챙기면 알찬 하루예요.",
    ),
    ("평범한 날", "역방향"): (
        "일진도 카드도 조용히 가라는 신호예요. 새 일보다 정리가 어울려요.",
        "무리할 이유가 없는 날이에요. 카드가 짚어 준 것만 조심하면 돼요.",
    ),
    ("주의가 필요한 날", "정방향"): (
        "일진은 조심하라는데 카드는 밝아요. 카드가 말한 쪽으로만 움직이고 나머지는 쉬세요.",
        "하루 기운은 거친데 카드가 손을 내밀어요. 카드의 조언이 오늘의 안전지대예요.",
    ),
    ("주의가 필요한 날", "역방향"): (
        "일진도 카드도 조심하라고 해요. 결정은 내일로, 오늘은 몸과 잠을 챙기세요.",
        "두 신호가 같이 멈추라고 해요. 오늘은 지키는 날이에요.",
    ),
}


def draw_daily(today: date, user: User | None = None) -> dict:
    """오늘의 카드 — 사람(생년월일시·성별)과 날짜로 정해진다. 같은 입력이면 늘 같은 카드라 저장 없이 캐시 효과.
    identity에 profile_id를 쓰지 않는 이유: 직접 입력 → 가입·프로필 저장 순간 카드가 바뀌지 않게(둘이 같은 카드).
    user가 없으면 날짜만으로 뽑는다(비로그인 홈 티저 — 모두 같은 카드). 반환 {date, identity: person|date, card}."""
    identity = f"{user.birth_dt:%Y-%m-%dT%H:%M}|{user.gender}" if user else ""
    digest = hashlib.sha256(f"kkachi-tarot-v1|{identity}|{today.isoformat()}".encode()).digest()
    rng = random.Random(int.from_bytes(digest[:8], "big"))
    card = CARDS[rng.randrange(len(CARDS))]
    reversed_ = rng.random() < REVERSED_RATE
    return {"date": today.isoformat(), "identity": "person" if user else "date", "card": _card_view(card, reversed_)}


def cross_line(card: dict, level: str, today: date) -> str:
    """오늘 일진 레벨(좋은 날·평범한 날·주의가 필요한 날) × 카드 방향 → 교차 한 줄. 모르는 레벨은 평범한 날로."""
    lines = _CROSS.get((level, card["orientation"])) or _CROSS[("평범한 날", card["orientation"])]
    return lines[today.toordinal() % len(lines)]


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
