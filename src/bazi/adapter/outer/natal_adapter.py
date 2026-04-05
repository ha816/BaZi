from collections import Counter
from datetime import datetime

from sajupy import SajuCalculator, calculate_saju as _sajupy_calculate

from bazi.domain.ganji import Branch, Oheng, Pillar, SibiUnseong, Sipsin, Stem, StemBranch
from bazi.domain.natal import DaeunPeriod, Jeol, NatalInfo, PostnatalInfo, Samjae, Saju, Sinsal
from bazi.domain.user import User
from bazi.application.interpreter.fortune import DOMAIN_MAP
from bazi.application.port.saju_port import NatalPort, PostnatalPort
from bazi.application.util.util import parse_term_time, year_to_ganji


class NatalAdapter(NatalPort):
    """선천 분석기 — NatalPort 구현체."""

    saju: Saju
    day_stem: Stem

    def analyze(self, user: User) -> NatalInfo:
        self.saju = cal_saju(user.birth_dt, city=user.city, longitude=user.longitude)
        self.day_stem = self.saju.stem_of_day_pillar

        stats = self._get_oheng()
        me = self.day_stem.element
        strength = self._get_strength(stats, me)
        yongshin = self._get_yongshin(me, strength)

        return NatalInfo(
            saju=self.saju,
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
        elements = []
        for sb in self.saju.pillars.values():
            elements.append(sb.stem.element)
            elements.append(sb.branch.element)
        counts = Counter(elements)
        return {o: counts.get(o, 0) for o in Oheng}

    def _get_strength(self, stats: dict[Oheng, int], me: Oheng) -> int:
        helping = stats[me] + stats[me.generated_by]
        draining = sum(stats.values()) - helping
        return helping - draining

    def _get_yongshin(self, me: Oheng, strength: int) -> Oheng:
        return me.generates if strength > 0 else me.generated_by

    def _get_sipsin(self) -> list[tuple[str, Sipsin]]:
        results = []
        for pillar_type, sb in self.saju.pillars.items():
            if pillar_type != Pillar.日柱:
                results.append((sb.stem.name, Sipsin.of(self.day_stem, sb.stem)))
            results.append((sb.branch.name, Sipsin.of(self.day_stem, sb.branch)))
        return results

    def _get_sibi_unseong(self) -> list[tuple[str, SibiUnseong]]:
        stem = self.saju.stem_of_day_pillar
        return [
            (str(sb), SibiUnseong.of(stem, sb.branch))
            for sb in self.saju.pillars.values()
        ]

    def _get_sinsal(self) -> list[tuple[Branch, Sinsal]]:
        day_branch = self.saju[Pillar.日柱].branch
        all_branches = [sb.branch for sb in self.saju.pillars.values()]
        return (
            Sinsal.get_samhap(day_branch, all_branches)
            + Sinsal.get_guiin(self.day_stem, all_branches)
            + Sinsal.get_baekho(day_branch, all_branches)
        )


class PostnatalAdapter(PostnatalPort):
    """후천 분석기 — PostnatalPort 구현체."""

    user: User
    natal: NatalInfo
    year: int
    seun_ganji: str
    day_stem: Stem

    def analyze(self, user: User, natal: NatalInfo, year: int) -> PostnatalInfo:
        self.user = user
        self.natal = natal
        self.year = year
        self.seun_ganji = year_to_ganji(year)
        self.day_stem = natal.saju.stem_of_day_pillar

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
            domain_scores=self._get_domain_scores(seun_stem, seun_branch, current_daeun),
            samjae=self._get_samjae(),
        )

    def _get_seun(self) -> tuple[tuple[str, Sipsin], tuple[str, Sipsin]]:
        g = self.seun_ganji
        return (
            (g[0], Sipsin.of(self.day_stem, Stem.from_char(g[0]))),
            (g[1], Sipsin.of(self.day_stem, Branch.from_char(g[1]))),
        )

    def _get_current_daeun(self, daeun: list[DaeunPeriod], age: int) -> DaeunPeriod | None:
        for d in daeun:
            if d.start_age <= age <= d.end_age:
                return d
        return None

    def _get_yongshin_check(self, ganji: str) -> bool:
        stem_el = Stem.from_char(ganji[0]).element
        branch_el = Branch.from_char(ganji[1]).element
        return self.natal.yongshin in (stem_el, branch_el)

    def _get_sipsin(self, ganji: str) -> list[tuple[str, Sipsin]]:
        return [
            (ganji[0], Sipsin.of(self.day_stem, Stem.from_char(ganji[0]))),
            (ganji[1], Sipsin.of(self.day_stem, Branch.from_char(ganji[1]))),
        ]

    def _get_clashes(self, ganji: str) -> list[dict]:
        incoming = Branch.from_char(ganji[1])
        results = []
        for pillar_type, sb in zip(Pillar, list(self.natal.saju.pillars.values())):
            if incoming.clashes == sb.branch:
                results.append({
                    "incoming": incoming.name,
                    "target": sb.branch.name,
                    "pillar": pillar_type.korean,
                })
        return results

    def _get_combines(self, ganji: str) -> list[dict]:
        incoming_stem = Stem.from_char(ganji[0])
        incoming_branch = Branch.from_char(ganji[1])
        results = []
        for pillar_type, sb in zip(Pillar, list(self.natal.saju.pillars.values())):
            if incoming_stem.combines == sb.stem:
                results.append({
                    "incoming": incoming_stem.name,
                    "target": sb.stem.name,
                    "pillar": pillar_type.korean,
                    "type": "천간합",
                })
            if incoming_branch.combines == sb.branch:
                results.append({
                    "incoming": incoming_branch.name,
                    "target": sb.branch.name,
                    "pillar": pillar_type.korean,
                    "type": "지지합",
                })
        return results

    def _get_domain_scores(
        self,
        seun_stem: tuple[str, Sipsin],
        seun_branch: tuple[str, Sipsin],
        current_daeun: DaeunPeriod | None,
    ) -> dict[str, dict]:
        seun_sipsins = [seun_stem[1], seun_branch[1]]
        daeun_sipsins = [s for _, s in self._get_sipsin(current_daeun.ganji)] if current_daeun else []
        scores = {}
        for domain_name, domain_sipsins in DOMAIN_MAP.items():
            seun_matches = [s for s in seun_sipsins if s in domain_sipsins]
            daeun_matches = [s for s in daeun_sipsins if s in domain_sipsins]
            score = len(seun_matches) * 2 + len(daeun_matches)
            level = "high" if score >= 3 else "medium" if score >= 1 else "low"
            reason = _make_domain_reason(seun_matches, daeun_matches)
            scores[domain_name] = {"score": score, "level": level, "reason": reason}
        return scores

    def _get_samjae(self) -> dict | None:
        year_branch = self.natal.saju.pillars[Pillar.年柱].branch
        seun_branch = Branch.from_char(self.seun_ganji[1])
        for group, (entering, sitting, leaving) in Samjae.samjae_map().items():
            if year_branch in group:
                samjae_branches = (entering, sitting, leaving)
                if seun_branch in samjae_branches:
                    idx = samjae_branches.index(seun_branch)
                    return {
                        "type": Samjae.by_order(idx).value,
                        "year_branch": seun_branch.name,
                        "birth_branch": year_branch.name,
                    }
                break
        return None

    def _get_daeun(self) -> list[DaeunPeriod]:
        forward = self.natal.saju.pillars[Pillar.年柱].stem.is_yang == self.user.gender.is_male
        sequence = self._get_daeun_seq(forward)
        start_age = self._get_start_age(forward)
        yongshin = self.natal.yongshin

        return [
            DaeunPeriod(
                ganji=ganji,
                start_age=start_age + i * 10,
                end_age=start_age + i * 10 + 9,
                has_yongshin=yongshin in (
                    Stem.from_char(ganji[0]).element,
                    Branch.from_char(ganji[1]).element,
                ),
            )
            for i, ganji in enumerate(sequence)
        ]

    def _get_daeun_seq(self, forward: bool, count: int = 8) -> list[str]:
        month = self.natal.saju.pillars[Pillar.月柱]
        stem_idx = month.stem.order
        branch_idx = month.branch.order
        step = 1 if forward else -1

        return [
            Stem.by_order(stem_idx + step * i).name
            + Branch.by_order(branch_idx + step * i).name
            for i in range(1, count + 1)
        ]

    def _get_start_age(self, forward: bool) -> int:
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



