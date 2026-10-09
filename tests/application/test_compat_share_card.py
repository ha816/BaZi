from kkachi.application.compatibility_service import build_compat_share_card

_RESULT = {
    "total_score": 78, "label": "잘 맞는 사이", "description": "서로 보완해요.",
    "domain_scores": {"연애": {"score": 80, "level": "high", "reason": "r"}, "재물": {"score": 60, "level": "medium", "reason": "r"}},
    "key_traits": ["a", "b", "c", "d"], "shared_sinsal": ["도화"],
    "pillar1_snapshot": {"pillars": ["甲子"], "day_stem": "甲", "my_main_element": "木", "element_stats": {}},
    "pillar2_snapshot": {"pillars": ["丙午"], "day_stem": "丙", "my_main_element": "火", "element_stats": {}},
    "pillar_relations": [], "narrative": "긴 글",
}


def test_compat_share_card_keeps_scores_and_drops_details():
    card = build_compat_share_card("승민", "하늘", "friend", _RESULT)
    assert card["kind"] == "compat" and card["relation_label"] == "친구"
    assert card["total_score"] == 78 and card["domain_scores"]["연애"] == {"score": 80, "level": "high"}
    assert card["key_traits"] == ["a", "b", "c"]
    assert card["p1"] == {"stem": "甲", "korean": "갑", "element": "木", "hour_unknown": False} and card["p2"]["korean"] == "병"
    assert not {"narrative", "pillar_relations", "pillar1_snapshot", "birth_dt"} & set(card)


def test_compat_share_card_carries_character_with_names_filled():
    result = {
        **_RESULT,
        "character": {
            "title": "끌리는 장작과 모닥불 커플", "kind": "generate", "key": "木火",
            "roles": [{"token": "{p1}", "name": "장작", "element": "木", "emoji": "🌳"},
                      {"token": "{p2}", "name": "모닥불", "element": "火", "emoji": "🔥"}],
            "desc": "{p1}님이 {p2}님을 아낌없이 키워주는 사랑이에요.",
            "scenarios": [{"q": "q", "who": "p1", "reason": "r"}],
        },
    }
    card = build_compat_share_card("승민", "", "lover", result)
    ch = card["character"]
    assert ch["title"] == "끌리는 장작과 모닥불 커플" and ch["key"] == "木火"
    assert ch["roles"] == [{"name": "장작", "element": "木", "emoji": "🌳"}, {"name": "모닥불", "element": "火", "emoji": "🔥"}]
    assert ch["desc"] == "승민님이 두 번째 분님을 아낌없이 키워주는 사랑이에요."  # 빈 이름은 '두 번째 분'
    assert "scenarios" not in ch and "token" not in ch["roles"][0]
    assert build_compat_share_card("a", "b", "lover", _RESULT)["character"] is None


def test_compat_share_card_day_stem_color_is_the_stems_own_element():
    # 丙(火) 일간인데 주오행이 土인 사람 — 타일 색은 일간 글자의 오행(火)이어야 한다
    result = {**_RESULT, "pillar2_snapshot": {"pillars": ["丙午"], "day_stem": "丙", "my_main_element": "土", "element_stats": {}, "hour_unknown": True}}
    assert build_compat_share_card("a", "b", "lover", result)["p2"] == {"stem": "丙", "korean": "병", "element": "火", "hour_unknown": True}
