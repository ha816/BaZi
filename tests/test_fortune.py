from bazi.chart import NatalChart
from bazi.fortune import FortuneChart, year_to_ganji


def test_year_to_ganji():
    """연도 → 간지 변환"""
    assert year_to_ganji(1990) == "庚午"
    assert year_to_ganji(2000) == "庚辰"
    assert year_to_ganji(2024) == "甲辰"
    assert year_to_ganji(2026) == "丙午"


def test_seun():
    """세운 분석: 해당 연도 간지의 십신"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.seun_ganji == "丙午"
    assert fortune.seun == [("丙", "正印"), ("午", "正印")]


def test_daeun_forward():
    """대운 순행: 양남"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.daeun[0].ganji == "丁亥"
    assert fortune.daeun[0].start_age == 9
    assert fortune.daeun[0].end_age == 18


def test_daeun_backward():
    """대운 역행: 양녀"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=False,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.daeun[0].ganji == "乙酉"


def test_daeun_start_age_forward():
    """순행 대운 시작 나이"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.daeun[0].start_age == 9


def test_daeun_start_age_backward():
    """역행 대운 시작 나이"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=False,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.daeun[0].start_age == 1


def test_get_current_daeun():
    """현재 나이에 해당하는 대운 찾기"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.get_current_daeun(15).ganji == "丁亥"
    assert fortune.get_current_daeun(25).ganji == "戊子"
    assert fortune.get_current_daeun(35).ganji == "己丑"


def test_check_yongshin_in_seun():
    """세운에서 용신 확인"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    # 용신=금, 2026=丙午(화,화) → False
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    assert fortune.check_yongshin_in_seun() is False


def test_find_clashes():
    """지지충 찾기"""
    natal = NatalChart(["甲子", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    # 세운 丙午의 午 vs 년주 子 → 충
    clashes = fortune.find_clashes("丙午")
    assert len(clashes) == 1
    assert clashes[0]["incoming"] == "午"
    assert clashes[0]["target"] == "子"
    assert clashes[0]["pillar"] == "년주"


def test_find_combines():
    """천간합·지지합 찾기"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    # 辛未: 辛-丙(천간합, 월주), 未-午(지지합, 년주)
    combines = fortune.find_combines("辛未")
    stem_combines = [c for c in combines if c["type"] == "천간합"]
    branch_combines = [c for c in combines if c["type"] == "지지합"]

    assert len(stem_combines) == 1
    assert stem_combines[0]["target"] == "丙"
    assert len(branch_combines) == 1
    assert branch_combines[0]["target"] == "午"
