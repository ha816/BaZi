"""후천 분석 (대운, 세운 등 시간에 따라 변하는 운)"""

from dataclasses import dataclass
from datetime import datetime

from sajupy import SajuCalculator

from bazi.domain.fortune import Jeol, Saju
from bazi.domain.ganji import Branch, Stem
from bazi.domain.sipsin import Sipsin
from bazi.domain.util import parse_term_time, year_to_ganji


@dataclass
class DaeunPeriod:
    """대운 하나의 기간 정보"""
    ganji: str
    start_age: int
    end_age: int


@dataclass
class FortuneInfo:
    """후천 분석 결과"""
    year: int
    seun_ganji: str
    seun: list[tuple[str, str]]
    daeun: list[DaeunPeriod]


class FortuneAnalyzer:
    """후천 분석기 — 사주(四柱)와 시간 정보를 받아 FortuneInfo를 반환한다."""

    def __call__(
        self,
        saju: Saju,
        year: int,
        is_male: bool,
    ) -> FortuneInfo:
        seun_ganji = year_to_ganji(year)
        seun = self._calc_seun(saju, seun_ganji)
        daeun = self._calc_daeun(saju, is_male)

        return FortuneInfo(
            year=year,
            seun_ganji=seun_ganji,
            seun=seun,
            daeun=daeun,
        )

    @staticmethod
    def _calc_seun(saju: Saju, seun_ganji: str) -> list[tuple[str, str]]:
        """세운(歲運) 분석: 해당 연도의 간지가 일간에 미치는 영향."""
        ds = saju.day_stem
        return [
            (seun_ganji[0], Sipsin.of(ds, seun_ganji[0]).name),
            (seun_ganji[1], Sipsin.of(ds, seun_ganji[1]).name),
        ]

    @staticmethod
    def _calc_daeun(saju: Saju, is_male: bool) -> list[DaeunPeriod]:
        """대운 목록을 생성한다."""
        forward = Stem[saju.year_pillar[0]].is_yang == is_male
        sequence = FortuneAnalyzer._get_daeun_sequence(saju, forward)
        start_age = FortuneAnalyzer._calc_start_age(saju.birth_dt, forward)

        return [
            DaeunPeriod(
                ganji=ganji,
                start_age=start_age + i * 10,
                end_age=start_age + i * 10 + 9,
            )
            for i, ganji in enumerate(sequence)
        ]

    @staticmethod
    def _get_daeun_sequence(saju: Saju, forward: bool, count: int = 8) -> list[str]:
        """대운 순서를 생성한다. 양남/음녀 → 순행, 음남/양녀 → 역행."""
        month_pillar = saju.month_pillar
        stem_idx = Stem[month_pillar[0]].order
        branch_idx = Branch[month_pillar[1]].order
        step = 1 if forward else -1

        return [
            Stem.by_order(stem_idx + step * i).name
            + Branch.by_order(branch_idx + step * i).name
            for i in range(1, count + 1)
        ]

    @staticmethod
    def _calc_start_age(birth_dt: datetime, forward: bool) -> int:
        """대운 시작 나이를 계산한다. 생일에서 가장 가까운 절(節)까지의 일수 ÷ 3."""
        calc = SajuCalculator()
        birth_year = birth_dt.year
        term_data = calc.data[
            (calc.data["solar_term_korean"].isin(Jeol.korean_names()))
            & (calc.data["year"].isin([birth_year - 1, birth_year, birth_year + 1]))
        ]

        term_dates = []
        for _, row in term_data.iterrows():
            try:
                term_dates.append(parse_term_time(row["term_time"]))
            except (ValueError, KeyError):
                continue

        if forward:
            nearest = min(dt for dt in term_dates if dt > birth_dt)
        else:
            nearest = max(dt for dt in term_dates if dt < birth_dt)

        return round(abs((nearest - birth_dt).days) / 3)