from datetime import UTC, datetime, timedelta

import ephem

from kkachi.adapter.outer.astro_adapter import AstroAdapter
from kkachi.application.horoscope_rules import SIGNS, sign_of

ASTRO = AstroAdapter()


def _diff(a: float, b: float) -> float:
    """황경 차를 −180~180으로."""
    return (a - b + 180) % 360 - 180


def _sun_event(day: str, rising: bool) -> datetime:
    obs = ephem.Observer()
    obs.lat, obs.lon, obs.pressure, obs.horizon = "37.566", "126.978", 0, "0"
    obs.date = ephem.Date(day)
    ev = obs.next_rising(ephem.Sun(), use_center=True) if rising else obs.next_setting(ephem.Sun(), use_center=True)
    return ev.datetime().replace(tzinfo=UTC)


def test_sun_j2000_is_capricorn():
    sun = ASTRO.positions(datetime(2000, 1, 1, 12, tzinfo=UTC))["sun"]
    assert 279.5 < sun < 281.5 and sign_of(sun) == "capricorn"  # 겉보기 황경 ≈280.4°


def test_sun_at_2026_vernal_equinox_is_near_zero():
    sun = ASTRO.positions(datetime(2026, 3, 20, 14, 46, tzinfo=UTC))["sun"]
    assert min(sun, 360 - sun) < 0.1  # Ecliptic(epoch=날짜)를 빠뜨리면 J2000 분점 기준이라 0.36° 어긋난다


def test_moon_meeus_47a_is_leo():
    moon = ASTRO.positions(datetime(1992, 4, 11, 23, 59, 2, tzinfo=UTC))["moon"]  # 1992-04-12 0h TD, 133.167°
    assert abs(moon - 133.167) < 0.1 and sign_of(moon) == "leo"


def test_asc_equals_sun_at_sunrise_and_opposite_at_sunset():
    for day in ("2026/3/20", "2026/6/21"):
        rise = ASTRO.positions(_sun_event(day, True), "서울")
        sunset = ASTRO.positions(_sun_event(day, False), "서울")
        assert abs(_diff(rise["asc"], rise["sun"])) < 1
        assert abs(_diff(sunset["asc"], sunset["sun"] + 180)) < 1


def test_asc_sweeps_all_12_signs_monotonically_in_a_day():
    base = datetime(2026, 10, 30, tzinfo=UTC)
    ascs = [ASTRO.positions(base + timedelta(minutes=10 * i), "seoul")["asc"] for i in range(144)]
    assert all(0 < (b - a) % 360 < 30 for a, b in zip(ascs, ascs[1:]))
    assert {sign_of(a) for a in ascs} == {s["key"] for s in SIGNS}


def test_city_fallback_and_no_city_no_asc():
    at = datetime(2026, 10, 30, 3, tzinfo=UTC)
    assert ASTRO.positions(at, "atlantis") == ASTRO.positions(at, "서울")
    assert "asc" not in ASTRO.positions(at)
    assert ASTRO.positions(at, "부산")["asc"] != ASTRO.positions(at, "서울")["asc"]
    assert all(isinstance(v, float) and 0 <= v < 360 for v in ASTRO.positions(at, "seoul").values())
