from kkachi.application.compatibility_character import build_compat_character


def _result(ds1: str, ds2: str, kinds=(), **snap) -> dict:
    s1 = {"day_stem": ds1, "strength_label": "신강(身強)", "strength_pct": 73.4, "element_stats": {"木": 0, "火": 2, "土": 4, "金": 2, "水": 0}}
    s2 = {"day_stem": ds2, "strength_label": "신약(身弱)", "strength_pct": 38.5, "element_stats": {"木": 1, "火": 0, "土": 2, "金": 2, "水": 3}}
    s1.update(snap.get("s1", {}))
    s2.update(snap.get("s2", {}))
    return {"pillar1_snapshot": s1, "pillar2_snapshot": s2,
            "pillar_relations": [{"pillar1": "일주", "kind": k} for k in kinds],
            "shared_sinsal": [], "unique_sinsal_1": [], "unique_sinsal_2": ["역마살"]}


def test_title_metaphor_follows_p1_order_and_relation_suffix():
    c = build_compat_character(_result("戊", "庚"), "lover")  # 土生金 → 광산·보석
    assert c["title"] == "광산과 보석 커플" and c["kind"] == "generate" and c["key"] == "土金"
    assert c["desc"].startswith("{p1}님이 {p2}님을 아낌없이 키워주는")
    rev = build_compat_character(_result("庚", "戊"), "friend")  # p1 金, p2 土 → 보석과 광산, 주는 쪽은 p2
    assert rev["title"] == "보석과 광산 콤비" and rev["desc"].startswith("{p2}님이 판을 깔아주고")
    assert rev["key"] == "土金"  # 그림은 주는 쪽(土) 먼저 — p1이 받는 쪽이어도 같은 그림


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
    assert by_q["싸우면 누가 먼저 사과할까?"]["reason"].startswith("기운 38.5%의 신약(身弱)로 일간 기운이 더 여려")
    both_strong = build_compat_character(_result("戊", "庚", s2={"strength_label": "신강(身強)", "strength_pct": 55.0}), "lover")["scenarios"]
    assert both_strong[0]["reason"].startswith("기운 55%의 신강(身強)로 일간 기운이 더 여려")  # 라벨이 아니라 기운 세기 비교
    assert by_q["데이트 코스는 누가 정할까?"]["who"] == "p1"  # 신강 쪽
    assert by_q["\"우리 여행 갈까?\" 먼저 꺼내는 쪽은?"]["who"] == "p2"  # 역마살
    assert build_compat_character({"pillar1_snapshot": None, "pillar2_snapshot": None}) is None


def test_sipsin_union_drives_questions_and_fill_to_minimum():
    r = _result("戊", "庚",
                s1={"sipsin": {"食神": 2, "正財": 1, "偏官": 1}},
                s2={"sipsin": {"食神": 1, "正印": 2, "比肩": 1}})
    sc = build_compat_character(r, "lover")["scenarios"]
    bases = [s["basis"] for s in sc]
    assert bases[:5] == ["比肩", "食神", "正財", "偏官", "正印"]  # 합집합, 십신 순서
    food = next(s for s in sc if s["basis"] == "食神")
    assert food["who"] == "p1" and food["reason"].startswith("식신(食神)이 2개(상대 1개)")
    assert next(s for s in sc if s["basis"] == "正印")["who"] == "p2"
    assert food["reason"].endswith("먹고 즐기는 여유가 더 강한 쪽")  # 받침 없는 말 뒤 '가'
    assert len(sc) == 6 and sc[5]["basis"] == "lead"  # 5개뿐이라 강약 질문으로 채움


def test_sipsin_question_text_depends_on_relation_and_cap():
    many = {k: 1 for k in ["比肩", "劫財", "食神", "傷官", "偏財", "正財", "偏官", "正官", "偏印", "正印"]}
    r = _result("戊", "庚", s1={"sipsin": many}, s2={"sipsin": {"食神": 3}})
    lover = build_compat_character(r, "lover")["scenarios"]
    family = build_compat_character(r, "family")["scenarios"]
    assert len(lover) == 10  # 최대 10
    assert lover[2]["q"] == "데이트 맛집 찾기를 맡는 쪽은?" and family[2]["q"] == "주말에 맛있는 걸 해 먹자고 하는 쪽은?"
    assert lover[2]["who"] == "p2"  # 食神 1 vs 3
    assert lover[1]["reason"].startswith("겁재(劫財)가 1개")


def test_old_cache_without_sipsin_keeps_fixed_six():
    sc = build_compat_character(_result("戊", "庚"), "lover")["scenarios"]
    assert len(sc) == 6 and sc[0]["q"] == "싸우면 누가 먼저 사과할까?"
