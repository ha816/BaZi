from kkachi.application.compatibility_zodiac import build_compat_zodiac, zodiac_summary_line


def _result(y1: str, y2: str) -> dict:
    return {"pillar1_snapshot": {"pillars": [y1, "丙戌", "戊申", "己未"]}, "pillar2_snapshot": {"pillars": [y2, "壬寅", "庚辰", "壬申"]}}


def test_pair_relation_and_years_shape():
    z = build_compat_zodiac(_result("庚午", "壬申"), 2026)  # 말띠·원숭이띠 → 보통
    assert z["p1"]["korean"] == "말" and z["p2"]["korean"] == "원숭이"
    assert z["relation"] == "보통"
    assert [r["year"] for r in z["years"]] == [2026, 2027, 2028, 2029]
    assert z["years"][0]["rel1"] == "나"  # 2026 丙午 = 말띠 본명년
    assert z["headline"].startswith("{p1}님 말띠와 {p2}님 원숭이띠는 보통")


def test_samhap_and_same_zodiac():
    assert build_compat_zodiac(_result("庚午", "壬寅"), 2026)["relation"] == "삼합"  # 寅午戌
    same = build_compat_zodiac(_result("庚午", "戊午"), 2026)
    assert same["relation_label"] == "같은 띠" and same["headline"].startswith("두 분 모두 말띠")


def test_years_line_mentions_clash_and_missing_snapshot():
    z = build_compat_zodiac(_result("甲子", "丙子"), 2026)  # 쥐띠 둘, 2026 午 = 둘 다 충
    assert "2026년은 두 분 모두에게 충이 드는 해" in z["years_line"]
    assert build_compat_zodiac({"pillar1_snapshot": None, "pillar2_snapshot": None}, 2026) is None
    assert zodiac_summary_line(_result("庚午", "壬寅")) == "{p1}님 말띠와 {p2}님 호랑이띠는 삼합(三合) — 띠끼리 가장 잘 맞아요."
