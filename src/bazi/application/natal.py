"""선천·후천 분석 (팔자 기반 분석 + 대운/세운)"""

from collections import Counter

from sajupy import SajuCalculator

from bazi.domain.ganji import Branch, Oheng, SibiUnseong, Sipsin, Stem, lookup
from bazi.domain.natal import DaeunPeriod, Jeol, NatalInfo, PostnatalInfo, Saju, Sinsal
from bazi.domain.user import User
from bazi.domain.util import parse_term_time, year_to_ganji


class NatalAnalyzer:
    """선천 분석기 — 사주(四柱)를 받아 분석 결과(NatalInfo)를 반환한다."""

    def __call__(self, saju: Saju) -> NatalInfo:
        self.saju = saju
        self.day_stem = lookup(saju.day_stem)

        stats = self._count_oheng()
        me = self.day_stem.element
        strength = self._judge_strength(stats, me)
        yongshin = self._find_yongshin(me, strength)

        return NatalInfo(
            saju=saju,
            my_main_element=me,
            element_stats=stats,
            strength=strength,
            yongshin=yongshin,
            sipsin=self._analyze_sipsin(),
            sibi_unseong=self._analyze_sibi_unseong(),
            sinsal=self._analyze_sinsal(),
            personality=me.personality,
        )

    def _count_oheng(self) -> dict[Oheng, int]:
        """팔자 8글자의 오행 분포를 집계한다."""
        counts = Counter(lookup(char).element for char in self.saju.palja)
        return {o: counts.get(o, 0) for o in Oheng}

    def _judge_strength(self, stats: dict[Oheng, int], me: Oheng) -> int:
        """일간 강약을 판단한다. 양수=신강, 0=중화, 음수=신약."""
        helping = stats[me] + stats[me.generated_by]
        draining = sum(stats.values()) - helping
        return helping - draining

    def _find_yongshin(self, me: Oheng, strength: int) -> Oheng:
        """용신(用神)을 선정한다."""
        return me.generates if strength > 0 else me.generated_by

    def _analyze_sipsin(self) -> list[tuple[str, Sipsin]]:
        """팔자에서 일간을 제외한 7글자의 십신을 분석한다."""
        all_chars = list(self.saju.palja)
        day_stem_index = 4
        chars = all_chars[:day_stem_index] + all_chars[day_stem_index + 1:]
        return [(char, Sipsin.of(self.day_stem, lookup(char))) for char in chars]

    def _analyze_sibi_unseong(self) -> list[tuple[str, SibiUnseong]]:
        """각 기둥 지지의 십이운성을 분석한다."""
        stem = Stem[self.saju.day_stem]
        return [
            (pillar, SibiUnseong.of(stem, Branch[pillar[1]]))
            for pillar in self.saju.pillars
        ]

    def _analyze_sinsal(self) -> list[tuple[Branch, Sinsal]]:
        """사주에서 신살을 찾는다."""
        day_branch = Branch[self.saju.day_pillar[1]]
        all_branches = [Branch[p[1]] for p in self.saju.pillars]
        return Sinsal.find_all(day_branch, all_branches)


class PostnatalAnalyzer:
    """후천 분석기 — 사주(四柱)와 시간 정보를 받아 PostnatalInfo를 반환한다."""

    def __call__(
        self,
        user: User,
        saju: Saju,
        year: int,
    ) -> PostnatalInfo:
        self.user = user
        self.saju = saju
        self.year = year

        seun_stem, seun_branch = self._calc_seun()
        daeun = self._calc_daeun()

        return PostnatalInfo(
            year=year,
            seun_stem=seun_stem,
            seun_branch=seun_branch,
            daeun=daeun,
        )

    def _calc_seun(self) -> tuple[tuple[str, Sipsin], tuple[str, Sipsin]]:
        """세운(歲運) 분석: 해당 연도의 간지가 일간에 미치는 영향."""
        ganji = year_to_ganji(self.year)
        ds = lookup(self.saju.day_stem)
        return (
            (ganji[0], Sipsin.of(ds, lookup(ganji[0]))),
            (ganji[1], Sipsin.of(ds, lookup(ganji[1]))),
        )

    def _calc_daeun(self) -> list[DaeunPeriod]:
        """대운 목록을 생성한다."""
        forward = Stem[self.saju.year_pillar[0]].is_yang == self.user.gender.is_male
        sequence = self._get_daeun_sequence(forward)
        start_age = self._calc_start_age(forward)

        return [
            DaeunPeriod(
                ganji=ganji,
                start_age=start_age + i * 10,
                end_age=start_age + i * 10 + 9,
            )
            for i, ganji in enumerate(sequence)
        ]

    def _get_daeun_sequence(self, forward: bool, count: int = 8) -> list[str]:
        """대운 순서를 생성한다. 양남/음녀 → 순행, 음남/양녀 → 역행."""
        month_pillar = self.saju.month_pillar
        stem_idx = Stem[month_pillar[0]].order
        branch_idx = Branch[month_pillar[1]].order
        step = 1 if forward else -1

        return [
            Stem.by_order(stem_idx + step * i).name
            + Branch.by_order(branch_idx + step * i).name
            for i in range(1, count + 1)
        ]

    def _calc_start_age(self, forward: bool) -> int:
        """대운 시작 나이를 계산한다. 생일에서 가장 가까운 절(節)까지의 일수 ÷ 3."""
        calc = SajuCalculator()
        birth_dt = self.user.birth_dt
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
