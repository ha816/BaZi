"""후천 분석 (대운, 세운 등 시간에 따라 변하는 운)"""

from dataclasses import dataclass
from datetime import datetime

from sajupy import SajuCalculator

from common.constants import BRANCHES, STEMS, YINYANG_MAP
from saju.natal import SajuResult, get_sipsin

# 절(節) 12개: 각 월의 시작을 알리는 절기 (대운 계산에 사용)
JEOL_TERMS = frozenset([
    "소한", "입춘", "경칩", "청명", "입하", "망종",
    "소서", "입추", "백로", "한로", "입동", "대설",
])


def year_to_ganji(year: int) -> str:
    """연도를 간지로 변환한다. (예: 2026 → '丙午')"""
    stem = STEMS[(year - 4) % 10]
    branch = BRANCHES[(year - 4) % 12]
    return stem + branch


def get_seun(year: int, day_stem: str) -> list[tuple[str, str]]:
    """
    세운(歲運) 분석: 해당 연도의 간지가 일간에 미치는 영향.
    반환: [(천간, 십신), (지지, 십신)]
    """
    ganji = year_to_ganji(year)
    return [
        (ganji[0], get_sipsin(ganji[0], day_stem)),
        (ganji[1], get_sipsin(ganji[1], day_stem)),
    ]


def get_daeun_sequence(
    month_pillar: str,
    year_stem: str,
    is_male: bool,
    count: int = 8,
) -> list[str]:
    """
    대운(大運) 순서를 생성한다.

    월주를 기점으로 순행/역행하며 count개의 대운 간지를 반환한다.
    - 양남/음녀 → 순행 (천간·지지 +1씩 전진)
    - 음남/양녀 → 역행 (천간·지지 -1씩 후퇴)
    """
    is_yang = YINYANG_MAP[year_stem]
    forward = is_yang == is_male

    stem_idx = STEMS.index(month_pillar[0])
    branch_idx = BRANCHES.index(month_pillar[1])
    step = 1 if forward else -1

    result = []
    for i in range(1, count + 1):
        s = STEMS[(stem_idx + step * i) % 10]
        b = BRANCHES[(branch_idx + step * i) % 12]
        result.append(s + b)

    return result


def _parse_term_time(term_time: float) -> datetime:
    """sajupy의 term_time(YYYYMMDDHHMM float)을 datetime으로 변환한다."""
    s = str(int(float(str(term_time))))
    return datetime(int(s[0:4]), int(s[4:6]), int(s[6:8]), int(s[8:10]), int(s[10:12]))


def calc_daeun_start_age(
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    birth_minute: int,
    year_stem: str,
    is_male: bool,
) -> int:
    """
    대운 시작 나이를 계산한다.

    생일에서 가장 가까운 절(節)까지의 일수를 3으로 나눈 값이 대운 시작 나이이다.
    (1일 = 4개월, 3일 = 1년)
    - 순행: 다음 절까지의 일수
    - 역행: 이전 절까지의 일수
    """
    is_yang = YINYANG_MAP[year_stem]
    forward = is_yang == is_male

    birth_dt = datetime(birth_year, birth_month, birth_day, birth_hour, birth_minute)

    calc = SajuCalculator()
    # 생년과 전후 1년의 절기 데이터 로드
    term_data = calc.data[
        (calc.data["solar_term_korean"].isin(JEOL_TERMS))
        & (calc.data["year"].isin([birth_year - 1, birth_year, birth_year + 1]))
    ].copy()

    if forward:
        # 순행: 생일 이후 가장 가까운 절
        future = []
        for _, row in term_data.iterrows():
            try:
                dt = _parse_term_time(row["term_time"])
                if dt > birth_dt:
                    future.append(dt)
            except (ValueError, KeyError):
                continue
        nearest = min(future)
    else:
        # 역행: 생일 이전 가장 가까운 절
        past = []
        for _, row in term_data.iterrows():
            try:
                dt = _parse_term_time(row["term_time"])
                if dt < birth_dt:
                    past.append(dt)
            except (ValueError, KeyError):
                continue
        nearest = max(past)

    days_diff = abs((nearest - birth_dt).days)
    return round(days_diff / 3)


@dataclass
class DaeunPeriod:
    """대운 하나의 기간 정보"""
    ganji: str      # 대운 간지
    start_age: int   # 시작 나이
    end_age: int     # 끝 나이


@dataclass
class FortuneAnalysis:
    """후천 분석 결과"""
    seun: list[tuple[str, str]]   # 세운: [(천간, 십신), (지지, 십신)]
    seun_year: int                 # 세운 연도
    seun_ganji: str                # 세운 간지
    daeun: list[DaeunPeriod]       # 대운 목록 (간지 + 기간)


def full_analysis(
    natal_result: SajuResult,
    year: int,
    is_male: bool,
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    birth_minute: int = 0,
) -> FortuneAnalysis:
    """
    후천 분석을 수행한다.

    Args:
        natal_result: 선천 분석의 SajuResult
        year: 세운을 볼 연도
        is_male: 성별 (남=True, 여=False)
        birth_year~birth_minute: 출생 정보 (대운 시작 나이 계산용)
    """
    seun_ganji = year_to_ganji(year)
    seun = get_seun(year, natal_result.day_stem)

    year_stem = natal_result.year_pillar[0]
    daeun_sequence = get_daeun_sequence(
        natal_result.month_pillar,
        year_stem,
        is_male,
    )

    start_age = calc_daeun_start_age(
        birth_year, birth_month, birth_day, birth_hour, birth_minute,
        year_stem, is_male,
    )

    daeun = []
    for i, ganji in enumerate(daeun_sequence):
        age_start = start_age + i * 10
        daeun.append(DaeunPeriod(
            ganji=ganji,
            start_age=age_start,
            end_age=age_start + 9,
        ))

    return FortuneAnalysis(
        seun=seun,
        seun_year=year,
        seun_ganji=seun_ganji,
        daeun=daeun,
    )
