import re
from collections import Counter
from dataclasses import fields
from datetime import date, datetime, timedelta

from kkachi.application.iching_rules import (
    CATEGORIES,
    HELPLINES,
    ask,
    cast,
    categorize,
    check_question,
    cross_line,
    normalize_question,
)
from kkachi.domain.ganji import Oheng
from kkachi.domain.iching import HEXAGRAM_BY_LINES, HEXAGRAMS, TRIGRAMS
from kkachi.domain.user import Gender, User

TODAY = date(2026, 11, 6)
ME = User(name="나", gender=Gender.FEMALE, birth_dt=datetime(1990, 5, 3, 9))
_FOREIGN = re.compile(r"[一-鿿A-Za-z]")  # 한자·영문 — 화면 폰트 서브셋 밖(괘 글자는 hanja 필드에만)
_HANJA_ONLY = re.compile(r"^[一-鿿]{1,2}$")


def test_eight_trigrams_cover_all_line_patterns():
    assert len(TRIGRAMS) == 8 and len({t.lines for t in TRIGRAMS.values()}) == 8
    assert Counter(t.element for t in TRIGRAMS.values()) == {"金": 2, "木": 2, "土": 2, "火": 1, "水": 1}
    assert TRIGRAMS["geon"].lines == (True, True, True) and TRIGRAMS["gon"].lines == (False, False, False)


def test_sixty_four_hexagrams_in_king_wen_order():
    assert len(HEXAGRAMS) == 64 and [h.id for h in HEXAGRAMS] == list(range(1, 65))
    assert len({h.key for h in HEXAGRAMS}) == 64 and len({h.name for h in HEXAGRAMS}) == 64
    assert len(HEXAGRAM_BY_LINES) == 64  # 위·아래 팔괘 쌍이 모두 다르다
    assert HEXAGRAMS[0].traditional == "중천건" and HEXAGRAMS[2].traditional == "수뢰둔" and HEXAGRAMS[15].traditional == "뇌지예"
    assert HEXAGRAMS[10].traditional == "지천태" and HEXAGRAMS[11].traditional == "천지비" and HEXAGRAMS[63].traditional == "화수미제"
    assert HEXAGRAM_BY_LINES[(True,) * 6] is HEXAGRAMS[0] and HEXAGRAM_BY_LINES[(False,) * 6] is HEXAGRAMS[1]
    assert HEXAGRAM_BY_LINES[(True, False, False, False, True, False)].id == 3  # 아래 진 ☳ · 위 감 ☵ = 둔


def test_all_text_is_korean_and_hanja_only_in_hanja_field():
    text_fields = [f.name for f in fields(HEXAGRAMS[0]) if f.name not in ("id", "key", "hanja", "upper", "lower")]
    for h in HEXAGRAMS:
        assert _HANJA_ONLY.match(h.hanja), h.id
        for name in text_fields:
            v = getattr(h, name)
            for s in (v if isinstance(v, tuple) else (v,)):
                assert s.strip() and not _FOREIGN.search(s), (h.id, name, s)
        assert len(h.keywords) == 3 and h.now != h.next and h.now.endswith("요.") and h.next.startswith("앞으로")
    for t in TRIGRAMS.values():
        assert _HANJA_ONLY.match(t.hanja) and not _FOREIGN.search(t.name + t.reading + t.nature)


def test_three_coin_distribution():
    counts = Counter(v for seed in range(2000) for v in cast(seed))
    total = sum(counts.values())
    assert set(counts) == {6, 7, 8, 9}
    assert 0.10 < counts[6] / total < 0.15 and 0.10 < counts[9] / total < 0.15  # 1/8
    assert 0.34 < counts[7] / total < 0.41 and 0.34 < counts[8] / total < 0.41  # 3/8


def test_same_question_same_hexagram_and_normalization():
    a = ask("이직을 해도 될까요?", TODAY, ME)
    assert a == ask("이직을  해도 될까요 ?", TODAY, ME) and a["question"] == "이직을 해도 될까요"
    assert a["identity"] == "person" and a["date"] == "2026-11-06" and a["category"] == "일"
    assert set(a) == {"date", "identity", "question", "category", "values", "mode", "hexagram", "transformed", "change", "area", "cross"}
    assert len(a["values"]) == 6 and all(v in (6, 7, 8, 9) for v in a["values"]) and a["cross"] is None
    assert set(a["hexagram"]) == {"id", "key", "name", "hanja", "traditional", "upper", "lower", "keywords", "lines", "line"}
    assert a["hexagram"]["line"] == HEXAGRAMS[a["hexagram"]["id"] - 1].now
    assert a["area"] == {"label": "일", "text": HEXAGRAMS[a["hexagram"]["id"] - 1].work}
    # 다른 질문·다른 날·다른 사람이면 대개 다른 괘
    others = {ask(q, TODAY, ME)["hexagram"]["id"] for q in ("연애운 어때", "돈 들어올까", "집 사도 될까", "이사 가도 될까", "공부 될까")}
    assert len(others | {a["hexagram"]["id"]}) >= 3
    assert ask("이직을 해도 될까요", TODAY)["identity"] == "date"
    assert normalize_question("  괜찮을까?!  ") == "괜찮을까"


