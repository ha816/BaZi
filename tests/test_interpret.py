from saju.natal import NatalChart
from saju.fortune import FortuneChart
from saju.interpret import full_interpretation


def test_full_interpretation():
    """종합 해석 통합 테스트"""
    natal = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    interp = full_interpretation(natal, fortune, age=35)

    # 용신 확인
    assert interp.yongshin == "금"
    assert isinstance(interp.yongshin_in_seun, bool)
    assert isinstance(interp.yongshin_in_daeun, bool)

    # 세운 십신
    assert len(interp.seun_sipsin) == 2

    # 현재 대운
    assert interp.current_daeun is not None

    # 종합 문장이 생성됨
    assert len(interp.summary) > 0
    assert any("용신" in line for line in interp.summary)
    assert any("세운" in line for line in interp.summary)
