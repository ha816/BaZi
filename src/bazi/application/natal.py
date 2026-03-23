"""선천 분석 (팔자 기반 분석 - 오행, 강약, 용신, 십신)"""

from collections import Counter
from dataclasses import dataclass

from bazi.domain.fortune import Saju
from bazi.domain.ganji import Oheng, lookup
from bazi.domain.sipsin import Sipsin


@dataclass
class NatalInfo:
    saju: Saju
    my_main_element: str
    element_stats: dict[str, int]
    strength: int
    yongshin: str
    sipsin: list[tuple[str, str]]
    personality: str
    sipsin_domains: list[dict]


class NatalAnalyzer:
    """선천 분석기 — 사주(四柱)를 받아 분석 결과(NatalInfo)를 반환한다."""

    def __call__(self, saju: Saju) -> NatalInfo:
        stats = self._count_oheng(saju)
        my_element = lookup(saju.day_stem).element.name
        me = Oheng[my_element]
        strength = self._judge_strength(stats, me)
        yongshin = self._find_yongshin(me, strength)
        sipsin = self._analyze_sipsin(saju)
        sipsin_domains = self._build_sipsin_domains(sipsin)

        return NatalInfo(
            saju=saju,
            my_main_element=my_element,
            element_stats=stats,
            strength=strength,
            yongshin=yongshin,
            sipsin=sipsin,
            personality=me.personality,
            sipsin_domains=sipsin_domains,
        )

    @staticmethod
    def _count_oheng(saju: Saju) -> dict[str, int]:
        """팔자 8글자의 오행 분포를 집계한다."""
        counts = Counter(lookup(char).element.name for char in saju.palja)
        return {o.name: counts.get(o.name, 0) for o in Oheng}

    @staticmethod
    def _judge_strength(stats: dict[str, int], me: Oheng) -> int:
        """일간 강약을 판단한다. 양수=신강, 0=중화, 음수=신약."""
        helping = stats[me.name] + stats[me.generated_by.name]
        draining = sum(stats.values()) - helping
        return helping - draining

    @staticmethod
    def _find_yongshin(me: Oheng, strength: int) -> str:
        """용신(用神)을 선정한다."""
        return me.generates.name if strength > 0 else me.generated_by.name

    @staticmethod
    def _analyze_sipsin(saju: Saju) -> list[tuple[str, str]]:
        """팔자에서 일간을 제외한 7글자의 십신을 분석한다."""
        all_chars = list(saju.palja)
        day_stem_index = 4
        chars = all_chars[:day_stem_index] + all_chars[day_stem_index + 1:]
        return [(char, Sipsin.of(saju.day_stem, char).name) for char in chars]

    @staticmethod
    def _build_sipsin_domains(sipsin: list[tuple[str, str]]) -> list[dict]:
        """십신별 영역 해석을 생성한다."""
        return [
            {"char": char, "sipsin": s, "domain": Sipsin[s].domain}
            for char, s in sipsin
        ]