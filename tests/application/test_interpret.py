import asyncio
from datetime import datetime

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.adapter.outer.postnatal_adapter import PostnatalAdapter
from kkachi.application.kkachi_service import KkachiService, NatalService, PostnatalService
from kkachi.domain.interpretation import (
    Interpretation,
    InterpretBlock,
    NatalResult,
    PostnatalResult,
)
from kkachi.domain.user import Gender, User

_natal_adapter = NatalAdapter()
_postnatal_adapter = PostnatalAdapter()
_natal_svc = NatalService(natal_port=_natal_adapter)
_postnatal_svc = PostnatalService(natal_port=_natal_adapter, postnatal_port=_postnatal_adapter)
_service = KkachiService(natal_svc=_natal_svc, postnatal_svc=_postnatal_svc)


def _make_result(year: int = 2026) -> Interpretation:
    user = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    natal, postnatal = _service.analyze(user, year)
    return asyncio.run(_service.interpret(natal, postnatal))


def _make_natal_result(year: int = 2026) -> NatalResult:
    return _make_result(year).natal


def _make_postnatal_result(year: int = 2026) -> PostnatalResult:
    return _make_result(year).postnatal



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
    domains = ["재물운", "관록운", "학문운", "재능운", "인연운"]
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


def test_annual_fortune_has_multiple_blocks():
    """SeunInterpreter가 2개 이상의 블록을 생성하는지 검증."""
    result = _make_postnatal_result()
    assert len(result.annual_fortune) >= 2


def test_relationships_always_has_content():
    """충·합 여부와 무관하게 relationships에 내용이 있어야 함."""
    result = _make_postnatal_result()
    assert len(result.relationships) > 0
    text = _block_text(result.relationships)
    assert len(text) > 20


def test_summary_has_five_lines_in_card_tone():
    post = _make_postnatal_result()
    sm = post.summary
    assert sm is not None
    for field in ("me", "year", "month", "today", "caution", "today_date"):
        assert getattr(sm, field), f"summary.{field} 비어 있음"
    assert sm.me.startswith("이 사주는 ")  # name 없이 호출
    assert "습니다" not in sm.me
    assert "올해 2026년" in sm.year and "해예요" in sm.year
    assert sm.month.startswith("이번 달 ") and "월 " in sm.month
    assert not sm.today.startswith("님")
    assert all(len(getattr(sm, f)) <= 160 for f in ("me", "year", "month", "today", "caution"))


def test_summary_uses_name_when_given():
    user = User(name="승민", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
    natal, postnatal = _service.analyze(user, 2026)
    result = asyncio.run(_service.interpret(natal, postnatal, user=user, name="승민"))
    sm = result.postnatal.summary
    assert sm.me.startswith("승민님은 ")
    assert "승민님, " not in sm.today
    refreshed = _service.today_summary(natal, postnatal, "승민")
    assert refreshed["today"] == sm.today and refreshed["today_date"] == sm.today_date
