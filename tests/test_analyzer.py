from bazi.domain.fortune import Saju
from bazi.domain.ganji import Sipsin
from bazi.application.natal import NatalAnalyzer

analyze = NatalAnalyzer()


def test_analyze_basic():
    """기본 사주 분석 (1990-10-10 14:30)"""
    saju = Saju(1990, 10, 10, 14, 30)
    info = analyze(saju)

    assert saju.pillars == ["庚午", "丙戌", "戊申", "己未"]
    assert info.my_main_element == "土"
    assert info.saju.day_stem == "戊"
    assert info.element_stats == {"木": 0, "火": 2, "土": 4, "金": 2, "水": 0}


def test_judge_strength_strong():
    """신강 판단 (1990-10-10 14:30, strength=+4)"""
    info = analyze(Saju(1990, 10, 10, 14, 30))
    assert info.strength == 4


def test_judge_strength_weak():
    """신약 판단 (1983-03-03 15:00, strength=-4)"""
    info = analyze(Saju(1983, 3, 3, 15, 0))
    assert info.strength == -4


def test_find_yongshin_for_strong():
    """신강일 때 용신"""
    info = analyze(Saju(1990, 10, 10, 14, 30))
    assert info.yongshin == "金"


def test_find_yongshin_for_weak():
    """신약일 때 용신"""
    info = analyze(Saju(1983, 3, 3, 15, 0))
    assert info.yongshin == "土"


def test_personality():
    """일간 오행 기반 성격 조회"""
    info = analyze(Saju(1990, 10, 10, 14, 30))
    assert info.personality == "신용을 중시하며 포용력이 있고 듬직합니다."


def test_sipsin():
    """일간 기준 십신 판별"""
    assert Sipsin.of("戊", "庚") == Sipsin.食神
    assert Sipsin.of("戊", "丙") == Sipsin.偏印
    assert Sipsin.of("戊", "己") == Sipsin.劫財


def test_analyze_sipsin():
    """팔자 전체 십신 분석 (일간 제외 7글자)"""
    info = analyze(Saju(1990, 10, 10, 14, 30))

    assert len(info.sipsin) == 7
    expected = [
        ("庚", "食神"), ("午", "偏印"), ("丙", "偏印"), ("戌", "比肩"),
        ("申", "食神"), ("己", "劫財"), ("未", "劫財"),
    ]
    assert info.sipsin == expected


def test_sipsin_domains():
    """십신 영역 해석"""
    info = analyze(Saju(1990, 10, 10, 14, 30))

    assert len(info.sipsin_domains) == 7
    assert info.sipsin_domains[0]["sipsin"] == "食神"
    assert info.sipsin_domains[0]["domain"] == "재능·표현·식복"


def test_pillars_property():
    """saju.pillars 프로퍼티"""
    saju = Saju(1990, 10, 10, 14, 30)
    assert len(saju.pillars) == 4
    assert all(len(p) == 2 for p in saju.pillars)
    assert sum(analyze(saju).element_stats.values()) == 8