from collections import Counter

from sajupy import SajuCalculator

from bazi.domain.ganji import Branch, Oheng, SibiUnseong, Sipsin, Stem
from bazi.domain.natal import DaeunPeriod, Jeol, NatalInfo, Pillar, PostnatalInfo, Saju, Sinsal
from bazi.domain.user import User
from bazi.application.util.util import parse_term_time, year_to_ganji


class NatalAnalyzer:
    """선천 분석기 — 사주(四柱)를 받아 분석 결과(NatalInfo)를 반환한다."""

    saju: Saju
    day_stem: Stem

    def __call__(self, saju: Saju) -> NatalInfo:
        self.saju = saju
        self.day_stem = Stem.from_char(saju.day_stem)

        stats = self._get_oheng()
        me = self.day_stem.element
        strength = self._get_strength(stats, me)
        yongshin = self._get_yongshin(me, strength)

        return NatalInfo(
            saju=saju,
            my_main_element=me,
            element_stats=stats,
            strength=strength,
            yongshin=yongshin,
            sipsin=self._get_sipsin(),
            sibi_unseong=self._get_sibi_unseong(),
            sinsal=self._get_sinsal(),
            personality=me.personality,
        )

    def _get_oheng(self) -> dict[Oheng, int]:
        """팔자 8글자의 오행 분포를 집계한다."""
        palja = self.saju.palja
        elements = (
            Stem.from_char(palja[i]).element if i % 2 == 0 else Branch.from_char(palja[i]).element
            for i in range(8)
        )
        counts = Counter(elements)
        return {o: counts.get(o, 0) for o in Oheng}

    def _get_strength(self, stats: dict[Oheng, int], me: Oheng) -> int:
        """일간 강약을 판단한다. 양수=신강, 0=중화, 음수=신약."""
        helping = stats[me] + stats[me.generated_by]
        draining = sum(stats.values()) - helping
        return helping - draining

    def _get_yongshin(self, me: Oheng, strength: int) -> Oheng:
        """용신(用神)을 선정한다."""
        return me.generates if strength > 0 else me.generated_by

    def _get_sipsin(self) -> list[tuple[str, Sipsin]]:
        """팔자에서 일간을 제외한 7글자의 십신을 분석한다."""
        palja = self.saju.palja
        day_stem_index = 4
        results = []
        for i, char in enumerate(palja):
            if i == day_stem_index:
                continue
            target = Stem.from_char(char) if i % 2 == 0 else Branch.from_char(char)
            results.append((char, Sipsin.of(self.day_stem, target)))
        return results

    def _get_sibi_unseong(self) -> list[tuple[str, SibiUnseong]]:
        """각 기둥 지지의 십이운성을 분석한다."""
        stem = Stem.from_char(self.saju.day_stem)
        return [
            (pillar, SibiUnseong.of(stem, Branch.from_char(pillar[1])))
            for pillar in self.saju.pillars
        ]

    def _get_sinsal(self) -> list[tuple[Branch, Sinsal]]:
        """사주에서 신살·귀인을 찾는다."""
        day_branch = Branch.from_char(self.saju.day_pillar[1])
        all_branches = [Branch.from_char(p[1]) for p in self.saju.pillars]
        return Sinsal.find_all(self.day_stem, day_branch, all_branches)


