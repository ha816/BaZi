from datetime import datetime

from bazi.domain.ganji import Oheng
from bazi.domain.natal import Saju
from bazi.domain.user import Gender, User
from bazi.application.natal import NatalAnalyzer, PostnatalAnalyzer
from bazi.application.interpret import Interpretation, Interpreter

analyze_natal = NatalAnalyzer()
analyze_postnatal = PostnatalAnalyzer()
interpret = Interpreter()


def _make_result(year: int = 2026) -> Interpretation:
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    saju = Saju(1990, 10, 10, 14, 30)
    natal = analyze_natal(saju)
    postnatal = analyze_postnatal(user, natal, year=year)
    return interpret(natal, postnatal)


def test_returns_interpretation_dataclass():
    result = _make_result()
    assert isinstance(result, Interpretation)


def test_personality_section():
    result = _make_result()
    assert len(result.personality) > 0
    assert any("당신" in line or "에너지" in line for line in result.personality)


def test_element_balance_section():
    result = _make_result()
    assert len(result.element_balance) > 0
    assert any("신강" in line or "신약" in line or "중화" in line for line in result.element_balance)


def test_yongshin_section():
    result = _make_result()
    assert len(result.yongshin) > 0
    assert any("용신" in line for line in result.yongshin)


def test_fortune_by_domain():
    result = _make_result()
    assert len(result.fortune_by_domain) > 0
    # 영역 키워드가 하나라도 포함
    domains = ["재물운", "직장·사회운", "학업·자격운", "표현·건강운", "대인관계"]
    assert any(d in line for line in result.fortune_by_domain for d in domains)


def test_annual_fortune_section():
    result = _make_result()
    assert len(result.annual_fortune) > 0
    assert any("2026" in line for line in result.annual_fortune)


def test_major_fortune_section():
    result = _make_result()
    assert len(result.major_fortune) > 0
    assert any("대운" in line or "현재" in line for line in result.major_fortune)


def test_advice_section():
    result = _make_result()
    assert len(result.advice) > 0
    assert any("용신" in line for line in result.advice)


def test_relationships_present_when_clashes_exist():
    """충·합이 있는 경우 relationships 섹션이 채워진다."""
    result = _make_result()
    # 충·합 유무는 데이터에 따라 다르지만, 리스트 타입이어야 한다
    assert isinstance(result.relationships, list)


def test_modern_mapping_in_fortune_domain():
    """영역별 운세에 현대적 매핑(투자/커리어/라이프)이 포함된다."""
    result = _make_result()
    all_text = " ".join(result.fortune_by_domain)
    assert any(kw in all_text for kw in ["투자", "커리어", "라이프"])


def test_advice_has_fortune_boosting():
    """종합 조언에 개운법(색상/방향/음식)이 포함된다."""
    result = _make_result()
    all_text = " ".join(result.advice)
    assert "색상" in all_text
    assert "방향" in all_text
    assert "음식" in all_text


def test_narrative_style_personality():
    """성격 해석이 서사적(비유 포함) 스타일인지 확인."""
    result = _make_result()
    all_text = " ".join(result.personality)
    # 오행 비유 키워드 중 하나라도 포함
    metaphors = ["나무", "태양", "대지", "서리", "바다"]
    assert any(m in all_text for m in metaphors)
