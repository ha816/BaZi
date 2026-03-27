"""선천·후천 분석 (팔자 기반 분석 + 대운/세운)"""

from collections import Counter
from datetime import datetime

from sajupy import SajuCalculator

from bazi.domain.natal import Jeol, Saju
from bazi.domain.ganji import Branch, Oheng, Sipsin, Stem, lookup
from bazi.domain.natal import DaeunPeriod, NatalInfo, PostnatalInfo
from bazi.domain.user import User
from bazi.domain.util import parse_term_time, year_to_ganji


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


class PostnatalAnalyzer:
    """후천 분석기 — 사주(四柱)와 시간 정보를 받아 PostnatalInfo를 반환한다."""

    def __call__(
        self,
        user: User,
        saju: Saju,
        year: int,
    ) -> PostnatalInfo:
        seun_ganji = year_to_ganji(year)
        seun = self._calc_seun(saju, seun_ganji)
        daeun = self._calc_daeun(saju, user)

        return PostnatalInfo(
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
    def _calc_daeun(saju: Saju, user: User) -> list[DaeunPeriod]:
        """대운 목록을 생성한다."""
        forward = Stem[saju.year_pillar[0]].is_yang == user.gender.is_male
        sequence = PostnatalAnalyzer._get_daeun_sequence(saju, forward)
        start_age = PostnatalAnalyzer._calc_start_age(user.birth_dt, forward)

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