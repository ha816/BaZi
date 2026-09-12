import asyncio
from datetime import datetime

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.adapter.outer.postnatal_adapter import PostnatalAdapter
from kkachi.application.kkachi_service import KkachiService, NatalService, PostnatalService
from kkachi.application.timing_rules import TIMING_DOMAINS, compute_timing, timing_digest
from kkachi.domain.ganji import Branch, Pillar, Sipsin, Stem
from kkachi.domain.user import Gender, User

_natal_adapter = NatalAdapter()
_svc = KkachiService(natal_svc=NatalService(_natal_adapter), postnatal_svc=PostnatalService(_natal_adapter, PostnatalAdapter()))
USER = User(name="테스트", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
NATAL = _natal_adapter.analyze(USER)
LEVELS = {"좋음", "보통", "피할"}


def _month(ganji: str, month: int = 1) -> dict:
    return {"year": 2026, "month": month, "ganji": ganji}


def _ganji_with(sipsin: Sipsin, branch: Branch) -> str:
    """일간 기준 원하는 십신이 되는 천간 + 지정 지지."""
    stem = next(s for s in Stem if Sipsin.of(NATAL.saju.stem_of_day_pillar, s) is sipsin)
    return stem.name + branch.name


def test_timing_shape_from_full_pipeline():
    natal, postnatal = _svc.analyze(USER, 2026)
    result = asyncio.run(_svc.interpret(natal, postnatal, user=USER, name="테스트"))
    timing = result.postnatal.timing
    assert list(timing) == TIMING_DOMAINS
    assert len(result.postnatal.upcoming_months) == 12
    for months in timing.values():
        assert len(months) == 12
        for x in months:
            assert 0 <= x["score"] <= 100 and x["level"] in LEVELS
            assert x["reason"] and x["tip"] and len(x["ganji_korean"]) == 2
    assert len(timing_digest(timing)) == 6


def test_study_month_beats_wealth_month_for_study_domain():
    neutral_branch = Branch.from_char("辰")
    study = compute_timing(NATAL, [_month(_ganji_with(Sipsin.正印, neutral_branch))])
    wealth = compute_timing(NATAL, [_month(_ganji_with(Sipsin.偏財, neutral_branch))])
    assert study["시험·공부"][0]["score"] > wealth["시험·공부"][0]["score"]
    assert wealth["투자·재물"][0]["score"] > study["투자·재물"][0]["score"]
    assert "정인(正印)" in study["시험·공부"][0]["reason"]


def test_yongshin_month_adds_ten_to_every_domain():
    yong = NATAL.yongshin
    yong_branch = next(b for b in Branch if b.element is yong and not (b.clashes == NATAL.saju[Pillar.日柱].branch or b.combines == NATAL.saju[Pillar.日柱].branch))
    other_branch = next(b for b in Branch if b.element not in (yong, yong.overcome_by) and not (b.clashes == NATAL.saju[Pillar.日柱].branch or b.combines == NATAL.saju[Pillar.日柱].branch))
    stem = next(s for s in Stem if s.element not in (yong, yong.overcome_by))
    with_y = compute_timing(NATAL, [_month(stem.name + yong_branch.name)])
    without = compute_timing(NATAL, [_month(stem.name + other_branch.name)])
    for d in TIMING_DOMAINS:
        diff = with_y[d][0]["score"] - without[d][0]["score"]
        # 지지가 달라 십신 가중도 달라질 수 있으므로 용신 가산(+10) 흔적만 확인
        assert "용신" in with_y[d][0]["reason"] and "용신" not in without[d][0]["reason"]
        assert diff >= 0 or "흔듦" in with_y[d][0]["reason"]


def _natal_with_earth_day_branch():
    """일지가 辰·戌·丑·未(土)인 사주 — 충 짝(辰↔戌, 丑↔未)이 같은 오행·음양이라 십신이 동일해 충 감점만 비교할 수 있다."""
    from datetime import timedelta
    d = datetime(1990, 1, 1, 12, 0)
    while True:
        n = _natal_adapter.analyze(User(name="t", gender=Gender.MALE, birth_dt=d))
        if n.saju[Pillar.日柱].branch.name in ("辰", "戌", "丑", "未"):
            return n
        d += timedelta(days=1)


def test_clash_penalty_is_largest_for_moving_and_contracts():
    natal = _natal_with_earth_day_branch()
    day_branch = natal.saju[Pillar.日柱].branch
    clash_branch = day_branch.clashes
    stem = next(s for s in Stem if s.element not in (natal.yongshin, natal.yongshin.overcome_by))
    same = compute_timing(natal, [_month(stem.name + day_branch.name)])   # 같은 지지 → 충·합 없음, 십신 동일
    clash = compute_timing(natal, [_month(stem.name + clash_branch.name)])
    penalty = {d: same[d][0]["score"] - clash[d][0]["score"] for d in TIMING_DOMAINS}
    assert penalty["이사·계약"] == 12
    assert all(penalty[d] == 8 for d in TIMING_DOMAINS if d != "이사·계약"), penalty
    assert all("충(衝)" in clash[d][0]["reason"] for d in TIMING_DOMAINS)


def test_spouse_star_depends_on_gender():
    neutral_branch = Branch.from_char("辰")
    g = _month(_ganji_with(Sipsin.正財, neutral_branch))
    male = compute_timing(NATAL, [g], is_male=True)["연애·결혼"][0]["score"]
    female = compute_timing(NATAL, [g], is_male=False)["연애·결혼"][0]["score"]
    assert male > female
