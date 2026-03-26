from datetime import datetime

from bazi.domain.fortune import Saju
from bazi.application.natal import NatalAnalyzer
from bazi.application.postnatal import PostnatalAnalyzer, year_to_ganji

analyze_natal = NatalAnalyzer()
analyze_fortune = PostnatalAnalyzer()

SAJU = Saju(datetime(1990, 10, 10, 14, 30))
NATAL = analyze_natal(SAJU)


def test_year_to_ganji():
    """연도 → 간지 변환"""
    assert year_to_ganji(1990) == "庚午"
    assert year_to_ganji(2000) == "庚辰"
    assert year_to_ganji(2024) == "甲辰"
    assert year_to_ganji(2026) == "丙午"


def test_seun():
    """세운 분석: 해당 연도 간지의 십신"""
    fortune = analyze_fortune(SAJU, year=2026, is_male=True)

    assert fortune.seun_ganji == "丙午"
    assert fortune.seun == [("丙", "偏印"), ("午", "偏印")]


def test_daeun_forward():
    """대운 순행: 양남"""
    fortune = analyze_fortune(SAJU, year=2026, is_male=True)

    assert fortune.daeun[0].ganji == "丁亥"
    assert fortune.daeun[0].start_age == 9
    assert fortune.daeun[0].end_age == 18


def test_daeun_backward():
    """대운 역행: 양녀"""
    fortune = analyze_fortune(SAJU, year=2026, is_male=False)

    assert fortune.daeun[0].ganji == "乙酉"


def test_daeun_start_age_forward():
    """순행 대운 시작 나이"""
    fortune = analyze_fortune(SAJU, year=2026, is_male=True)

    assert fortune.daeun[0].start_age == 9


def test_daeun_start_age_backward():
    """역행 대운 시작 나이"""
    fortune = analyze_fortune(SAJU, year=2026, is_male=False)

    assert fortune.daeun[0].start_age == 1


def test_get_current_daeun():
    """현재 나이에 해당하는 대운 찾기"""
    from bazi.application.interpret import _get_current_daeun
    fortune = analyze_fortune(SAJU, year=2026, is_male=True)

    assert _get_current_daeun(fortune.daeun, 15).ganji == "丁亥"
    assert _get_current_daeun(fortune.daeun, 25).ganji == "戊子"
    assert _get_current_daeun(fortune.daeun, 37).ganji == "己丑"


def test_check_yongshin_in_seun():
    """세운에서 용신 확인"""
    from bazi.application.interpret import _check_yongshin
    fortune = analyze_fortune(SAJU, year=2026, is_male=True)
    # 용신=金, 2026=丙午(화,화) → False
    assert _check_yongshin(NATAL.yongshin, fortune.seun_ganji) is False


def test_find_clashes():
    """지지충 찾기 (1984-03-15 12:00, 년주에 子 → 2026 丙午와 충)"""
    from bazi.application.interpret import _find_clashes
    saju = Saju(datetime(1984, 3, 15, 12, 0))
    natal = analyze_natal(saju)

    clashes = _find_clashes(natal, "丙午")
    assert len(clashes) >= 1
    assert any(c["incoming"] == "午" and c["target"] == "子" for c in clashes)


def test_find_combines():
    """지지합 찾기 (1990-10-10, 시주 未 → 丙午의 午와 지지합)"""
    from bazi.application.interpret import _find_combines

    combines = _find_combines(NATAL, "丙午")
    branch_combines = [c for c in combines if c["type"] == "지지합"]

    assert len(branch_combines) == 1
    assert branch_combines[0]["incoming"] == "午"
    assert branch_combines[0]["target"] == "未"