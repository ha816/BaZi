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


def test_chunghap_samhap_trio_yukhap_element_and_friends():
    c = build_compat_zodiac(_result("庚午", "壬寅"), 2026)["chunghap"]  # 午·寅 → 寅午戌 火국, 세 번째 戌(개)
    assert c["trio"]["third"]["korean"] == "개" and c["trio"]["element"] == "火"
    assert c["title"].startswith("午寅 반합")
    assert [r["branch"] for r in c["ring"]][:3] == ["子", "丑", "寅"] and len(c["ring"]) == 12
    assert {"branch": "戌", "korean": "개", "emoji": "🐶"} in c["friends"]  # 戌은 午·寅 모두와 삼합
    y = build_compat_zodiac(_result("甲子", "乙丑"), 2026)["chunghap"]  # 子丑 육합 → 土
    assert y["relation"] == "육합" and "흙(土) 기운" in y["title"] and y["trio"] is None


def test_pillar_zodiac_columns_cross_and_hour_unknown():
    pz = build_compat_zodiac(_result("庚午", "壬申"), 2026)["pillars"]
    # p1 午戌申未 / p2 申寅辰申
    assert [c["label"] for c in pz["columns"]] == ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"]
    assert pz["columns"][1]["relation"] == "삼합"  # 戌·寅 → 寅午戌
    assert pz["cross"][0]["relation"] == "삼합"  # 합 먼저 정렬
    assert "16쌍 중" in pz["tip"]
    three = build_compat_zodiac({"pillar1_snapshot": {"pillars": ["庚午", "丙戌", "戊申"]},
                                 "pillar2_snapshot": {"pillars": ["壬申", "壬寅", "庚辰", "壬申"]}}, 2026)["pillars"]
    assert three["columns"][3]["p1"] is None and three["columns"][3]["relation"] == ""
    assert "12쌍 중" in three["tip"]
