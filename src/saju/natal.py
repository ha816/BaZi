from dataclasses import dataclass

from sajupy import calculate_saju

from common.constants import (
    ELEMENT_MAP,
    GENERATING_MAP,
    INTERPRETATIONS,
    OVERCOMING_MAP,
    YINYANG_MAP,
)


@dataclass
class SajuResult:
    year_pillar: str
    month_pillar: str
    day_pillar: str
    hour_pillar: str
    day_stem: str
    my_main_element: str
    element_stats: dict[str, int]


@dataclass
class NatalAnalysis:
    """선천 분석 결과 (태어난 순간 고정)"""
    saju: SajuResult
    strength: int  # 양수=신강, 0=중화, 음수=신약 (범위: -8 ~ +8)
    yongshin: str
    personality: str
    sipsin: list[tuple[str, str]]  # [(글자, 십신), ...] 일간 제외 7글자


def from_birthday(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int = 0,
    city: str = "Seoul",
) -> SajuResult:
    """생년월일시로 사주를 계산한다."""
    result = calculate_saju(
        year=year,
        month=month,
        day=day,
        hour=hour,
        minute=minute,
        city=city,
        use_solar_time=True,
    )
    return analyze([
        result["year_pillar"],
        result["month_pillar"],
        result["day_pillar"],
        result["hour_pillar"],
    ])


def analyze(saju_pillars: list[str]) -> SajuResult:
    """사주 네 기둥을 받아 기본 분석 결과를 반환한다."""
    stats = {"목": 0, "화": 0, "토": 0, "금": 0, "수": 0}
    for char in "".join(saju_pillars):
        stats[ELEMENT_MAP[char]] += 1

    day_stem = saju_pillars[2][0]
    my_element = ELEMENT_MAP[day_stem]

    return SajuResult(
        year_pillar=saju_pillars[0],
        month_pillar=saju_pillars[1],
        day_pillar=saju_pillars[2],
        hour_pillar=saju_pillars[3],
        day_stem=day_stem,
        my_main_element=my_element,
        element_stats=stats,
    )


def judge_strength(result: SajuResult) -> int:
    """
    일간 강약을 판단한다.
    나를 돕는 오행(비겁 + 인성) - 빼는 오행(식상 + 재성 + 관성)을 반환한다.
    양수=신강, 0=중화, 음수=신약 (범위: -8 ~ +8)
    """
    me = result.my_main_element
    generating_me = [k for k, v in GENERATING_MAP.items() if v == me][0]

    stats = result.element_stats
    helping = stats[me] + stats[generating_me]
    draining = sum(stats.values()) - helping

    return helping - draining


def find_yongshin(result: SajuResult, strength: int) -> str:
    """
    용신(用神)을 선정한다.
    strength > 0(신강)이면 기운을 빼줄 오행, <= 0(신약/중화)이면 도와줄 오행을 반환한다.
    """
    me = result.my_main_element

    if strength > 0:
        return GENERATING_MAP[me]
    else:
        return [k for k, v in GENERATING_MAP.items() if v == me][0]


def get_personality(result: SajuResult) -> str:
    """일간 오행 기반 기본 성격을 반환한다."""
    return INTERPRETATIONS[result.my_main_element]


def get_sipsin(char: str, day_stem: str) -> str:
    """
    일간 기준으로 한 글자의 십신을 판별한다.
    오행 관계(같음/생/극) + 음양 일치 여부로 10가지 십신 중 하나를 반환한다.
    """
    me_element = ELEMENT_MAP[day_stem]
    me_yinyang = YINYANG_MAP[day_stem]
    target_element = ELEMENT_MAP[char]
    target_yinyang = YINYANG_MAP[char]

    same_yinyang = me_yinyang == target_yinyang

    if me_element == target_element:
        return "비견" if same_yinyang else "겁재"
    elif GENERATING_MAP[me_element] == target_element:
        return "식신" if same_yinyang else "상관"
    elif OVERCOMING_MAP[me_element] == target_element:
        return "편재" if same_yinyang else "정재"
    elif GENERATING_MAP[target_element] == me_element:
        return "편인" if same_yinyang else "정인"
    else:
        return "편관" if same_yinyang else "정관"


def analyze_sipsin(result: SajuResult) -> list[tuple[str, str]]:
    """
    팔자 8글자에서 일간을 제외한 7글자의 십신을 분석한다.
    반환: [(글자, 십신), ...] 년주천간부터 시주지지 순서 (일간 제외)
    """
    all_chars = list("".join([
        result.year_pillar,
        result.month_pillar,
        result.day_pillar,
        result.hour_pillar,
    ]))
    day_stem_index = 4
    chars_without_day_stem = all_chars[:day_stem_index] + all_chars[day_stem_index + 1:]

    return [
        (char, get_sipsin(char, result.day_stem))
        for char in chars_without_day_stem
    ]


def full_analysis(saju_pillars: list[str]) -> NatalAnalysis:
    """사주 네 기둥에 대해 선천 분석을 모두 수행한다."""
    result = analyze(saju_pillars)
    strength = judge_strength(result)
    yongshin = find_yongshin(result, strength)
    personality = get_personality(result)
    sipsin = analyze_sipsin(result)

    return NatalAnalysis(
        saju=result,
        strength=strength,
        yongshin=yongshin,
        personality=personality,
        sipsin=sipsin,
    )