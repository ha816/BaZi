from saju import SajuAnalyzer


def test_analyze_with_pillars():
    """간지를 직접 넣어서 오행 분석하는 기본 케이스"""
    analyzer = SajuAnalyzer()

    # 1990년 10월 10일 14시생: 庚午年 丙戌月 己巳日 辛未時
    result = analyzer.analyze(["庚午", "丙戌", "己巳", "辛未"])

    # 일간(일주의 첫 글자) = 己 → 토
    assert result.my_main_element == "토"
    assert result.base_personality == "신용을 중시하며 포용력이 있고 듬직합니다."

    # 팔자 8글자 각각의 오행을 세본다:
    # 庚(금) 午(화) 丙(화) 戌(토) 己(토) 巳(화) 辛(금) 未(토)
    # → 목:0, 화:3, 토:3, 금:2, 수:0
    assert result.element_stats == {"목": 0, "화": 3, "토": 3, "금": 2, "수": 0}

    # 화가 3개 이상이면 급한 성격 플래그
    assert result.is_hot_tempered is True

    # 사주 네 기둥도 그대로 보존
    assert result.year_pillar == "庚午"
    assert result.day_pillar == "己巳"


def test_analyze_water_dominant():
    """수(水) 기운이 강한 사주 예시"""
    analyzer = SajuAnalyzer()

    # 壬子年 壬子月 壬子日 壬子時 (극단적 예시)
    result = analyzer.analyze(["壬子", "壬子", "壬子", "壬子"])

    assert result.my_main_element == "수"
    assert result.element_stats == {"목": 0, "화": 0, "토": 0, "금": 0, "수": 8}
    assert result.is_hot_tempered is False


def test_from_birthday():
    """생년월일시로 사주를 자동 계산하는 케이스"""
    analyzer = SajuAnalyzer()

    result = analyzer.from_birthday(1990, 10, 10, 14, 30, city="Seoul")

    # sajupy가 간지를 계산해주므로 네 기둥이 모두 채워져야 한다
    assert len(result.year_pillar) == 2
    assert len(result.month_pillar) == 2
    assert len(result.day_pillar) == 2
    assert len(result.hour_pillar) == 2

    # 오행 합계는 항상 8 (천간4 + 지지4)
    assert sum(result.element_stats.values()) == 8
