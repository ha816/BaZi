import json
import re
from collections import Counter
from datetime import UTC, date, datetime, timedelta

from kkachi.application.horoscope_rules import (
    SIGNS,
    aspect,
    build_chart,
    build_my_horoscope,
    build_sky,
    compute_horoscope,
    moon_phase,
    sign_of,
)
from kkachi.domain.user import Gender, User

TODAY = date(2026, 10, 30)
HANJA = re.compile(r"[一-鿿]")
WANING = {"sun": "taurus", "moon": "leo", "moon_phase": "이지러지는 달"}  # 삭망 요인 없는 하늘


class FakeAstro:
    """고정 황경(기본: 태양 216.7 전갈·달 90.5 게·상승 100 게). by_time으로 UTC 시각별 달 황경을 달리 주고 호출을 기록."""

    def __init__(self, sun=216.7, moon=90.5, asc=100.0, by_time=None):
        self.sun, self.moon, self.asc, self.by_time = sun, moon, asc, by_time or {}
        self.calls: list[tuple[datetime, str | None]] = []

    def positions(self, at_utc, city=None):
        self.calls.append((at_utc, city))
        out = {"sun": self.sun, "moon": self.by_time.get(at_utc, self.moon)}
        if city is not None:
            out["asc"] = self.asc
        return out


def _user(birth: datetime, hour_unknown: bool = False, name: str = "승민") -> User:
    return User(name=name, gender=Gender.MALE, birth_dt=birth, city="Seoul", hour_unknown=hour_unknown)


def test_sign_of_boundaries():
    assert [sign_of(x) for x in (0, 29.999, 30, 359.9, 360)] == ["aries", "aries", "taurus", "pisces", "aries"]


def test_aspect_whole_sign():
    assert aspect("aries", "aries") == "합" and aspect("aries", "leo") == aspect("aries", "sagittarius") == "삼각"
    assert aspect("aries", "gemini") == aspect("aries", "aquarius") == "육각"
    assert aspect("aries", "cancer") == aspect("aries", "capricorn") == "사각" and aspect("aries", "libra") == "충"
    assert aspect("aries", "taurus") is aspect("aries", "virgo") is aspect("aries", "pisces") is None


def test_sky_has_12_signs_relation_distribution_and_no_hanja():
    sky = build_sky(FakeAstro(), TODAY)
    assert sky["sun"] == "scorpio" and sky["moon"] == "cancer" and sky["moon_phase"] == "이지러지는 달"
    assert [s["key"] for s in sky["signs"]] == [s["key"] for s in SIGNS]
    assert Counter(s["relation"] for s in sky["signs"]) == {"합": 1, "삼각": 2, "육각": 2, "사각": 2, "충": 1, "보통": 4}
    assert not HANJA.search(json.dumps(sky, ensure_ascii=False))
    for s in sky["signs"]:
        assert s["headline"].endswith("요.") and s["action"] and s["lucky_item"] and "님" not in s["headline"]
        assert s["level"] in {"좋은 날", "평범한 날", "주의가 필요한 날"}


def test_scores_and_levels_match_fortune_thresholds():
    h = compute_horoscope({"sun": "aries"}, WANING, TODAY)  # 달→태양 삼각 +12, 태양→태양 없음
    assert h["score"] == 62 and h["level"] == "평범한 날" and h["relation"] == "삼각"
    good = compute_horoscope({"sun": "aries"}, {**WANING, "sun": "sagittarius"}, TODAY)  # +태양 삼각 8
    assert good["score"] == 70 and good["level"] == "좋은 날"
    bad = compute_horoscope({"sun": "aries"}, {**WANING, "sun": "libra", "moon": "cancer"}, TODAY)  # 사각 −10 · 충 −6
    assert bad["score"] == 34 and bad["level"] == "주의가 필요한 날" and bad["caution"]