def test_modes_and_transformed_hexagram():
    seen = {}
    for i in range(300):
        a = ask(f"질문 {i}번", TODAY, ME)
        seen.setdefault(a["mode"], a)
        yang = [v in (7, 9) for v in a["values"]]
        changing = [v in (6, 9) for v in a["values"]]
        assert [ln["yang"] for ln in a["hexagram"]["lines"]] == yang and [ln["changing"] for ln in a["hexagram"]["lines"]] == changing
        if a["mode"] == "still":
            assert a["transformed"] is None and not any(changing) and a["change"].startswith("움직이는 줄이 없어요")
        else:
            t = a["transformed"]
            assert [ln["yang"] for ln in t["lines"]] == [y != c for y, c in zip(yang, changing)] and not any(ln["changing"] for ln in t["lines"])
            assert t["line"] == HEXAGRAMS[t["id"] - 1].next and t["id"] != a["hexagram"]["id"]
            assert (a["mode"] == "one") == (sum(changing) == 1)
            assert t["name"] in a["change"] and ("번째 줄" in a["change"] if a["mode"] == "one" else "한꺼번에" in a["change"])
    assert set(seen) == {"still", "one", "many"}  # 300번이면 세 경우 모두(변효 0은 약 18%)


def test_category_detection_and_explicit_chip():
    assert categorize("남자친구가 연락 올까") == "연애" and categorize("주식 지금 사도 될까") == "재물"
    assert categorize("이번 면접 붙을까") == "일" and categorize("내일 비 올까") == "기타"
    plain = ask("내일 비 올까", TODAY, ME)
    assert plain["category"] == "기타" and plain["area"] is None
    forced = ask("내일 비 올까", TODAY, ME, "연애")
    assert forced["category"] == "연애" and forced["area"]["text"] == HEXAGRAMS[forced["hexagram"]["id"] - 1].love
    assert forced["hexagram"] == plain["hexagram"]  # 칩은 영역 문장만 바꾸고 괘는 그대로
    assert set(CATEGORIES) == {"연애", "일", "재물", "기타"}


def test_crisis_signal_detected_before_casting():
    assert check_question("요즘 너무 힘들어서 죽고 싶어요") == "crisis" and check_question("죽고싶다") == "crisis"
    assert check_question("자해 충동이 들어요") == "crisis" and check_question("이직할까") is None
    assert check_question("죽도록 열심히 했는데 합격할까") is None  # 관용 표현은 아님
    assert {h["number"] for h in HELPLINES} == {"109", "1577-0199"}


def test_cross_line_follows_element_relation_and_day_level():
    a = ask("이직을 해도 될까요", TODAY, ME)
    up, low = Oheng[a["hexagram"]["upper"]["element"]], Oheng[a["hexagram"]["lower"]["element"]]
    same = cross_line(a, up, "좋은 날")
    assert same.startswith(f"이 괘에는 내게 꼭 필요한 {up.value[0]}({up.name}) 기운이 들어 있어요.")
    assert same.endswith("오늘 일진이 좋아 바뀌는 흐름이 순하게 풀려요." if a["mode"] != "still" else "오늘 일진도 좋으니 지금 흐름을 믿고 가세요.")
    gen = cross_line(a, up.generates, "평범한 날") if up.generates not in (up, low) else cross_line(a, low.generates, "평범한 날")
    assert "키워 줘요" in gen and ("평범" in gen)
    over = cross_line(a, up.overcomes, "주의가 필요한 날") if up.overcomes not in (up, low) and low.generates != up.overcomes else None
    if over:
        assert "누르니" in over and "조심하라" in over
    assert cross_line(a, up, "이상한 레벨").endswith(_DAY_PLAIN(a["mode"]))
    for level in ("좋은 날", "평범한 날", "주의가 필요한 날"):
        for yong in Oheng:
            s = cross_line(a, yong, level)
            assert s.count(". ") == 1 and s.endswith("요.") and not re.search(r"[A-Za-z]", s)


def _DAY_PLAIN(mode: str) -> str:
    return "일진도 평범하니 급할 것 없는 날이에요." if mode == "still" else "일진은 평범하니 변화를 차분히 받아들이세요."


def test_month_of_questions_varies():
    ids = {ask("오늘 하루 어떨까", TODAY + timedelta(days=i), ME)["hexagram"]["id"] for i in range(30)}
    assert len(ids) >= 12