_SIPSIN_KO: dict[Sipsin, str] = {
    Sipsin.比肩: "비견(比肩)",
    Sipsin.劫財: "겁재(劫財)",
    Sipsin.食神: "식신(食神)",
    Sipsin.傷官: "상관(傷官)",
    Sipsin.偏財: "편재(偏財)",
    Sipsin.正財: "정재(正財)",
    Sipsin.偏官: "편관(偏官)",
    Sipsin.正官: "정관(正官)",
    Sipsin.偏印: "편인(偏印)",
    Sipsin.正印: "정인(正印)",
}


def _make_domain_reason(seun: list[Sipsin], daeun: list[Sipsin]) -> str:
    seun_names = list(dict.fromkeys(_SIPSIN_KO[s] for s in seun))
    daeun_names = list(dict.fromkeys(_SIPSIN_KO[s] for s in daeun))

    if seun_names and daeun_names:
        return f"세운 {', '.join(seun_names)}과 대운 {', '.join(daeun_names)}이 겹쳐 작용합니다."
    if seun_names:
        return f"세운에 {', '.join(seun_names)}이 들어옵니다."
    if daeun_names:
        return f"대운 {', '.join(daeun_names)}의 흐름 속에 있습니다."
    return "이번 해는 이 영역에 직접적인 기운의 작용이 없습니다."


def cal_saju(
    birth_dt: datetime,
    city: str = "Seoul",
    longitude: float | None = None,
    use_solar_time: bool = True,
) -> Saju:
    """sajupy를 호출하여 도메인 Saju 객체를 생성한다."""
    result = _sajupy_calculate(
        year=birth_dt.year, month=birth_dt.month, day=birth_dt.day,
        hour=birth_dt.hour, minute=birth_dt.minute,
        city=None if longitude is not None else city,
        longitude=longitude,
        use_solar_time=use_solar_time,
    )
    return Saju(
        year=StemBranch.from_text(result["year_pillar"]),
        month=StemBranch.from_text(result["month_pillar"]),
        day=StemBranch.from_text(result["day_pillar"]),
        hour=StemBranch.from_text(result["hour_pillar"]),
    )