def test_headline_is_top_factor_negative_wins_tie_and_action_matches():
    h = compute_horoscope({"sun": "aries", "moon": "leo"}, {**WANING, "sun": "leo", "moon": "cancer"}, TODAY)  # −10 / +8 / +4
    assert h["headline"].startswith("달이 내 별자리와 엇갈려") and h["action"] == "오늘은 결정 대신 정리만 하세요."
    assert h["caution"] == "서두른 말과 충동 구매를 조심하세요."
    tie = compute_horoscope({"sun": "aries"}, {**WANING, "sun": "leo", "moon": "libra"}, TODAY)  # 충 −8 vs 삼각 +8 → 흉 우선
    assert tie["headline"].startswith("달이 내 별자리 맞은편") and tie["score"] == 50


def test_personal_chart_adds_moon_asc_factors_and_name_prefix():
    astro = FakeAstro()
    mine = build_my_horoscope(astro, _user(datetime(1990, 11, 5, 9)), TODAY)
    assert mine["chart"] == {"sun": "scorpio", "moon": "cancer", "asc": "cancer", "uncertain": []}
    assert mine["headline"].startswith("승민님, ") and mine["level"] == "좋은 날"
    generic = next(s for s in build_sky(astro, TODAY)["signs"] if s["key"] == "scorpio")
    assert mine["score"] > generic["score"] == 70 and not generic["headline"].startswith("승민")


def test_hour_unknown_has_no_asc_and_flags_bodies_that_change_sign_that_day():
    day0, day1 = datetime(1990, 5, 2, 15, tzinfo=UTC), datetime(1990, 5, 3, 15, tzinfo=UTC)  # KST 0시·24시
    astro = FakeAstro(sun=42.3, moon=32.0, by_time={day0: 29.0, day1: 35.0})
    chart = build_chart(astro, _user(datetime(1990, 5, 3, 12), hour_unknown=True))
    assert chart == {"sun": "taurus", "moon": "taurus", "asc": None, "uncertain": ["moon"]}
    assert all(city is None for _, city in astro.calls)
    known = build_chart(FakeAstro(sun=42.3, moon=32.0), _user(datetime(1990, 5, 3, 9)))
    assert known["asc"] == "cancer" and known["uncertain"] == []


def test_birth_kst_uses_historical_offsets():
    for birth, utc in (
        (datetime(1988, 7, 1, 12), datetime(1988, 7, 1, 2, tzinfo=UTC)),  # 서머타임 +10
        (datetime(1990, 7, 1, 12), datetime(1990, 7, 1, 3, tzinfo=UTC)),
        (datetime(1958, 1, 1, 12), datetime(1958, 1, 1, 3, 30, tzinfo=UTC)),  # +8:30
    ):
        astro = FakeAstro()
        build_chart(astro, _user(birth))
        assert astro.calls[0] == (utc, "Seoul")
    astro = FakeAstro()
    build_sky(astro, TODAY)
    assert astro.calls == [(datetime(2026, 10, 30, 3, tzinfo=UTC), None)]  # 오늘 정오 KST


def test_plain_text_and_lucky_item_rotate_daily():
    quiet = [next(s for s in build_sky(FakeAstro(), d)["signs"] if s["key"] == "sagittarius") for d in (TODAY, TODAY + timedelta(days=1))]
    assert all(s["relation"] == "보통" and s["score"] == 50 and not s["caution"] for s in quiet)
    assert quiet[0]["headline"] != quiet[1]["headline"] and quiet[0]["lucky_item"] != quiet[1]["lucky_item"]
    assert compute_horoscope({"sun": "sagittarius"}, WANING, TODAY, "승민")["headline"].startswith("승민님, ")


def test_new_and_full_moon_factor_and_phase_label():
    quiet = {"sun": "taurus", "moon": "virgo"}  # 양자리와 애스펙트 없음
    new = compute_horoscope({"sun": "aries"}, {**quiet, "moon_phase": "새달"}, TODAY)
    full = compute_horoscope({"sun": "aries"}, {**quiet, "moon_phase": "보름달"}, TODAY)
    assert new["score"] == 54 and new["headline"].startswith("새달")
    assert full["score"] == 47 and full["headline"].startswith("보름달") and full["caution"]
    assert [moon_phase(x) for x in (5, 95, 180, 355)] == ["새달", "상현달", "보름달", "새달"]
