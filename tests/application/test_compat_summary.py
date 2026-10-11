from kkachi.application.compatibility_summary import build_compat_summary


def _result(**over) -> dict:
    base = {
        "pillar_relations": [],
        "samhap_completions": [],
        "element_complement": {"p1_lacks": [], "p1_provides": [], "p2_lacks": [], "p2_provides": [], "overlap_strong": [], "score": 0},
        "shared_sinsal": [], "unique_sinsal_1": [], "unique_sinsal_2": [],
        "pillar1_snapshot": {"my_main_element": "土", "yongshin": "金"},
        "pillar2_snapshot": {"my_main_element": "木", "yongshin": "水"},
        "domain_scores": {
            "연애": {"score": 63, "display_name": "연애"},
            "결혼": {"score": 63, "display_name": "결혼"},
            "재물": {"score": 60, "display_name": "재물"},
            "직업": {"score": 43, "display_name": "직업"},
        },
    }
    base.update(over)
    return base


def test_summary_has_four_lines_with_name_tokens():
    s = build_compat_summary(_result(element_complement={
        "p1_lacks": ["水"], "p1_provides": [], "p2_lacks": [], "p2_provides": ["水"], "overlap_strong": [], "score": 3,
    }))
    assert set(s) == {"pillars", "element", "strength", "strength_p1", "strength_p2", "sinsal", "zodiac", "domain"}
    assert all(v.endswith(".") for v in s.values() if v)
    assert "{p2}님이 물(水) 기운으로 {p1}님의" in s["element"]


def test_day_pillar_combine_leads_and_samhap_appended():
    s = build_compat_summary(_result(
        pillar_relations=[
            {"pillar1": "일주", "kind": "branch_clash", "polarity": -1},
            {"pillar1": "일주", "kind": "stem_combine", "polarity": 1},
        ],
        samhap_completions=[{"element": "火", "branches": ["午", "寅", "戌"]}],
    ))
    assert s["pillars"].startswith("일간이 천간합")  # 합이 충보다 먼저
    assert "불(火)국 삼합" in s["pillars"]


def test_yongshin_match_beats_plain_complement_and_josa():
    s = build_compat_summary(_result(pillar2_snapshot={"my_main_element": "金", "yongshin": "水"}))
    assert "{p2}님의 주오행 쇠(金)가 {p1}님의 용신(用神)" in s["element"]


def test_domain_best_and_low_with_display_name():
    s = build_compat_summary(_result())
    assert s["domain"] == "연애·결혼 쪽이 63점으로 가장 잘 맞고, 직업은 43점으로 노력이 필요해요."


def test_sinsal_shared_josa_and_empty_state():
    s = build_compat_summary(_result(shared_sinsal=["천을귀인"], unique_sinsal_1=["역마살", "도화살"]))
    assert s["sinsal"].startswith("두 분 모두 천을귀인을 가져")
    assert "{p1}님만 역마살 등 2개" in s["sinsal"]
    assert "신살이 없어요" in build_compat_summary(_result())["sinsal"]


def test_strength_pair_lines():
    def line(l1, l2):
        return build_compat_summary(_result(
            pillar1_snapshot={"my_main_element": "土", "yongshin": "金", "strength_label": l1},
            pillar2_snapshot={"my_main_element": "木", "yongshin": "水", "strength_label": l2},
        ))["strength"]
    assert line("신약(身弱)", "신강(身強)").startswith("{p2}님은 신강(身強), {p1}님은 신약(身弱)")
    assert line("신강(身強)", "신강(身強)").startswith("두 분 모두 신강")
    assert line("중화(中和)", "신약(身弱)") == ""  # 옛 캐시의 중화 라벨은 조합 문장 없음
    assert line("", "") == ""  # 옛 스냅샷에 라벨이 없으면 빈 줄


def test_strength_person_story_with_score_and_yongshin():
    s = build_compat_summary(_result(
        pillar1_snapshot={"my_main_element": "土", "yongshin": "金", "strength_label": "신강(身強)", "strength_pct": 73.4},
        pillar2_snapshot={"my_main_element": "木", "yongshin": "水", "strength_label": "신약(身弱)"},
    ))
    assert s["strength_p1"].startswith("{p1}님은 기운 73.4%의 신강(身強)이에요. 타고난 에너지가 강하고")
    assert s["strength_p1"].endswith("넘치는 기운을 풀어주는 쇠(金)가 용신(用神)이에요.")
    assert s["strength_p2"].startswith("{p2}님은 신약(身弱)이에요.")  # 옛 캐시: 점수 없음
    assert "부족한 힘을 채워주는 물(水)이 용신" in s["strength_p2"]
