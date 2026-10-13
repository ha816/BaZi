from kkachi.application.self_quiz import build_self_quiz


def _natal(*names: str) -> dict:
    return {"sipsin": [{"char": "x", "sipsin_name": n, "domain": ""} for n in names]}


def test_ten_questions_predict_by_count():
    q = build_self_quiz(_natal("食神", "食神", "偏印", "比肩"))
    assert len(q) == 10 and [x["basis"] for x in q][:3] == ["比肩", "劫財", "食神"]
    by = {x["basis"]: x for x in q}
    assert by["食神"]["predict"] == "yes" and by["食神"]["count"] == 2
    assert by["比肩"]["predict"] == "yes" and by["比肩"]["reason"].endswith("있는 편이라 '그렇다'로 예측했어요")
    assert by["正官"]["predict"] == "no" and by["正官"]["reason"].endswith("'아니다'로 예측했어요")
    assert {x["predict"] for x in q} == {"yes", "no"}
    assert by["食神"]["reason"] == "사주에 식신(食神)이 2개 — 먹고 즐기는 여유가 뚜렷한 편이라 '그렇다'로 예측했어요"
    assert by["劫財"]["reason"].startswith("사주에 겁재(劫財)가 없어요 — 승부욕과 경쟁심이 약한 편")


def test_no_sipsin_returns_empty():
    assert build_self_quiz({}) == []
