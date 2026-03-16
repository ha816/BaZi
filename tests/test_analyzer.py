from saju.natal import NatalChart, get_sipsin


def test_analyze_with_pillars():
    """간지를 직접 넣어서 오행 분석하는 기본 케이스"""
    chart = NatalChart(["庚午", "丙戌", "己巳", "辛未"])

    assert chart.saju.my_main_element == "토"
    assert chart.saju.day_stem == "己"
    assert chart.saju.element_stats == {"목": 0, "화": 3, "토": 3, "금": 2, "수": 0}
    assert chart.saju.year_pillar == "庚午"
    assert chart.saju.day_pillar == "己巳"


def test_analyze_water_dominant():
    """수(水) 기운이 강한 사주 예시"""
    chart = NatalChart(["壬子", "壬子", "壬子", "壬子"])

    assert chart.saju.my_main_element == "수"
    assert chart.saju.element_stats == {"목": 0, "화": 0, "토": 0, "금": 0, "수": 8}


def test_from_birthday():
    """생년월일시로 사주를 자동 계산하는 케이스"""
    chart = NatalChart.from_birthday(1990, 10, 10, 14, 30, city="Seoul")

    assert len(chart.saju.year_pillar) == 2
    assert len(chart.saju.month_pillar) == 2
    assert len(chart.saju.day_pillar) == 2
    assert len(chart.saju.hour_pillar) == 2
    assert sum(chart.saju.element_stats.values()) == 8


def test_judge_strength_strong():
    """신강 판단"""
    chart = NatalChart(["己巳", "丙戌", "己巳", "己未"])
    assert chart.strength == 8


def test_judge_strength_weak():
    """신약 판단"""
    chart = NatalChart(["庚申", "庚申", "甲戌", "庚申"])
    assert chart.strength == -6


def test_find_yongshin_for_strong():
    """신강일 때 용신"""
    chart = NatalChart(["己巳", "丙戌", "己巳", "己未"])
    assert chart.yongshin == "금"


def test_find_yongshin_for_weak():
    """신약일 때 용신"""
    chart = NatalChart(["庚申", "庚申", "甲戌", "庚申"])
    assert chart.yongshin == "수"


def test_get_personality():
    """일간 오행 기반 성격 조회"""
    chart = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    assert chart.get_personality() == "신용을 중시하며 포용력이 있고 듬직합니다."


def test_get_sipsin():
    """일간 기준 십신 판별"""
    assert get_sipsin("庚", "己") == "상관"
    assert get_sipsin("丙", "己") == "정인"
    assert get_sipsin("己", "己") == "비견"
    assert get_sipsin("戊", "己") == "겁재"
    assert get_sipsin("甲", "己") == "정관"
    assert get_sipsin("乙", "己") == "편관"
    assert get_sipsin("壬", "己") == "정재"
    assert get_sipsin("癸", "己") == "편재"


def test_analyze_sipsin():
    """팔자 전체 십신 분석 (일간 제외 7글자)"""
    chart = NatalChart(["庚午", "丙戌", "己巳", "辛未"])

    assert len(chart.sipsin) == 7
    expected = [
        ("庚", "상관"), ("午", "정인"), ("丙", "정인"), ("戌", "겁재"),
        ("巳", "편인"), ("辛", "식신"), ("未", "비견"),
    ]
    assert chart.sipsin == expected


def test_get_sipsin_domains():
    """십신 영역 해석"""
    chart = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    domains = chart.get_sipsin_domains()

    assert len(domains) == 7
    assert domains[0]["sipsin"] == "상관"
    assert domains[0]["domain"] == "자유·반항·창의"


def test_pillars_property():
    """saju.pillars 프로퍼티"""
    chart = NatalChart(["庚午", "丙戌", "己巳", "辛未"])
    assert chart.saju.pillars == ["庚午", "丙戌", "己巳", "辛未"]
