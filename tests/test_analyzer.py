import asyncio

from bazi.domain.natal import Saju
from bazi.domain.ganji import Oheng, Sipsin, Stem
from bazi.adapter.outer.natal_adapter import NatalAdapter as NatalAnalyzer

_analyzer = NatalAnalyzer()


def analyze(saju):
    return _analyzer.analyze(saju)


def test_analyze_basic():
    saju = Saju(1990, 10, 10, 14, 30)
    info = analyze(saju)

    assert saju.pillars == ["庚午", "丙戌", "戊申", "己未"]
    assert info.my_main_element == Oheng.土
    assert info.saju.day_stem == "戊"
    assert info.element_stats == {Oheng.木: 0, Oheng.火: 2, Oheng.土: 4, Oheng.金: 2, Oheng.水: 0}


def test_judge_strength_strong():
    info = analyze(Saju(1990, 10, 10, 14, 30))
    assert info.strength == 4


def test_judge_strength_weak():
    info = analyze(Saju(1983, 3, 3, 15, 0))
    assert info.strength == -4


def test_find_yongshin_for_strong():
    info = analyze(Saju(1990, 10, 10, 14, 30))
    assert info.yongshin == Oheng.金


def test_find_yongshin_for_weak():
    info = analyze(Saju(1983, 3, 3, 15, 0))
    assert info.yongshin == Oheng.土


def test_personality():
    info = analyze(Saju(1990, 10, 10, 14, 30))
    assert info.personality == "신용을 중시하며 포용력이 있고 듬직합니다."


def test_sipsin():
    assert Sipsin.of(Stem.戊, Stem.庚) == Sipsin.食神
    assert Sipsin.of(Stem.戊, Stem.丙) == Sipsin.偏印
    assert Sipsin.of(Stem.戊, Stem.己) == Sipsin.劫財


def test_analyze_sipsin():
    info = analyze(Saju(1990, 10, 10, 14, 30))

    assert len(info.sipsin) == 7
    expected = [
        ("庚", Sipsin.食神), ("午", Sipsin.偏印), ("丙", Sipsin.偏印), ("戌", Sipsin.比肩),
        ("申", Sipsin.食神), ("己", Sipsin.劫財), ("未", Sipsin.劫財),
    ]
    assert info.sipsin == expected


def test_sipsin_domains():
    info = analyze(Saju(1990, 10, 10, 14, 30))

    assert info.sipsin[0][1] == Sipsin.食神
    assert info.sipsin[0][1].domain == "재능·표현·식복"


def test_pillars_property():
    saju = Saju(1990, 10, 10, 14, 30)
    assert len(saju.pillars) == 4
    assert all(len(p) == 2 for p in saju.pillars)
    assert sum(analyze(saju).element_stats.values()) == 8
