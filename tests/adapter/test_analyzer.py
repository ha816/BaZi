from datetime import datetime

import pytest

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.domain.ganji import Oheng, Sipsin, Stem, StemBranch
from kkachi.domain.natal import Saju
from kkachi.domain.user import Gender, User

_analyzer = NatalAdapter()

USER_1990 = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
USER_1983 = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1983, 3, 3, 15, 0))


def analyze(user):
    return _analyzer.analyze(user)


def test_analyze_basic():
    info = analyze(USER_1990)

    assert [str(p) for p in info.saju.pillars.values()] == ["庚午", "丙戌", "戊申", "己未"]
    assert info.my_main_element == Oheng.土
    assert info.saju.stem_of_day_pillar == Stem.戊
    assert info.element_stats == {Oheng.木: 0, Oheng.火: 2, Oheng.土: 4, Oheng.金: 2, Oheng.水: 0}


def test_judge_strength_strong():
    info = analyze(USER_1990)
    assert info.strength_pct == 77.1
    assert info.strength_label == "신강(身強)"


def test_judge_strength_weak():
    info = analyze(USER_1983)
    assert info.strength_pct == 21.4
    assert info.strength_label == "신약(身弱)"


# 득령(월지)·득지(일지)·득세(나머지) 교과서 예시 — 강약 판정 회귀
@pytest.mark.parametrize("palja, strong", [
    ("壬子 壬寅 甲寅 甲子", True),   # 득령·득지·득세 → 극신강
    ("庚申 己卯 甲申 庚午", False),  # 득령만, 실지·실세 → 경계지만 약
    ("甲寅 丙子 丙午 甲午", True),   # 실령이나 득지·득세
    ("壬子 辛亥 丁丑 庚子", False),  # 삼실 → 극신약
    ("丙午 甲午 戊辰 庚申", True),   # 인성 월령
    ("戊辰 丙辰 甲辰 戊辰", False),  # 재다신약 (辰 지장간 乙·癸가 조금 도움)
    ("丙寅 庚申 庚子 甲申", True),   # 월령 비겁, 나머지 식재관 — 옛 판정은 중화(0)
])
def test_strength_textbook_examples(palja, strong):
    y, m, d, h = (StemBranch.from_text(t) for t in palja.split())
    _analyzer.saju = Saju(year=y, month=m, day=d, hour=h)
    pct = _analyzer._get_strength_pct(_analyzer.saju.stem_of_day_pillar.element)
    assert (pct >= 50) == strong
    assert 0 <= pct <= 100


def test_find_yongshin_for_strong():
    info = analyze(USER_1990)
    assert info.yongshin == Oheng.金


def test_find_yongshin_for_weak():
    info = analyze(USER_1983)
    assert info.yongshin == Oheng.土


def test_personality():
    info = analyze(USER_1990)
    assert info.personality == "신용을 중시하며 포용력이 있고 듬직합니다."


def test_sipsin():
    assert Sipsin.of(Stem.戊, Stem.庚) == Sipsin.食神
    assert Sipsin.of(Stem.戊, Stem.丙) == Sipsin.偏印
    assert Sipsin.of(Stem.戊, Stem.己) == Sipsin.劫財


def test_analyze_sipsin():
    info = analyze(USER_1990)

    assert len(info.sipsin) == 7
    expected = [
        ("庚", Sipsin.食神), ("午", Sipsin.偏印), ("丙", Sipsin.偏印), ("戌", Sipsin.比肩),
        ("申", Sipsin.食神), ("己", Sipsin.劫財), ("未", Sipsin.劫財),
    ]
    assert info.sipsin == expected


def test_sipsin_domains():
    info = analyze(USER_1990)

    assert info.sipsin[0][1] == Sipsin.食神
    assert info.sipsin[0][1].domain == "재능·표현·식복"


def test_pillars_property():
    info = analyze(USER_1990)
    assert len(info.saju.pillars.values()) == 4
    assert all(len(str(p)) == 2 for p in info.saju.pillars.values())
    assert sum(info.element_stats.values()) == 8


def test_unknown_city_never_geocodes(monkeypatch):
    def _boom(*args, **kwargs):
        raise AssertionError("외부 지오코딩(Nominatim) 호출 금지")

    monkeypatch.setattr("geopy.geocoders.Nominatim.geocode", _boom)
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30), city="Songpa-gu")

    info = analyze(user)

    assert [str(p) for p in info.saju.pillars.values()] == ["庚午", "丙戌", "戊申", "己未"]
