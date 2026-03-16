from saju import natal


def test_analyze_with_pillars():
    """간지를 직접 넣어서 오행 분석하는 기본 케이스"""
    result = natal.analyze(["庚午", "丙戌", "己巳", "辛未"])

    assert result.my_main_element == "토"
    assert result.day_stem == "己"
    assert result.element_stats == {"목": 0, "화": 3, "토": 3, "금": 2, "수": 0}
    assert result.year_pillar == "庚午"
    assert result.day_pillar == "己巳"


def test_analyze_water_dominant():
    """수(水) 기운이 강한 사주 예시"""
    result = natal.analyze(["壬子", "壬子", "壬子", "壬子"])

    assert result.my_main_element == "수"
    assert result.element_stats == {"목": 0, "화": 0, "토": 0, "금": 0, "수": 8}


def test_from_birthday():
    """생년월일시로 사주를 자동 계산하는 케이스"""
    result = natal.from_birthday(1990, 10, 10, 14, 30, city="Seoul")

    assert len(result.year_pillar) == 2
    assert len(result.month_pillar) == 2
    assert len(result.day_pillar) == 2
    assert len(result.hour_pillar) == 2
    assert sum(result.element_stats.values()) == 8


def test_judge_strength_strong():
    """신강 판단: 토 일간에 화(인성)+토(비겁)가 많은 경우"""
    result = natal.analyze(["己巳", "丙戌", "己巳", "己未"])
    strength = natal.judge_strength(result)

    assert strength == 8


def test_judge_strength_weak():
    """신약 판단: 목 일간에 금(관성)이 많은 경우"""
    result = natal.analyze(["庚申", "庚申", "甲戌", "庚申"])
    strength = natal.judge_strength(result)

    assert strength == -6


def test_find_yongshin_for_strong():
    """신강일 때 용신: 기운을 빼줄 식상(내가 생하는 오행)"""
    result = natal.analyze(["己巳", "丙戌", "己巳", "己未"])
    strength = natal.judge_strength(result)
    yongshin = natal.find_yongshin(result, strength)

    assert yongshin == "금"


def test_find_yongshin_for_weak():
    """신약일 때 용신: 기운을 보충할 인성(나를 생하는 오행)"""
    result = natal.analyze(["庚申", "庚申", "甲戌", "庚申"])
    strength = natal.judge_strength(result)
    yongshin = natal.find_yongshin(result, strength)

    assert yongshin == "수"


def test_get_personality():
    """일간 오행 기반 성격 조회"""
    result = natal.analyze(["庚午", "丙戌", "己巳", "辛未"])
    personality = natal.get_personality(result)

    assert personality == "신용을 중시하며 포용력이 있고 듬직합니다."


def test_get_sipsin():
    """일간 기준 십신 판별"""
    assert natal.get_sipsin("庚", "己") == "상관"
    assert natal.get_sipsin("丙", "己") == "정인"
    assert natal.get_sipsin("己", "己") == "비견"
    assert natal.get_sipsin("戊", "己") == "겁재"
    assert natal.get_sipsin("甲", "己") == "정관"
    assert natal.get_sipsin("乙", "己") == "편관"
    assert natal.get_sipsin("壬", "己") == "정재"
    assert natal.get_sipsin("癸", "己") == "편재"


def test_analyze_sipsin():
    """팔자 전체 십신 분석 (일간 제외 7글자)"""
    result = natal.analyze(["庚午", "丙戌", "己巳", "辛未"])
    sipsin = natal.analyze_sipsin(result)

    assert len(sipsin) == 7
    expected = [
        ("庚", "상관"), ("午", "정인"), ("丙", "정인"), ("戌", "겁재"),
        ("巳", "편인"), ("辛", "식신"), ("未", "비견"),
    ]
    assert sipsin == expected


def test_full_analysis():
    """full_analysis로 선천 분석을 한번에 수행"""
    analysis = natal.full_analysis(["己巳", "丙戌", "己巳", "己未"])

    assert analysis.saju.my_main_element == "토"
    assert analysis.saju.day_stem == "己"
    assert sum(analysis.saju.element_stats.values()) == 8
    assert analysis.strength > 0
    assert analysis.yongshin == "금"
    assert analysis.personality == "신용을 중시하며 포용력이 있고 듬직합니다."
    assert len(analysis.sipsin) == 7


def test_full_analysis_weak_case():
    """full_analysis 신약 케이스"""
    analysis = natal.full_analysis(["庚申", "庚申", "甲戌", "庚申"])

    assert analysis.saju.my_main_element == "목"
    assert analysis.strength < 0
    assert analysis.yongshin == "수"
    assert len(analysis.sipsin) == 7