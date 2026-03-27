"""종합 해석: NatalInfo + PostnatalInfo를 조합하여 규칙 기반 해석을 생성한다."""

from dataclasses import dataclass, field

from bazi.domain.natal import DaeunPeriod, NatalInfo, Pillar, PostnatalInfo, Sinsal
from bazi.domain.ganji import Branch, Oheng, SibiUnseong, Sipsin, Stem, lookup
from bazi.domain.user import User
from bazi.domain.util import year_to_ganji


@dataclass
class Interpretation:
    """종합 해석 결과"""
    # 용신 충족
    yongshin: Oheng
    yongshin_in_seun: bool
    yongshin_in_daeun: bool

    # 세운 해석
    seun_sipsin: list[tuple[str, Sipsin]]

    # 현재 대운 해석
    current_daeun: DaeunPeriod | None
    daeun_sipsin: list[tuple[str, Sipsin]]

    # 십이운성·신살
    sibi_unseong: list[tuple[str, SibiUnseong]]
    sinsal: list[tuple[Branch, Sinsal]]

    # 충·합
    seun_clashes: list[dict]
    seun_combines: list[dict]
    daeun_clashes: list[dict]
    daeun_combines: list[dict]

    # 종합 문장
    summary: list[str] = field(default_factory=list)


class Interpreter:
    """종합 해석기 — 선천 + 후천 데이터를 조합하여 Interpretation을 반환한다."""

    def __call__(
        self,
        user: User,
        natal: NatalInfo,
        postnatal: PostnatalInfo,
    ) -> Interpretation:
        self.user = user
        self.natal = natal
        self.postnatal = postnatal
        self.seun_ganji = year_to_ganji(postnatal.year)
        self.age = user.age(postnatal.year)

        # 1. 용신 충족
        self.current_daeun = self._get_current_daeun()
        yongshin_in_seun = self._check_yongshin(self.seun_ganji)
        yongshin_in_daeun = self._check_yongshin(self.current_daeun.ganji) if self.current_daeun else False

        # 2. 십신 해석
        seun_sipsin = [postnatal.seun_stem, postnatal.seun_branch]
        daeun_sipsin = self._calc_sipsin(self.current_daeun.ganji) if self.current_daeun else []

        # 3. 충·합
        seun_clashes = self._find_clashes(self.seun_ganji)
        seun_combines = self._find_combines(self.seun_ganji)
        daeun_clashes = self._find_clashes(self.current_daeun.ganji) if self.current_daeun else []
        daeun_combines = self._find_combines(self.current_daeun.ganji) if self.current_daeun else []

        # 종합 문장 생성
        summary = self._build_summary(
            yongshin_in_seun, yongshin_in_daeun,
            seun_sipsin, daeun_sipsin,
            seun_clashes, seun_combines,
            daeun_clashes, daeun_combines,
        )

        return Interpretation(
            yongshin=natal.yongshin,
            yongshin_in_seun=yongshin_in_seun,
            yongshin_in_daeun=yongshin_in_daeun,
            seun_sipsin=seun_sipsin,
            current_daeun=self.current_daeun,
            daeun_sipsin=daeun_sipsin,
            sibi_unseong=natal.sibi_unseong,
            sinsal=natal.sinsal,
            seun_clashes=seun_clashes,
            seun_combines=seun_combines,
            daeun_clashes=daeun_clashes,
            daeun_combines=daeun_combines,
            summary=summary,
        )

    def _get_current_daeun(self) -> DaeunPeriod | None:
        """현재 나이에 해당하는 대운을 찾는다."""
        for d in self.postnatal.daeun:
            if d.start_age <= self.age <= d.end_age:
                return d
        return None

    def _check_yongshin(self, ganji: str) -> bool:
        """간지에 용신 오행이 포함되어 있는지 확인한다."""
        return any(lookup(ch).element == self.natal.yongshin for ch in ganji)

    def _calc_sipsin(self, ganji: str) -> list[tuple[str, Sipsin]]:
        """간지의 십신을 계산한다."""
        ds = lookup(self.natal.saju.day_stem)
        return [(ch, Sipsin.of(ds, lookup(ch))) for ch in ganji]

    def _find_clashes(self, ganji: str) -> list[dict]:
        """간지와 사주 네 기둥 사이의 지지충(衝)을 찾는다."""
        incoming = Branch[ganji[1]]
        results = []

        for i, pillar in enumerate(self.natal.saju.pillars):
            if incoming.clashes.name == pillar[1]:
                results.append({
                    "incoming": incoming.name,
                    "target": pillar[1],
                    "pillar": Pillar.by_order(i).korean,
                })

        return results

    def _find_combines(self, ganji: str) -> list[dict]:
        """간지와 사주 네 기둥 사이의 합(天干合·地支六合)을 찾는다."""
        incoming_stem = Stem[ganji[0]]
        incoming_branch = Branch[ganji[1]]
        results = []

        for i, pillar in enumerate(self.natal.saju.pillars):
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

    def _build_summary(
        self,
        yongshin_in_seun: bool,
        yongshin_in_daeun: bool,
        seun_sipsin: list[tuple[str, Sipsin]],
        daeun_sipsin: list[tuple[str, Sipsin]],
        seun_clashes: list[dict],
        seun_combines: list[dict],
        daeun_clashes: list[dict],
        daeun_combines: list[dict],
    ) -> list[str]:
        """규칙 기반으로 종합 해석 문장을 생성한다."""
        lines = []
        yongshin = self.natal.yongshin
        year = self.postnatal.year
        current_daeun = self.current_daeun

        # 용신 충족
        if yongshin_in_seun and yongshin_in_daeun:
            lines.append(f"{year}년은 세운과 대운 모두 용신({yongshin.name})이 작용하여 매우 유리한 해입니다.")
        elif yongshin_in_seun:
            lines.append(f"{year}년 세운에 용신({yongshin.name})이 있어 올해의 기회를 잘 살릴 수 있습니다.")
        elif yongshin_in_daeun:
            lines.append(f"대운에 용신({yongshin.name})이 있어 큰 흐름은 좋으나, {year}년 세운에는 용신이 부재합니다.")
        else:
            lines.append(f"{year}년은 세운과 대운 모두 용신({yongshin.name})이 없어 신중한 판단이 필요합니다.")

        # 세운 십신 해석
        for char, s in seun_sipsin:
            lines.append(f"세운 {char}({s.name}): {s.domain} 방면에 변화가 예상됩니다.")

        # 대운 십신 해석
        if current_daeun and daeun_sipsin:
            lines.append(f"현재 대운 {current_daeun.ganji}({current_daeun.start_age}~{current_daeun.end_age}세):")
            for char, s in daeun_sipsin:
                lines.append(f"  대운 {char}({s.name}): {s.domain} 방면의 큰 흐름이 작용합니다.")

        # 십이운성 (일주 기준)
        if self.natal.sibi_unseong:
            day_pillar, day_unseong = self.natal.sibi_unseong[2]  # 일주
            lines.append(f"일주 십이운성은 {day_unseong.name}({day_unseong.meaning})입니다.")

        # 신살
        for branch, s in self.natal.sinsal:
            lines.append(f"사주에 {s.korean}({branch.name})이(가) 있습니다: {s.meaning}.")

        # 충
        for clash in seun_clashes:
            lines.append(f"주의: 세운 {clash['incoming']}이(가) {clash['pillar']} {clash['target']}과(와) 충(衝)합니다. 변동·갈등에 유의하세요.")
        for clash in daeun_clashes:
            lines.append(f"주의: 대운 {clash['incoming']}이(가) {clash['pillar']} {clash['target']}과(와) 충(衝)합니다. 이 시기 큰 변화가 있을 수 있습니다.")

        # 합
        for combine in seun_combines:
            lines.append(f"세운 {combine['incoming']}이(가) {combine['pillar']} {combine['target']}과(와) {combine['type']}합니다. 새로운 인연·협력이 기대됩니다.")
        for combine in daeun_combines:
            lines.append(f"대운 {combine['incoming']}이(가) {combine['pillar']} {combine['target']}과(와) {combine['type']}합니다. 장기적 관계·변화가 예상됩니다.")

        return lines
