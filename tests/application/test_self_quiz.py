from kkachi.application.self_quiz import build_self_quiz


def _h(stem: str, name: str, weight: int) -> dict:
    return {"stem": stem, "sipsin_name": name, "weight": weight}


# 庚午 丙戌 戊申 己未 (일간 戊) — 실제 분석 결과와 같은 모양
_NATAL = {
    "pillars": ["庚午", "丙戌", "戊申", "己未"],
    "sipsin": [
        {"char": "庚", "sipsin_name": "食神"}, {"char": "午", "sipsin_name": "偏印"},
        {"char": "丙", "sipsin_name": "偏印"}, {"char": "戌", "sipsin_name": "比肩"},
        {"char": "申", "sipsin_name": "食神"},
        {"char": "己", "sipsin_name": "劫財"}, {"char": "未", "sipsin_name": "劫財"},
    ],
    "jizan_gan": [
        [_h("丙", "偏印", 33), _h("己", "劫財", 30), _h("丁", "正印", 37)],
        [_h("辛", "傷官", 30), _h("丁", "正印", 10), _h("戊", "比肩", 60)],
        [_h("戊", "比肩", 23), _h("壬", "偏財", 23), _h("庚", "食神", 54)],
        [_h("丁", "正印", 30), _h("乙", "正官", 10), _h("己", "劫財", 60)],
    ],
}


def test_score_combines_stems_jizan_and_touchul():
    by = {x["basis"]: x for x in build_self_quiz(_NATAL)}
    assert [x["basis"] for x in build_self_quiz(_NATAL)][:3] == ["比肩", "劫財", "食神"]
    # 食神: 년간 8 + 일지 지장간 庚 54%×15 + 투출(庚이 申 속에도) 5
    assert by["食神"]["score"] == 21.1 and by["食神"]["predict"] == "yes"
    assert by["食神"]["reason"] == "태어난 해 천간에 드러나고 지지에도 뿌리를 둔 식신(食神) 기운 — 먹고 즐기는 여유가 뚜렷한 편이에요"
    # 比肩: 천간엔 없고 월지 본기 60%×30 + 일지 23%×15 → 크게 자리함
    assert by["比肩"]["score"] == 21.4 and by["比肩"]["reason"].startswith("태어난 달 지지 속에 자리한 비견(比肩) 기운이 커서")
    # 傷官: 월지 여기 30%×30 = 9 → 기준(8) 넘음
    assert by["傷官"]["predict"] == "yes" and by["傷官"]["reason"].endswith("드러나는 편이에요")
    # 偏財: 일지 중기만 23%×15 = 3.45 → 아니다, 숨어 있을 뿐
    assert by["偏財"]["predict"] == "no" and "태어난 날 지지 속에 조금 숨어 있을 뿐이라" in by["偏財"]["reason"]
    assert by["偏官"]["score"] == 0 and by["偏官"]["reason"].startswith("편관(偏官) 기운이 사주에 드러나지 않아")
    assert sum(x["predict"] == "yes" for x in by.values()) == 6
    assert all("개" not in x["reason"] and "예측" not in x["reason"] for x in by.values())  # 개수 규칙을 드러내지 않는다


def test_three_pillars_without_hour():
    natal = {
        "pillars": _NATAL["pillars"][:3],
        "sipsin": _NATAL["sipsin"][:5],
        "jizan_gan": _NATAL["jizan_gan"][:3],
    }
    by = {x["basis"]: x for x in build_self_quiz(natal)}
    assert by["正官"]["score"] == 0  # 시지 未의 乙이 빠짐
    assert by["劫財"]["score"] == 2.4  # 시간 己·시지 未가 빠지고 년지 午 속 己만 (천간에 없으니 투출도 없음)


def test_old_result_without_jizan_uses_branch_main_stem():
    natal = {"pillars": _NATAL["pillars"], "sipsin": _NATAL["sipsin"]}
    by = {x["basis"]: x for x in build_self_quiz(natal)}
    assert by["比肩"]["score"] == 30 and by["比肩"]["reason"].startswith("태어난 달 지지에 자리한")


def test_no_sipsin_returns_empty():
    assert build_self_quiz({}) == []
