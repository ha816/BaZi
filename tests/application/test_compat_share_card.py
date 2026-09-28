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
    assert card["p1"] == {"stem": "甲", "korean": "갑", "element": "木"} and card["p2"]["korean"] == "병"
    assert not {"narrative", "pillar_relations", "pillar1_snapshot", "birth_dt"} & set(card)
