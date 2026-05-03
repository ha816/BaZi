from collections import Counter
from datetime import datetime

from sajupy import SajuCalculator, calculate_saju as _sajupy_calculate

from kkachi.domain.ganji import Branch, Gongmang, Oheng, Pillar, SibiUnseong, Sipsin, Stem, StemBranch
from kkachi.domain.natal import DaeunPeriod, Jeol, NatalInfo, PostnatalInfo, Samjae, Saju, Sinsal
from kkachi.domain.user import User
from kkachi.application.interpreter.fortune import DOMAIN_MAP
from kkachi.application.port.saju_port import NatalPort, PostnatalPort
from kkachi.application.util.util import parse_term_time, year_to_ganji


_SIBI_SINSAL_MAP: list[tuple[frozenset[Branch], dict[Branch, str]]] = [
    (frozenset({Branch.申, Branch.子, Branch.辰}), {
        Branch.巳: "겁살", Branch.午: "재살", Branch.未: "천살",
        Branch.申: "지살", Branch.酉: "년살", Branch.戌: "월살",
        Branch.亥: "망신살", Branch.子: "장성살", Branch.丑: "반안살",
        Branch.寅: "역마살", Branch.卯: "육해살", Branch.辰: "화개살",
    }),
    (frozenset({Branch.亥, Branch.卯, Branch.未}), {
        Branch.申: "겁살", Branch.酉: "재살", Branch.戌: "천살",
        Branch.亥: "지살", Branch.子: "년살", Branch.丑: "월살",
        Branch.寅: "망신살", Branch.卯: "장성살", Branch.辰: "반안살",
        Branch.巳: "역마살", Branch.午: "육해살", Branch.未: "화개살",
    }),
    (frozenset({Branch.寅, Branch.午, Branch.戌}), {
        Branch.亥: "겁살", Branch.子: "재살", Branch.丑: "천살",
        Branch.寅: "지살", Branch.卯: "년살", Branch.辰: "월살",
        Branch.巳: "망신살", Branch.午: "장성살", Branch.未: "반안살",
        Branch.申: "역마살", Branch.酉: "육해살", Branch.戌: "화개살",
    }),
    (frozenset({Branch.巳, Branch.酉, Branch.丑}), {
        Branch.寅: "겁살", Branch.卯: "재살", Branch.辰: "천살",
        Branch.巳: "지살", Branch.午: "년살", Branch.未: "월살",
        Branch.申: "망신살", Branch.酉: "장성살", Branch.戌: "반안살",
        Branch.亥: "역마살", Branch.子: "육해살", Branch.丑: "화개살",
    }),
]


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

        day_branch = self.saju[Pillar.日柱].branch
        gongmang_set = Gongmang.from_day_pillar(self.day_stem, day_branch)

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
            jizan_gan=self._get_jizan_gan(),
            sibi_sinsal=self._get_sibi_sinsal(),
            gongmang=[sb.branch in gongmang_set for sb in self.saju.pillars.values()],
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
        _LABELS = {
            Pillar.年柱: "년주", Pillar.月柱: "월주",
            Pillar.日柱: "일주", Pillar.時柱: "시주",
        }
        stem = self.saju.stem_of_day_pillar
        return [
            (_LABELS[pillar], SibiUnseong.of(stem, sb.branch))
            for pillar, sb in self.saju.pillars.items()
        ]

    def _get_jizan_gan(self) -> list[list[tuple[str, Sipsin, int, str]]]:
        return [
            [
                (s.name, Sipsin.of(self.day_stem, s), w, role)
                for s, w, role in zip(
                    sb.branch.jizan_gan,
                    sb.branch.jizan_gan_weights,
                    sb.branch.jizan_gan_roles,
                    strict=True,
                )
            ]
            for sb in self.saju.pillars.values()
        ]

    def _get_sibi_sinsal(self) -> list[str]:
        day_branch = self.saju[Pillar.日柱].branch
        for group, mapping in _SIBI_SINSAL_MAP:
            if day_branch in group:
                return [mapping.get(sb.branch, "") for sb in self.saju.pillars.values()]
        return [""] * 4

    def _get_sinsal(self) -> list[tuple[Branch, Sinsal]]:
        day_branch = self.saju[Pillar.日柱].branch
        month_branch = self.saju[Pillar.月柱].branch
        all_branches = [sb.branch for sb in self.saju.pillars.values()]
        all_stems = [sb.stem for sb in self.saju.pillars.values()]
        return (
            Sinsal.get_samhap(day_branch, all_branches)
            + Sinsal.get_guiin(self.day_stem, all_branches)
            + Sinsal.get_baekho(day_branch, all_branches)
            + Sinsal.get_woldeok(month_branch, all_stems)
            + Sinsal.get_cheondeok(month_branch, all_stems, all_branches)
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
            upcoming_months=self._get_upcoming_months(),
        )

    def _get_upcoming_months(self, count: int = 6) -> list[dict]:
        """이번달 포함 count개월 ganji 정보 + 일간 십신 + 용신 매칭 반환."""
        yongshin = self.natal.yongshin
        day_stem = self.natal.saju.stem_of_day_pillar
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
                "stem_sipsin": {"name": stem_sipsin.name, "domain": stem_sipsin.domain},
                "branch_sipsin": {"name": branch_sipsin.name, "domain": branch_sipsin.domain},
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