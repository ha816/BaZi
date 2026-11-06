import re
from collections import Counter
from dataclasses import fields
from datetime import date, datetime, timedelta

from kkachi.application.tarot_rules import REVERSED_RATE, cross_line, draw_daily
from kkachi.domain.tarot import CARDS
from kkachi.domain.user import Gender, User

TODAY = date(2026, 11, 5)
ME = User(name="나", gender=Gender.FEMALE, birth_dt=datetime(1990, 5, 3, 9))
OTHER = User(name="남", gender=Gender.MALE, birth_dt=datetime(1990, 5, 3, 9))  # 같은 생시, 성별만 다름
_FOREIGN = re.compile(r"[一-鿿A-Za-z]")  # 한자·영문 — 화면 폰트 서브셋 밖


def test_deck_is_78_unique_cards_in_order():
    assert len(CARDS) == 78 and [c.id for c in CARDS] == list(range(78))
    assert len({c.key for c in CARDS}) == 78 and len({c.name for c in CARDS}) == 78
    assert sum(c.arcana == "major" for c in CARDS) == 22
    assert Counter(c.suit for c in CARDS if c.arcana == "minor") == {"지팡이": 14, "잔": 14, "검": 14, "동전": 14}
    assert CARDS[0].name == "바보" and CARDS[21].name == "세계" and CARDS[22].name == "지팡이 에이스" and CARDS[77].name == "동전 왕"
    assert CARDS[22].key == "wands_01" and CARDS[35].key == "wands_14"


def test_all_text_is_korean_and_filled():
    text_fields = [f.name for f in fields(CARDS[0]) if f.name not in ("id", "number", "arcana", "key", "suit")]
    for c in CARDS:
        for name in text_fields:
            v = getattr(c, name)
            parts = v if isinstance(v, tuple) else (v,)
            assert len(parts) == (3 if name.startswith("keywords") else 1), (c.key, name)
            for s in parts:
                assert s.strip() and not _FOREIGN.search(s), (c.key, name, s)
        assert c.keywords_up != c.keywords_rev and c.line_up != c.line_rev, c.key
        assert c.key.split("_")[0] in ("major", "wands", "cups", "swords", "pents")  # 그림 파일 키는 ASCII


def test_same_input_same_card_and_shape():
    a, b = draw_daily(TODAY, ME), draw_daily(TODAY, ME)
    assert a == b and a["identity"] == "person" and a["date"] == "2026-11-05"
    card = a["card"]
    assert set(card) == {"id", "key", "name", "arcana", "number", "suit", "orientation", "keywords", "line", "love", "work", "money"}
    assert card["orientation"] in ("정방향", "역방향") and len(card["keywords"]) == 3
    src = CARDS[card["id"]]
    expected_line = src.line_rev if card["orientation"] == "역방향" else src.line_up
    assert card["line"] == expected_line and card["key"] == src.key  # 방향에 맞는 문장만 평탄화


def test_cards_vary_by_day_and_person_and_date_only_mode():
    month = [draw_daily(TODAY + timedelta(days=i), ME)["card"]["key"] for i in range(30)]
    assert len(set(month)) >= 10  # 한 달에 열 종류 이상
    assert draw_daily(TODAY, ME)["card"] != draw_daily(TODAY, OTHER)["card"] or draw_daily(TODAY + timedelta(days=1), ME)["card"] != draw_daily(TODAY + timedelta(days=1), OTHER)["card"]
    plain = draw_daily(TODAY)
    assert plain["identity"] == "date" and plain == draw_daily(TODAY)  # 사람 없으면 모두 같은 카드
    assert plain["card"] != draw_daily(TODAY, ME)["card"] or plain["card"] != draw_daily(TODAY + timedelta(days=1), ME)["card"]


def test_reversed_rate_is_about_a_quarter():
    n = 2000
    users = [User(name="", gender=Gender.MALE, birth_dt=datetime(1980, 1, 1) + timedelta(days=i)) for i in range(n)]
    reversed_ = sum(draw_daily(TODAY, u)["card"]["orientation"] == "역방향" for u in users)
    assert 0.20 <= reversed_ / n <= 0.30 and abs(reversed_ / n - REVERSED_RATE) < 0.05