class PostnatalAnalyzer:
    """후천 분석기 — 사주(四柱)와 시간 정보를 받아 PostnatalInfo를 반환한다."""

    user: User
    natal: NatalInfo
    saju: Saju
    year: int
    seun_ganji: str
    day_stem: Stem

    def __call__(
        self,
        user: User,
        natal: NatalInfo,
        year: int,
    ) -> PostnatalInfo:
        self.user = user
        self.natal = natal
        self.saju = natal.saju
        self.year = year
        self.seun_ganji = year_to_ganji(year)
        self.day_stem = Stem.from_char(self.saju.day_stem)

        seun_stem, seun_branch = self._get_seun()
        daeun = self._get_daeun()
        age = user.age(year)
        current_daeun = self._get_current_daeun(daeun, age)

        return PostnatalInfo(
            year=year,
            seun_stem=seun_stem,
            seun_branch=seun_branch,
            daeun=daeun,
            yongshin_in_seun=self._get_yongshin_check(self.seun_ganji),
            yongshin_in_daeun=self._get_yongshin_check(current_daeun.ganji) if current_daeun else False,
            current_daeun=current_daeun,
            daeun_sipsin=self._get_sipsin(current_daeun.ganji) if current_daeun else [],
            seun_clashes=self._get_clashes(self.seun_ganji),
            seun_combines=self._get_combines(self.seun_ganji),
            daeun_clashes=self._get_clashes(current_daeun.ganji) if current_daeun else [],
            daeun_combines=self._get_combines(current_daeun.ganji) if current_daeun else [],
        )

    def _get_seun(self) -> tuple[tuple[str, Sipsin], tuple[str, Sipsin]]:
        """세운(歲運) 분석: 해당 연도의 간지가 일간에 미치는 영향."""
        g = self.seun_ganji
        return (
            (g[0], Sipsin.of(self.day_stem, Stem.from_char(g[0]))),
            (g[1], Sipsin.of(self.day_stem, Branch.from_char(g[1]))),
        )

    def _get_current_daeun(self, daeun: list[DaeunPeriod], age: int) -> DaeunPeriod | None:
        """현재 나이에 해당하는 대운을 찾는다."""
        for d in daeun:
            if d.start_age <= age <= d.end_age:
                return d
        return None

    def _get_yongshin_check(self, ganji: str) -> bool:
        """간지에 용신 오행이 포함되어 있는지 확인한다."""
        stem_el = Stem.from_char(ganji[0]).element
        branch_el = Branch.from_char(ganji[1]).element
        return self.natal.yongshin in (stem_el, branch_el)

    def _get_sipsin(self, ganji: str) -> list[tuple[str, Sipsin]]:
        """간지의 십신을 계산한다."""
        return [
            (ganji[0], Sipsin.of(self.day_stem, Stem.from_char(ganji[0]))),
            (ganji[1], Sipsin.of(self.day_stem, Branch.from_char(ganji[1]))),
        ]

    def _get_clashes(self, ganji: str) -> list[dict]:
        """간지와 사주 네 기둥 사이의 지지충(衝)을 찾는다."""
        incoming = Branch.from_char(ganji[1])
        results = []
        for i, pillar in enumerate(self.saju.pillars):
            if incoming.clashes.name == pillar[1]:
                results.append({
                    "incoming": incoming.name,
                    "target": pillar[1],
                    "pillar": Pillar.by_order(i).korean,
                })
        return results

    def _get_combines(self, ganji: str) -> list[dict]:
        """간지와 사주 네 기둥 사이의 합(天干合·地支六合)을 찾는다."""
        incoming_stem = Stem.from_char(ganji[0])
        incoming_branch = Branch.from_char(ganji[1])
        results = []
        for i, pillar in enumerate(self.saju.pillars):
            if incoming_stem.combines.name == pillar[0]:
                results.append({
                    "incoming": incoming_stem.name,
                    "target": pillar[0],
                    "pillar": Pillar.by_order(i).korean,
                    "type": "천간합",
                })
            if incoming_branch.combines.name == pillar[1]:
                results.append({
                    "incoming": incoming_branch.name,
                    "target": pillar[1],
                    "pillar": Pillar.by_order(i).korean,
                    "type": "지지합",
                })
        return results

    def _get_daeun(self) -> list[DaeunPeriod]:
        """대운 목록을 생성한다."""
        forward = Stem.from_char(self.saju.year_pillar[0]).is_yang == self.user.gender.is_male
        sequence = self._get_daeun_seq(forward)
        start_age = self._get_start_age(forward)

        return [
            DaeunPeriod(
                ganji=ganji,
                start_age=start_age + i * 10,
                end_age=start_age + i * 10 + 9,
            )
            for i, ganji in enumerate(sequence)
        ]

    def _get_daeun_seq(self, forward: bool, count: int = 8) -> list[str]:
        """대운 순서를 생성한다. 양남/음녀 → 순행, 음남/양녀 → 역행."""
        month_pillar = self.saju.month_pillar
        stem_idx = Stem.from_char(month_pillar[0]).order
        branch_idx = Branch.from_char(month_pillar[1]).order
        step = 1 if forward else -1

        return [
            Stem.by_order(stem_idx + step * i).name
            + Branch.by_order(branch_idx + step * i).name
            for i in range(1, count + 1)
        ]

    def _get_start_age(self, forward: bool) -> int:
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
