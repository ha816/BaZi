from datetime import datetime

from bazi.domain.fortune import Saju
from bazi.application.natal import NatalAnalyzer
from bazi.application.postnatal import PostnatalAnalyzer
from bazi.application.interpret import full_interpretation

analyze_natal = NatalAnalyzer()
analyze_fortune = PostnatalAnalyzer()


def test_full_interpretation():
    """종합 해석 통합 테스트"""
    saju = Saju(datetime(1990, 10, 10, 14, 30))
    natal = analyze_natal(saju)
    fortune = analyze_fortune(saju, year=2026, is_male=True)

    interp = full_interpretation(natal, fortune, age=37)

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