from datetime import datetime

from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.application.interpret import Interpreter

analyze_natal = NatalAnalyzer()
analyze_postnatal = PostnatalAnalyzer()
interpret = Interpreter()


def test_full_interpretation():
    """종합 해석 통합 테스트"""
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    saju = Saju(1990, 10, 10, 14, 30)
    natal = analyze_natal(saju)
    postnatal = analyze_postnatal(user, saju, year=2026)

    interp = interpret(user, natal, postnatal)

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