_CARD = {"key": "major_00", "name": "바보", "suit": None, "orientation": "정방향", "keywords": ["시작", "모험", "자유"]}
_LEVELS = ("좋은 날", "평범한 날", "주의가 필요한 날")


def test_cross_line_weaves_card_name_keyword_and_suit():
    """2026-11-06: 1문장은 (일진 레벨 × 카드 밝기) 판정 틀에 카드 이름·첫 키워드, 2문장은 카드 영역(수트·메이저) × 두 신호의 합."""
    for level in _LEVELS:
        for orientation in ("정방향", "역방향"):
            for suit in (None, "지팡이", "잔", "검", "동전"):
                line = cross_line({**_CARD, "orientation": orientation, "suit": suit}, level)
                assert line.endswith("요.") and not _FOREIGN.search(line)
                assert "바보" in line and "시작을" in line and line.count(". ") == 1  # 두 문장: 판정 + 영역 행동
    wands, cups = (cross_line({**_CARD, "suit": s}, "좋은 날") for s in ("지팡이", "잔"))
    assert wands.split(". ")[0] == cups.split(". ")[0] and wands != cups  # 수트는 2문장째만 바꾼다
    assert cross_line(_CARD, "좋은 날") != cross_line({**_CARD, "orientation": "역방향"}, "좋은 날")
    assert cross_line(_CARD, "모르는 레벨") == cross_line(_CARD, "평범한 날")
    # 조사 — 받침·숫자 이름("지팡이 3이", "잔 4가")·키워드
    assert "탑이 뒤집혀" in cross_line({**_CARD, "name": "탑", "orientation": "역방향"}, "좋은 날")
    assert "지팡이 3이 뒤집혀" in cross_line({**_CARD, "name": "지팡이 3", "suit": "지팡이", "orientation": "역방향"}, "좋은 날")
    assert "잔 4가 뒤집혀" in cross_line({**_CARD, "name": "잔 4", "suit": "잔", "orientation": "역방향"}, "좋은 날")
    assert "동전 10이 뒤집혀" in cross_line({**_CARD, "name": "동전 10", "suit": "동전", "orientation": "역방향"}, "좋은 날")
    assert "무모함을 짚어요" in cross_line({**_CARD, "orientation": "역방향", "keywords": ["무모함", "망설임", "준비 부족"]}, "평범한 날")
    # 카드 밝기 — 무거운 카드는 정방향이 그늘, 뒤집히면 풀림(탑은 뒤집혀도 그늘)
    moon = {"key": "major_18", "name": "달", "suit": None, "orientation": "정방향", "keywords": ["불안", "직감", "모호함"]}
    assert cross_line(moon, "좋은 날").startswith("일진은 좋은데 달이 불안을 조심하라고 해요.")
    ten = {"key": "swords_10", "name": "검 10", "suit": "검", "orientation": "역방향", "keywords": ["회복 시작", "최악 통과", "재기"]}
    assert cross_line(ten, "주의가 필요한 날").startswith("일진은 조심하라는데 검 10은 뒤집혀 회복 시작을 말하며 밝게 나왔어요.")
    tower = {"key": "major_16", "name": "탑", "suit": None, "orientation": "역방향", "keywords": ["예고된 위기", "버티기", "피해 줄이기"]}
    assert cross_line(tower, "평범한 날").startswith("평범한 일진인데 탑이 뒤집혀 예고된 위기를 짚어요.")


def test_cross_line_for_every_card_and_level_is_korean_only():
    for c in CARDS:
        for orientation, kws in (("정방향", c.keywords_up), ("역방향", c.keywords_rev)):
            card = {"key": c.key, "name": c.name, "suit": c.suit, "orientation": orientation, "keywords": list(kws)}
            for level in _LEVELS:
                line = cross_line(card, level)
                assert c.name in line and kws[0] in line and not _FOREIGN.search(line)