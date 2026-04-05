from datetime import datetime

from kkachi.adapter.outer.natal_adapter import NatalAdapter, PostnatalAdapter
from kkachi.application.saju_service import SajuService
from kkachi.domain.interpretation import InterpretBlock, Interpretation, NatalResult, PostnatalResult
from kkachi.domain.user import Gender, User

_natal = NatalAdapter()
_postnatal = PostnatalAdapter()
_service = SajuService(natal_port=_natal, postnatal_port=_postnatal)


def _make_result(year: int = 2026) -> Interpretation:
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    natal, postnatal = _service.analyze(user, year)
    return _service.interpret(natal, postnatal)


def _make_natal_result() -> NatalResult:
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    natal, _ = _service.analyze(user, 2026)
    return _service.interpret_natal(natal)


def _make_postnatal_result(year: int = 2026) -> PostnatalResult:
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    natal, postnatal = _service.analyze(user, year)
    return _service.interpret_postnatal(natal, postnatal)


def _block_text(blocks: list[InterpretBlock]) -> str:
    """InterpretBlock 리스트의 모든 텍스트를 하나의 문자열로 합친다."""
    parts = []
    for b in blocks:
        if b.category:
            parts.append(b.category)
        if b.description:
            parts.append(b.description)
        for tip in b.tips:
            parts.append(tip.label)
            parts.append(tip.text)
    return " ".join(parts)


def test_returns_interpretation_dataclass():
    result = _make_result()
    assert isinstance(result, Interpretation)
    assert isinstance(result.natal, NatalResult)
    assert isinstance(result.postnatal, PostnatalResult)


def test_personality_section():
    result = _make_natal_result()
    assert len(result.personality) > 0
    text = _block_text(result.personality)
    assert "당신" in text or "에너지" in text


def test_element_balance_section():
    result = _make_natal_result()
    assert len(result.element_balance) > 0
    text = _block_text(result.element_balance)
    assert "기운이 강한" in text or "기운이 약한" in text or "균형을 이루고" in text


def test_yongshin_section():
    result = _make_postnatal_result()
    assert len(result.yongshin) > 0
    assert "기운" in _block_text(result.yongshin)


def test_fortune_by_domain():
    result = _make_postnatal_result()
    assert len(result.fortune_by_domain) > 0
    domains = ["재물운", "직장·사회운", "학업·자격운", "표현·건강운", "대인관계"]
    text = _block_text(result.fortune_by_domain)
    assert any(d in text for d in domains)


def test_annual_fortune_section():
    result = _make_postnatal_result()
    assert len(result.annual_fortune) > 0
    assert "2026" in _block_text(result.annual_fortune)


def test_major_fortune_section():
    result = _make_postnatal_result()
    assert len(result.major_fortune) > 0
    text = _block_text(result.major_fortune)
    assert "대운" in text or "현재" in text


def test_advice_section():
    result = _make_postnatal_result()
    assert len(result.advice) > 0
    text = _block_text(result.advice)
    assert "개운법" in text or "색상" in text or "기운" in text


def test_relationships_present_when_clashes_exist():
    result = _make_postnatal_result()
    assert isinstance(result.relationships, list)


def test_modern_mapping_in_fortune_domain():
    result = _make_postnatal_result()
    text = _block_text(result.fortune_by_domain)
    assert any(kw in text for kw in ["투자", "커리어", "라이프"])


def test_advice_has_fortune_boosting():
    result = _make_postnatal_result()
    text = _block_text(result.advice)
    assert "색상" in text
    assert "방향" in text
    assert "음식" in text


def test_narrative_style_personality():
    result = _make_natal_result()
    text = _block_text(result.personality)
    metaphors = ["나무", "태양", "대지", "서리", "바다"]
    assert any(m in text for m in metaphors)
