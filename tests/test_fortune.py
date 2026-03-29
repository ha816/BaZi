from datetime import datetime

from bazi.domain.natal import Saju
from bazi.domain.ganji import Sipsin
from bazi.domain.user import Gender, User
from bazi.adapter.outer.natal_adapter import NatalAdapter, PostnatalAdapter
from bazi.application.util.util import year_to_ganji

_natal = NatalAdapter()
_postnatal = PostnatalAdapter()

MALE_USER = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
FEMALE_USER = User(name="테스트", gender=Gender.FEMALE, birth_dt=datetime(1990, 10, 10, 14, 30))
NATAL = _natal.analyze(MALE_USER)


def analyze_postnatal(user, natal, year):
    return _postnatal.analyze(user, natal, year)


def analyze_natal(user):
    return _natal.analyze(user)


def test_year_to_ganji():
    assert year_to_ganji(1990) == "庚午"
    assert year_to_ganji(2000) == "庚辰"
    assert year_to_ganji(2024) == "甲辰"
    assert year_to_ganji(2026) == "丙午"


def test_seun():
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    assert postnatal.seun_stem == ("丙", Sipsin.偏印)
    assert postnatal.seun_branch == ("午", Sipsin.偏印)


def test_daeun_forward():
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    assert postnatal.daeun[0].ganji == "丁亥"
    assert postnatal.daeun[0].start_age == 9
    assert postnatal.daeun[0].end_age == 18


def test_daeun_backward():
    postnatal = analyze_postnatal(FEMALE_USER, NATAL, year=2026)
    assert postnatal.daeun[0].ganji == "乙酉"


def test_daeun_start_age_forward():
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    assert postnatal.daeun[0].start_age == 9


def test_daeun_start_age_backward():
    postnatal = analyze_postnatal(FEMALE_USER, NATAL, year=2026)
    assert postnatal.daeun[0].start_age == 1


def test_get_current_daeun():
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    assert postnatal.current_daeun is not None
    assert postnatal.current_daeun.ganji == "己丑"


def test_check_yongshin_in_seun():
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    assert postnatal.yongshin_in_seun is False


def test_find_clashes():
    user_1984 = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1984, 3, 15, 12, 0))
    natal = analyze_natal(user_1984)
    postnatal = analyze_postnatal(user_1984, natal, year=2026)
    assert len(postnatal.seun_clashes) >= 1
    assert any(c["incoming"] == "午" and c["target"] == "子" for c in postnatal.seun_clashes)


def test_find_combines():
    postnatal = analyze_postnatal(MALE_USER, NATAL, year=2026)
    branch_combines = [c for c in postnatal.seun_combines if c["type"] == "지지합"]
    assert len(branch_combines) == 1
    assert branch_combines[0]["incoming"] == "午"
    assert branch_combines[0]["target"] == "未"
