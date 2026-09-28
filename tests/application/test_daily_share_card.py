from kkachi.application.fortune_service import build_daily_share_card

_FORTUNE = {
    "date": "2026-09-28", "day_pillar": "丙午", "day_element": "火", "total_score": 82, "level": "좋은 날",
    "headline": "승민님, 오늘은 불의 기운이 용신과 만나는 날이에요", "action": "미뤄 둔 연락을 먼저 해 보세요", "caution": "",
    "tips": ["a", "b", "c"], "weather": {"condition": "맑음", "element": "火", "temperature": 21, "hours": [1, 2]},
    "solar_term": None, "son_eomneun_nal": True, "yongshin": "火", "description": "...", "domain_scores": {},
}


def test_daily_share_card_strips_name_and_adds_korean_reading():
    card = build_daily_share_card("승민", True, _FORTUNE)
    assert card["kind"] == "daily" and card["is_self"] is True
    assert card["day_pillar_korean"] == "병오"
    assert card["headline"] == "오늘은 불의 기운이 용신과 만나는 날이에요"
    assert card["tips"] == ["a", "b"] and card["weather"] == {"condition": "맑음", "element": "火", "temperature": 21}
    assert not {"description", "domain_scores", "hours", "birth_dt"} & set(card)
