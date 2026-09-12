import asyncio
from datetime import datetime

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.adapter.outer.postnatal_adapter import PostnatalAdapter
from kkachi.application.fortune_rules import compute_fortune
from kkachi.application.kkachi_service import KkachiService, NatalService, PostnatalService
from kkachi.application.report_builder import LlmReportBuilder
from kkachi.domain.ganji import Pillar
from kkachi.domain.user import Gender, User

_natal = NatalAdapter()
_post = PostnatalAdapter()
_svc = KkachiService(natal_svc=NatalService(_natal), postnatal_svc=PostnatalService(_natal, _post))

BIRTH = datetime(1990, 10, 10, 12, 0)
KNOWN = User(name="테스트", gender=Gender.MALE, birth_dt=BIRTH)
UNKNOWN = User(name="테스트", gender=Gender.MALE, birth_dt=BIRTH, hour_unknown=True)


def test_three_pillars_drop_hour_only():
    k, u = _natal.analyze(KNOWN), _natal.analyze(UNKNOWN)
    assert not k.saju.hour_unknown and u.saju.hour_unknown
    assert Pillar.時柱 not in u.saju.pillars and len(u.saju.pillars) == 3
    for p in (Pillar.年柱, Pillar.月柱, Pillar.日柱):
        assert str(k.saju[p]) == str(u.saju[p])
    assert len(u.saju.palja) == 6


def test_three_pillars_derived_counts():
    u = _natal.analyze(UNKNOWN)
    assert sum(u.element_stats.values()) == 6
    assert len(u.sipsin) == 5  # 년·월 천간 2 + 년·월·일 지지 3
    assert [p for p, _ in u.sibi_unseong] == ["년주", "월주", "일주"]
    assert len(u.jizan_gan) == 3 and len(u.sibi_sinsal) == 3 and len(u.gongmang) == 3
    assert u.strength_label in {"신강(身強)", "신약(身弱)", "중화(中和)"}


def test_interpretation_marks_hour_unknown_and_stays_consistent():
    natal, postnatal = _svc.analyze(UNKNOWN, 2026)
    result = asyncio.run(_svc.interpret(natal, postnatal, user=UNKNOWN, name="테스트"))
    n, p = result.natal, result.postnatal
    assert n.hour_unknown is True
    assert len(n.pillars) == 3 == len(n.pillar_elements) == len(n.sibi_unseong) == len(n.gongmang)
    assert len(n.zodiac.pillar_zodiacs) == 3
    for c in p.seun_clashes + p.seun_combines + p.daeun_clashes + p.daeun_combines:
        assert c["pillar"] in {"년주", "월주", "일주"}
    assert p.summary and p.summary.me
    report = LlmReportBuilder().build(n, p, UNKNOWN, "테스트")
    assert "세 기둥(三柱)" in report


def test_known_hour_unchanged_by_flag_default():
    natal, postnatal = _svc.analyze(KNOWN, 2026)
    result = asyncio.run(_svc.interpret(natal, postnatal, user=KNOWN))
    assert result.natal.hour_unknown is False and len(result.natal.pillars) == 4


def test_daily_fortune_works_without_hour():
    natal = _natal.analyze(UNKNOWN)
    f = compute_fortune(natal, datetime(2026, 9, 12).date(), name="테스트")
    assert f.headline.startswith("테스트님, ") and 0 <= f.total_score <= 100
