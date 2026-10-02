from kkachi.application.compatibility_character import build_compat_character


def _result(ds1: str, ds2: str, kinds=(), **snap) -> dict:
    s1 = {"day_stem": ds1, "strength_label": "신강(身強)", "strength": 4, "element_stats": {"木": 0, "火": 2, "土": 4, "金": 2, "水": 0}}
    s2 = {"day_stem": ds2, "strength_label": "신약(身弱)", "strength": -2, "element_stats": {"木": 1, "火": 0, "土": 2, "金": 2, "水": 3}}
    s1.update(snap.get("s1", {}))
    s2.update(snap.get("s2", {}))
    return {"pillar1_snapshot": s1, "pillar2_snapshot": s2,
            "pillar_relations": [{"pillar1": "일주", "kind": k} for k in kinds],
            "shared_sinsal": [], "unique_sinsal_1": [], "unique_sinsal_2": ["역마살"]}


def test_title_metaphor_follows_p1_order_and_relation_suffix():
    c = build_compat_character(_result("戊", "庚"), "lover")  # 土生金 → 광산·보석
    assert c["title"] == "광산과 보석 커플" and c["kind"] == "generate"
    assert c["desc"].startswith("{p1}님이 {p2}님을 아낌없이 키워주는")
    rev = build_compat_character(_result("庚", "戊"), "friend")  # p1 金, p2 土 → 보석과 광산, 주는 쪽은 p2
    assert rev["title"] == "보석과 광산 콤비" and rev["desc"].startswith("{p2}님이 판을 깔아주고")


def test_mood_prefix_and_same_element_family():
    c = build_compat_character(_result("戊", "己", kinds=["branch_clash"]), "family")
    assert c["title"] == "투닥투닥 어깨를 맞댄 두 언덕 가족" and c["kind"] == "same"  # 가족은 '투닥투닥'
    good = build_compat_character(_result("甲", "丙", kinds=["stem_combine", "branch_clash"]), "lover")
    assert good["title"].startswith("끌리는 장작과 모닥불")  # 합이 충보다 먼저


def test_scenarios_differ_by_relation_and_use_strength_and_sinsal():
    lover = build_compat_character(_result("戊", "庚"), "lover")["scenarios"]
    friend = build_compat_character(_result("戊", "庚"), "friend")["scenarios"]
    assert len(lover) == 6 and lover[0]["q"] != friend[0]["q"]
    by_q = {s["q"]: s for s in lover}
    assert by_q["싸우면 누가 먼저 사과할까?"]["who"] == "p2"  # 신약 쪽
    assert by_q["싸우면 누가 먼저 사과할까?"]["reason"].startswith("신약(身弱) -2로 일간 기운이 더 여려")
    both_strong = build_compat_character(_result("戊", "庚", s2={"strength_label": "신강(身強)", "strength": 2}), "lover")["scenarios"]
    assert both_strong[0]["reason"].startswith("신강(身強) +2로 일간 기운이 더 여려")  # 라벨이 아니라 점수 비교
    assert by_q["데이트 코스는 누가 정할까?"]["who"] == "p1"  # 신강 쪽
    assert by_q["\"우리 여행 갈까?\" 먼저 꺼내는 쪽은?"]["who"] == "p2"  # 역마살
    assert build_compat_character({"pillar1_snapshot": None, "pillar2_snapshot": None}) is None
