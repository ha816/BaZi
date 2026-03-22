"""선천 분석 (팔자 기반 분석 - 오행, 강약, 용신, 십신)"""

from dataclasses import dataclass

from bazi.domain.ganji import Oheng, lookup
from bazi.domain.sipsin import Sipsin


@dataclass
class SajuResult:
    year_pillar: str
    month_pillar: str
    day_pillar: str
    hour_pillar: str
    day_stem: str
    my_main_element: str
    element_stats: dict[str, int]

    @property
    def pillars(self) -> list[str]:
        return [self.year_pillar, self.month_pillar, self.day_pillar, self.hour_pillar]


class NatalAnalyzer:
    """사주 분석 차트"""

    def __init__(self, saju_pillars: list[str]):
        self.saju = self._analyze(saju_pillars)
        self.strength = self._judge_strength()
        self.yongshin = self._find_yongshin()
        self.sipsin = self._analyze_sipsin()

    @staticmethod
    def _analyze(saju_pillars: list[str]) -> SajuResult:
        """사주 네 기둥을 받아 기본 분석 결과를 반환한다."""
        stats = {o.name: 0 for o in Oheng}
        for char in "".join(saju_pillars):
            stats[lookup(char).element.name] += 1

        day_stem = saju_pillars[2][0]
        my_element = lookup(day_stem).element.name

        return SajuResult(
            year_pillar=saju_pillars[0],
            month_pillar=saju_pillars[1],
            day_pillar=saju_pillars[2],
            hour_pillar=saju_pillars[3],
            day_stem=day_stem,
            my_main_element=my_element,
            element_stats=stats,
        )

    def _judge_strength(self) -> int:
        """
        일간 강약을 판단한다.
        양수=신강, 0=중화, 음수=신약 (범위: -8 ~ +8)
        """
        me = Oheng[self.saju.my_main_element]
        generating_me = me.generated_by

        stats = self.saju.element_stats
        helping = stats[me.name] + stats[generating_me.name]
        draining = sum(stats.values()) - helping

        return helping - draining

    def _find_yongshin(self) -> str:
        """
        용신(用神)을 선정한다.
        strength > 0(신강)이면 기운을 빼줄 오행, <= 0(신약/중화)이면 도와줄 오행.
        """
        me = Oheng[self.saju.my_main_element]

        if self.strength > 0:
            return me.generates.name
        else:
            return me.generated_by.name

    def _analyze_sipsin(self) -> list[tuple[str, str]]:
        """팔자 8글자에서 일간을 제외한 7글자의 십신을 분석한다."""
        all_chars = list("".join(self.saju.pillars))
        day_stem_index = 4
        chars_without_day_stem = all_chars[:day_stem_index] + all_chars[day_stem_index + 1:]

        return [
            (char, Sipsin.of(self.saju.day_stem, char).name)
            for char in chars_without_day_stem
        ]

    def get_personality(self) -> str:
        """일간 오행 기반 기본 성격을 반환한다."""
        return Oheng[self.saju.my_main_element].personality

    def get_sipsin_domains(self) -> list[dict]:
        """십신별 영역 해석을 포함한 결과를 반환한다."""
        return [
            {"char": char, "sipsin": sipsin, "domain": Sipsin[sipsin].domain}
            for char, sipsin in self.sipsin
        ]
