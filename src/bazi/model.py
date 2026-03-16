"""사주 기본 모델 (팔자, 오행, 십신 등 사주 데이터 구조와 분석)"""

from dataclasses import dataclass

from sajupy import calculate_saju

from bazi.domain.ganji import Oheng, lookup
from bazi.domain.sipsin import Sipsin

# 오행별 기본 성격 해석
INTERPRETATIONS: dict[str, str] = {
    "木": "성장과 추진력이 강하며 리더십이 있습니다.",
    "火": "열정적이고 솔직하며 감정 표현이 확실합니다.",
    "土": "신용을 중시하며 포용력이 있고 듬직합니다.",
    "金": "결단력이 있고 냉철하며 원칙을 중요시합니다.",
    "水": "지혜롭고 유연하며 적응력이 뛰어납니다.",
}


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


class NatalChart:
    """사주 분석 기본 모델"""

    def __init__(self, saju_pillars: list[str]):
        self.saju = self._analyze(saju_pillars)
        self.strength = self._judge_strength()
        self.yongshin = self._find_yongshin()
        self.sipsin = self._analyze_sipsin()

    @classmethod
    def from_birthday(
        cls,
        year: int,
        month: int,
        day: int,
        hour: int,
        minute: int = 0,
        city: str = "Seoul",
    ) -> "NatalChart":
        """생년월일시로 사주를 계산하여 NatalChart를 생성한다."""
        result = calculate_saju(
            year=year, month=month, day=day,
            hour=hour, minute=minute, city=city,
            use_solar_time=True,
        )
        return cls([
            result["year_pillar"],
            result["month_pillar"],
            result["day_pillar"],
            result["hour_pillar"],
        ])

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
        return INTERPRETATIONS[self.saju.my_main_element]

    def get_sipsin_domains(self) -> list[dict]:
        """십신별 영역 해석을 포함한 결과를 반환한다."""
        return [
            {"char": char, "sipsin": sipsin, "domain": Sipsin[sipsin].domain}
            for char, sipsin in self.sipsin
        ]
