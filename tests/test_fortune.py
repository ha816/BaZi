from datetime import datetime

from bazi.domain.natal import Saju
from bazi.domain.ganji import Sipsin
from bazi.domain.user import Gender, User
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.domain.util import year_to_ganji

analyze_natal = NatalAnalyzer()
analyze_postnatal = PostnatalAnalyzer()

MALE_USER = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
FEMALE_USER = User(name="테스트", gender=Gender.FEMALE, birth_dt=datetime(1990, 10, 10, 14, 30))
SAJU = Saju(1990, 10, 10, 14, 30)
NATAL = analyze_natal(SAJU)


def test_year_to_ganji():
    """연도 → 간지 변환"""
    assert year_to_ganji(1990) == "庚午"
    assert year_to_ganji(2000) == "庚辰"
    assert year_to_ganji(2024) == "甲辰"
    assert year_to_ganji(2026) == "丙午"


def test_seun():
    """세운 분석: 해당 연도 간지의 십신"""
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)

    assert postnatal.seun_stem == ("丙", Sipsin.偏印)
    assert postnatal.seun_branch == ("午", Sipsin.偏印)


def test_daeun_forward():
    """대운 순행: 양남"""
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)

    assert postnatal.daeun[0].ganji == "丁亥"
    assert postnatal.daeun[0].start_age == 9
    assert postnatal.daeun[0].end_age == 18


def test_daeun_backward():
    """대운 역행: 양녀"""
    postnatal = analyze_postnatal(FEMALE_USER, NATAL, year=2026)

    assert postnatal.daeun[0].ganji == "乙酉"


def test_daeun_start_age_forward():
    """순행 대운 시작 나이"""
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)

    assert postnatal.daeun[0].start_age == 9


def test_daeun_start_age_backward():
    """역행 대운 시작 나이"""
    postnatal = analyze_postnatal(FEMALE_USER, NATAL, year=2026)

    assert postnatal.daeun[0].start_age == 1


def test_get_current_daeun():
    """현재 나이에 해당하는 대운 찾기"""
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)

    assert postnatal.current_daeun is not None
    assert postnatal.current_daeun.ganji == "己丑"  # 37세(2026-1990+1)


def test_check_yongshin_in_seun():
    """세운에서 용신 확인"""
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    # 용신=金, 2026=丙午(화,화) → False
    assert postnatal.yongshin_in_seun is False


def test_find_clashes():
    """지지충 찾기 (1984-03-15 12:00, 년주에 子 → 2026 丙午와 충)"""
    user_1984 = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1984, 3, 15, 12, 0))
    saju = Saju(1984, 3, 15, 12, 0)
    natal = analyze_natal(saju)
    postnatal = analyze_postnatal(user_1984, natal, year=2026)

    assert len(postnatal.seun_clashes) >= 1
    assert any(c["incoming"] == "午" and c["target"] == "子" for c in postnatal.seun_clashes)


def test_find_combines():
    """지지합 찾기 (1990-10-10, 시주 未 → 丙午의 午와 지지합)"""
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)

    branch_combines = [c for c in postnatal.seun_combines if c["type"] == "지지합"]
    assert len(branch_combines) == 1
    assert branch_combines[0]["incoming"] == "午"
    assert branch_combines[0]["target"] == "未"
