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


def test_cross_line_covers_levels_and_rotates_by_day():
    for level in ("좋은 날", "평범한 날", "주의가 필요한 날"):
        for orientation in ("정방향", "역방향"):
            line = cross_line({"orientation": orientation}, level, TODAY)
            assert line.endswith("요.") and not _FOREIGN.search(line)
    today_line = cross_line({"orientation": "정방향"}, "좋은 날", TODAY)
    assert today_line != cross_line({"orientation": "정방향"}, "좋은 날", TODAY + timedelta(days=1))
    assert today_line == cross_line({"orientation": "정방향"}, "좋은 날", TODAY + timedelta(days=2))
    assert cross_line({"orientation": "역방향"}, "모르는 레벨", TODAY) == cross_line({"orientation": "역방향"}, "평범한 날", TODAY)
