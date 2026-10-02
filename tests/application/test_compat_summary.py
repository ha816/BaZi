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
    assert set(s) == {"pillars", "element", "sinsal", "domain"}
    assert all(v.endswith(".") for v in s.values())
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
