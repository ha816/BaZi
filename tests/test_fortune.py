from saju import natal, fortune


def test_year_to_ganji():
    """연도 → 간지 변환"""
    assert fortune.year_to_ganji(1990) == "庚午"
    assert fortune.year_to_ganji(2000) == "庚辰"
    assert fortune.year_to_ganji(2024) == "甲辰"
    assert fortune.year_to_ganji(2026) == "丙午"


def test_get_seun():
    """세운 분석: 해당 연도 간지의 십신"""
    # 일간: 己(토, 음), 2026년 = 丙午
    # 丙(화, 양) → 정인, 午(화, 양) → 정인
    seun = fortune.get_seun(2026, "己")

    assert seun == [("丙", "정인"), ("午", "정인")]


def test_get_daeun_sequence_forward():
    """대운 순행: 양남 (년간 양 + 남자)"""
    # 월주: 丙戌, 년간: 庚(양), 남자 → 순행
    sequence = fortune.get_daeun_sequence("丙戌", "庚", is_male=True, count=4)

    assert sequence == ["丁亥", "戊子", "己丑", "庚寅"]


def test_get_daeun_sequence_backward():
    """대운 역행: 양녀 (년간 양 + 여자)"""
    # 월주: 丙戌, 년간: 庚(양), 여자 → 역행
    sequence = fortune.get_daeun_sequence("丙戌", "庚", is_male=False, count=4)

    assert sequence == ["乙酉", "甲申", "癸未", "壬午"]


def test_calc_daeun_start_age_forward():
    """순행 대운 시작 나이: 생일→다음 절까지 일수 / 3"""
    # 1990-10-10 14:30, 庚(양) + 남자 → 순행
    # 다음 절: 입동 1990-11-08 → 약 28일 / 3 ≈ 9세
    age = fortune.calc_daeun_start_age(1990, 10, 10, 14, 30, "庚", is_male=True)

    assert age == 9


def test_calc_daeun_start_age_backward():
    """역행 대운 시작 나이: 생일→이전 절까지 일수 / 3"""
    # 1990-10-10 14:30, 庚(양) + 여자 → 역행
    # 이전 절: 한로 1990-10-08 → 약 2일 / 3 ≈ 1세
    age = fortune.calc_daeun_start_age(1990, 10, 10, 14, 30, "庚", is_male=False)

    assert age == 1


def test_full_analysis():
    """후천 분석 통합"""
    result = natal.analyze(["庚午", "丙戌", "己巳", "辛未"])
    analysis = fortune.full_analysis(
        result,
        year=2026,
        is_male=True,
        birth_year=1990,
        birth_month=10,
        birth_day=10,
        birth_hour=14,
        birth_minute=30,
    )

    # 세운
    assert analysis.seun_year == 2026
    assert analysis.seun_ganji == "丙午"
    assert len(analysis.seun) == 2

    # 대운
    assert len(analysis.daeun) == 8
    assert analysis.daeun[0].ganji == "丁亥"
    assert analysis.daeun[0].start_age == 9
    assert analysis.daeun[0].end_age == 18
    assert analysis.daeun[1].start_age == 19
    assert analysis.daeun[1].end_age == 28
