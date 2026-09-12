from datetime import date, datetime, timedelta

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.application.fortune_rules import BRANCH_CLASHES, BRANCH_COMBINES, compute_fortune
from kkachi.domain.fortune import Fortune
from kkachi.domain.ganji import Oheng, Pillar
from kkachi.domain.user import Gender, User

USER = User(name="승민", gender=Gender.MALE, birth_dt=datetime(1990, 10, 10, 14, 30))
NATAL = NatalAdapter().analyze(USER)
LEVELS = {"좋은 날", "평범한 날", "주의가 필요한 날"}
START = date(2026, 1, 1)


def _first_day(pred, span: int = 90) -> date:
    for i in range(span):
        d = START + timedelta(days=i)
        if pred(compute_fortune(NATAL, d)):
            return d
    raise AssertionError("조건을 만족하는 날이 90일 안에 없음")


def _brief(f: Fortune) -> str:
    return f.headline + f.action + f.caution


def test_brief_present_named_and_short_every_day():
    for i in range(14):
        f = compute_fortune(NATAL, START + timedelta(days=i), name="승민")
        assert f.headline.startswith("승민님, "), f.headline
        assert f.action, f"action 비어 있음: {f.date}"
        assert len(f.headline) <= 70 and len(f.action) <= 70 and len(f.caution) <= 70
        assert f.action != f.caution


def test_brief_without_name_has_no_honorific_prefix():
    f = compute_fortune(NATAL, START)
    assert not f.headline.startswith("님")
    assert "님," not in f.headline[:4]


def test_yongshin_day_headline_mentions_yongshin():
    d = _first_day(lambda f: f.yongshin_in_il)
    f = compute_fortune(NATAL, d, name="승민")
    assert "용신" in f.headline
    assert "첫걸음" in f.action


def test_clash_day_has_caution():
    my_branch = NATAL.saju[Pillar.日柱].branch
    d = _first_day(lambda f: f.day_pillar[1] == BRANCH_CLASHES[my_branch].name)
    f = compute_fortune(NATAL, d, name="승민")
    assert f.caution, "충(衝) 날인데 caution 없음"
    assert "충" in _brief(f)


def test_combine_day_suggests_contact():
    my_branch = NATAL.saju[Pillar.日柱].branch
    # 흉 요인이 없고 용신 일치·생(生)도 아닌 육합 날 → 육합이 가장 큰 길 요인
    d = _first_day(
        lambda f: f.day_pillar[1] == BRANCH_COMBINES[my_branch].name
        and not f.caution
        and not f.yongshin_in_il
        and Oheng[f.day_element].generates != NATAL.yongshin,
        span=365,
    )
    f = compute_fortune(NATAL, d, name="승민")
    assert "육합" in f.headline or "연락" in f.action, _brief(f)


def test_score_bounds_and_level_every_day():
    for i in range(60):
        f = compute_fortune(NATAL, START + timedelta(days=i))
        assert 0 <= f.total_score <= 100
        assert f.level in LEVELS
        assert set(f.domain_scores) == {"재물", "연애", "직업", "건강"}
        for ds in f.domain_scores.values():
            assert 0 <= ds["score"] <= 100 and ds["reason"]


def test_weather_matching_yongshin_adds_ten_and_mentions_weather():
    # 다른 요인이 없는 잔잔한 날 → 날씨가 유일한 요인이라 헤드라인에 드러나야 함
    d = _first_day(lambda f: f.total_score == 50 and not f.caution and "잔잔한" in f.headline, span=180)
    base = compute_fortune(NATAL, d)
    weather = {"element": NATAL.yongshin.name, "condition": "맑음 21°C"}
    with_weather = compute_fortune(NATAL, d, weather)
    assert with_weather.total_score - base.total_score == 10
    assert "날씨" in _brief(with_weather)
    assert "°C" not in with_weather.headline


def test_solar_term_tip_is_first_and_name_param_does_not_leak():
    f = compute_fortune(NATAL, date(2026, 2, 4), name="승민")  # 입춘
    assert f.solar_term == "입춘(立春)"
    assert f.tips[0].startswith("오늘은 입춘(立春)입니다.")
    assert f.headline.startswith("승민님, ")
