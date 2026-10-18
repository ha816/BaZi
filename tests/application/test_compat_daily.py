from datetime import date, datetime

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.application.compatibility_daily import compute_daily_compat
from kkachi.domain.user import Gender, User


def _natal(y: int, m: int, d: int, h: int, mi: int, gender: Gender):
    return NatalAdapter().analyze(User(name="", gender=gender, birth_dt=datetime(y, m, d, h, mi)))


_N1 = _natal(1990, 10, 10, 14, 30, Gender.MALE)
_N2 = _natal(1993, 7, 7, 10, 0, Gender.FEMALE)


def test_daily_compat_keeps_badge_fields_and_adds_persons_domains_tips():
    """홈 배지가 쓰는 date·day_pillar·score·level·headline은 그대로, 2026-10-18 보강 필드가 붙는다"""
    r = compute_daily_compat(_N1, _N2, date(2026, 10, 18), "승민", "하늘")
    assert 0 <= r["score"] <= 100 and r["level"] in ("좋음", "보통", "주의") and r["headline"] and len(r["day_pillar"]) == 2
    assert r["day_element"] in "木火土金水" and isinstance(r["son_eomneun_nal"], bool)
    assert [p["name"] for p in r["persons"]] == ["승민", "하늘"]
    for p in r["persons"]:
        assert p["relation"] in ("육합", "삼합", "같음", "보통", "충") and p["relation_label"]
        assert 0 <= p["score"] <= 100 and p["level"] in ("좋은 날", "평범한 날", "주의가 필요한 날")
        assert p["headline"].startswith(f"{p['name']}님") and p["yongshin"] in "木火土金水"
    assert [d["key"] for d in r["domains"]] == ["재물", "연애", "직업", "건강"]
    for d in r["domains"]:
        low = min(d["score1"], d["score2"])
        assert d["level"] == ("좋음" if low >= 70 else "보통" if low >= 40 else "주의") and d["label"]
    assert 1 <= len(r["tips"]) <= 3


def test_daily_compat_unnamed_people_get_fallback_names():
    r = compute_daily_compat(_N1, _N2, date(2026, 10, 18), "", "")
    assert [p["name"] for p in r["persons"]] == ["첫째 분", "둘째 분"]
    assert not r["persons"][0]["headline"].startswith("첫째 분님")  # 아침 한 마디 접두는 실제 이름일 때만
