from bazi.domain.fortune import Saju
from bazi.application.natal import NatalAnalyzer
from bazi.application.fortune import FortuneChart
from bazi.application.interpret import full_interpretation

analyze = NatalAnalyzer()


def test_full_interpretation():
    """종합 해석 통합 테스트"""
    saju = Saju(year_pillar="庚午", month_pillar="丙戌",
                day_pillar="己巳", hour_pillar="辛未")
    natal = analyze(saju)
    fortune = FortuneChart(natal, year=2026, is_male=True,
                           birth_year=1990, birth_month=10, birth_day=10,
                           birth_hour=14, birth_minute=30)

    interp = full_interpretation(natal, fortune, age=35)

    # 용신 확인
    assert interp.yongshin == "金"
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