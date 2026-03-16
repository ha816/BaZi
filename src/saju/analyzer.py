from dataclasses import dataclass

from sajupy import calculate_saju

from common.constants import ELEMENT_MAP, INTERPRETATIONS


@dataclass
class SajuResult:
    year_pillar: str
    month_pillar: str
    day_pillar: str
    hour_pillar: str
    my_main_element: str
    element_stats: dict[str, int]
    base_personality: str
    is_hot_tempered: bool


class SajuAnalyzer:
    """사주팔자 기본 분석기"""

    def from_birthday(
        self,
        year: int,
        month: int,
        day: int,
        hour: int,
        minute: int = 0,
        city: str = "Seoul",
    ) -> SajuResult:
        """
        생년월일시로 사주를 계산하고 오행 분석 결과를 반환한다.

        Args:
            year: 출생 연도
            month: 출생 월
            day: 출생 일
            hour: 출생 시
            minute: 출생 분
            city: 출생 도시 (태양시 보정에 사용)
        """
        result = calculate_saju(
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            city=city,
            use_solar_time=True,
        )
        pillars = [
            result["year_pillar"],
            result["month_pillar"],
            result["day_pillar"],
            result["hour_pillar"],
        ]
        return self.analyze(pillars)

    def analyze(self, saju_pillars: list[str]) -> SajuResult:
        """
        사주 네 기둥을 받아 오행 분석 결과를 반환한다.

        Args:
            saju_pillars: 연주, 월주, 일주, 시주 순서의 간지 리스트
                          예) ['庚午', '丙戌', '己巳', '辛未']
        """
        all_chars = "".join(saju_pillars)
        day_stem = saju_pillars[2][0]  # 일간 = 나를 대표하는 글자

        stats = {"목": 0, "화": 0, "토": 0, "금": 0, "수": 0}
        for char in all_chars:
            element = ELEMENT_MAP.get(char)
            if element:
                stats[element] += 1

        my_element = ELEMENT_MAP[day_stem]

        return SajuResult(
            year_pillar=saju_pillars[0],
            month_pillar=saju_pillars[1],
            day_pillar=saju_pillars[2],
            hour_pillar=saju_pillars[3],
            my_main_element=my_element,
            element_stats=stats,
            base_personality=INTERPRETATIONS[my_element],
            is_hot_tempered=stats["화"] >= 3,
        )
