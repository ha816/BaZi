from sajupy import calculate_saju


def test_calculate_saju_returns_four_pillars():
    """사주 네 기둥(년주, 월주, 일주, 시주)이 모두 반환되는지 확인"""
    result = calculate_saju(1990, 10, 10, 14, 30, city="Seoul", use_solar_time=True)

    assert result["year_pillar"] == "庚午"
    assert result["month_pillar"] == "丙戌"
    assert result["day_pillar"] == "戊申"
    assert result["hour_pillar"] == "己未"


def test_calculate_saju_stems_and_branches():
    """천간(stem)과 지지(branch)가 기둥과 일치하는지 확인"""
    result = calculate_saju(1990, 10, 10, 14, 30, city="Seoul", use_solar_time=True)

    assert result["year_stem"] == "庚"
    assert result["year_branch"] == "午"
    assert result["month_stem"] == "丙"
    assert result["month_branch"] == "戌"
    assert result["day_stem"] == "戊"
    assert result["day_branch"] == "申"
    assert result["hour_stem"] == "己"
    assert result["hour_branch"] == "未"

    # stem + branch == pillar
    for prefix in ("year", "month", "day", "hour"):
        assert result[f"{prefix}_stem"] + result[f"{prefix}_branch"] == result[f"{prefix}_pillar"]


def test_calculate_saju_solar_correction():
    """태양시 보정 정보가 올바르게 포함되는지 확인"""
    result = calculate_saju(1990, 10, 10, 14, 30, city="Seoul", use_solar_time=True)

    correction = result["solar_correction"]
    assert correction["city"] == "Seoul"
    assert correction["original_time"] == "14:30"
    assert correction["solar_time"] == "13:57"
    assert correction["correction_minutes"] < 0  # 서울은 표준경선(135°)보다 서쪽이므로 음수 보정


def test_calculate_saju_birth_info():
    """출생일시 정보가 올바르게 저장되는지 확인"""
    result = calculate_saju(1990, 10, 10, 14, 30, city="Seoul", use_solar_time=True)

    assert result["birth_date"] == "1990-10-10"
    assert result["birth_time"] == "14:30"


def test_calculate_saju_different_dates():
    """다른 날짜에 대해서도 정상적으로 계산되는지 확인"""

    # 2000년 1월 1일 0시
    result = calculate_saju(2000, 1, 1, 0, 0, city="Seoul", use_solar_time=True)

    # 기본 구조 확인
    for key in ("year_pillar", "month_pillar", "day_pillar", "hour_pillar"):
        assert len(result[key]) == 2

    for prefix in ("year", "month", "day", "hour"):
        assert result[f"{prefix}_stem"] + result[f"{prefix}_branch"] == result[f"{prefix}_pillar"]