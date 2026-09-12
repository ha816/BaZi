from kkachi.application.push_service import build_push_payload


def test_payload_strips_name_prefix_and_joins_lines():
    p = build_push_payload({
        "date": "2026-09-12",
        "headline": "승민님, 오늘은 용신 金(쇠) 기운이 그대로 들어오는 날이에요.",
        "action": "미뤄둔 시작이 있다면 오늘 첫걸음을 떼세요.",
        "caution": "이동·계약·다툼은 피하고, 약속은 한 번 더 확인하세요.",
    })
    assert p["title"].startswith("🐦 오늘은 용신")
    assert "승민님" not in p["title"]
    assert p["body"].splitlines() == ["✦ 미뤄둔 시작이 있다면 오늘 첫걸음을 떼세요.", "✕ 이동·계약·다툼은 피하고, 약속은 한 번 더 확인하세요."]
    assert p["url"] == "/siun?src=push"
    assert p["tag"] == "kkachi-daily-2026-09-12"


def test_payload_falls_back_without_brief():
    p = build_push_payload({"description": "오늘은 무난한 날입니다.", "level": "평범한 날", "total_score": 52})
    assert p["title"] == "🐦 오늘은 무난한 날입니다."
    assert p["body"] == "평범한 날 · 52점"
