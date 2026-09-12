from datetime import datetime

from sajupy import SajuCalculator

from kkachi.adapter.outer.natal_adapter import cal_saju
from kkachi.application.interpreter.fortune import DOMAIN_MAP
from kkachi.application.port.saju_port import PostnatalPort
from kkachi.application.util.clash_combine_meta import (
    enrich_branch_combine,
    enrich_clash,
    enrich_stem_combine,
)
from kkachi.application.util.sipsin_meta import (
    enrich_sipsin,
    sipsin_polarity,
    sipsin_strength_modifier,
)
from kkachi.application.util.util import parse_term_time, year_to_ganji
from kkachi.domain.ganji import Branch, Pillar, Sipsin, Stem
from kkachi.domain.natal import DaeunPeriod, Jeol, NatalInfo, PostnatalInfo, Samjae
from kkachi.domain.user import User

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
        return f"세운(歲運) {' '.join(seun_names)} · 대운(大運) {' '.join(daeun_names)}이 겹쳐 작용합니다."
    if seun_names:
        return f"세운(歲運) {' '.join(seun_names)}이 들어옵니다."
    if daeun_names:
        return f"대운(大運) {' '.join(daeun_names)}의 흐름 속에 있습니다."
    return "별다른 작용 없이 잔잔합니다."


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
            upcoming_months=self._get_upcoming_months(),
        )

    def _get_upcoming_months(self, count: int = 12) -> list[dict]:
        """이번달 포함 count개월 ganji 정보 + 일간 십신 + 용신 매칭 반환."""
        yongshin = self.natal.yongshin
        day_stem = self.natal.saju.stem_of_day_pillar
        me_yang = day_stem.is_yang
        anchor = max(datetime.now(), datetime(self.year, 1, 1))
        results: list[dict] = []
        for offset in range(count):
            target_year = anchor.year + (anchor.month - 1 + offset) // 12
            target_month = (anchor.month - 1 + offset) % 12 + 1
            probe = datetime(target_year, target_month, 15, 12, 0)
            saju = cal_saju(probe, city=self.user.city, longitude=self.user.longitude)
            month_pillar = saju[Pillar.月柱]
            stem_el = month_pillar.stem.element
            branch_el = month_pillar.branch.element
            stem_sipsin = Sipsin.of(day_stem, month_pillar.stem)
            branch_sipsin = Sipsin.of(day_stem, month_pillar.branch)
            results.append({
                "year": target_year,
                "month": target_month,
                "ganji": str(month_pillar),
                "stem_element": stem_el.name,
                "branch_element": branch_el.name,
                "stem_sipsin": enrich_sipsin(
                    stem_sipsin, month_pillar.stem.name, stem_el.name,
                    me_yang=me_yang, include_meaning=True,
                ),
                "branch_sipsin": enrich_sipsin(
                    branch_sipsin, month_pillar.branch.name, branch_el.name,
                    me_yang=me_yang, include_meaning=True,
                ),
                "matches_yongshin": yongshin in (stem_el, branch_el),
            })
        return results

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
        return [
            enrich_clash(target=sb.branch, incoming=incoming, pillar=pillar_type.korean)
            for pillar_type, sb in self.natal.saju.pillars.items()
            if incoming.clashes == sb.branch
        ]

    def _get_combines(self, ganji: str) -> list[dict]:
        incoming_stem = Stem.from_char(ganji[0])
        incoming_branch = Branch.from_char(ganji[1])
        results: list[dict] = []
        for pillar_type, sb in self.natal.saju.pillars.items():
            if incoming_stem.combines == sb.stem:
                results.append(enrich_stem_combine(
                    target=sb.stem, incoming=incoming_stem, pillar=pillar_type.korean,
                ))
            if incoming_branch.combines == sb.branch:
                results.append(enrich_branch_combine(
                    target=sb.branch, incoming=incoming_branch, pillar=pillar_type.korean,
                ))
        return results

    def _get_domain_scores(
        self,
        seun_stem: tuple[str, Sipsin],
        seun_branch: tuple[str, Sipsin],
        current_daeun: DaeunPeriod | None,
    ) -> dict[str, dict]:
        seun_sipsins = [seun_stem[1], seun_branch[1]]
        daeun_sipsins = [s for _, s in self._get_sipsin(current_daeun.ganji)] if current_daeun else []
        strength = self.natal.strength
        scores = {}
        for domain_name, domain_sipsins in DOMAIN_MAP.items():
            seun_matches = [s for s in seun_sipsins if s in domain_sipsins]
            daeun_matches = [s for s in daeun_sipsins if s in domain_sipsins]
            score = 50
            for s in seun_matches:
                score += sipsin_polarity(s) * 5 + sipsin_strength_modifier(s, strength) * 3
            for s in daeun_matches:
                score += sipsin_polarity(s) * 3 + sipsin_strength_modifier(s, strength) * 2
            score = max(0, min(100, score))
            level = "high" if score >= 65 else "medium" if score >= 35 else "low"
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

    def _get_daeun_seq(self, forward: bool, count: int = 10) -> list[str]:
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
