"""운세 분석 (대운, 세운 등 시간에 따라 변하는 운)"""

from dataclasses import dataclass
from datetime import datetime

from sajupy import SajuCalculator

from bazi.application.natal import NatalInfo
from bazi.domain.fortune import Jeol, Pillar
from bazi.domain.ganji import Branch, Stem, lookup
from bazi.domain.sipsin import Sipsin
from bazi.domain.util import parse_term_time, year_to_ganji


@dataclass
class DaeunPeriod:
    """대운 하나의 기간 정보"""
    ganji: str
    start_age: int
    end_age: int


class FortuneChart:
    """운세 분석기 (대운·세운)"""

    def __init__(
        self,
        natal: NatalInfo,
        year: int,
        is_male: bool,
        birth_year: int,
        birth_month: int,
        birth_day: int,
        birth_hour: int,
        birth_minute: int = 0,
    ):
        self.natal = natal
        self.year = year
        self.is_male = is_male

        self.seun_ganji = year_to_ganji(year)
        self.seun = self._calc_seun()
        self.daeun = self._calc_daeun(
            birth_year, birth_month, birth_day, birth_hour, birth_minute,
        )

    def _calc_seun(self) -> list[tuple[str, str]]:
        """세운(歲運) 분석: 해당 연도의 간지가 일간에 미치는 영향."""
        ds = self.natal.saju.day_stem
        return [
            (self.seun_ganji[0], Sipsin.of(ds, self.seun_ganji[0]).name),
            (self.seun_ganji[1], Sipsin.of(ds, self.seun_ganji[1]).name),
        ]

    def _calc_daeun(
        self,
        birth_year: int,
        birth_month: int,
        birth_day: int,
        birth_hour: int,
        birth_minute: int,
    ) -> list[DaeunPeriod]:
        """대운 목록을 생성한다."""
        year_stem = self.natal.saju.year_pillar[0]
        sequence = self._get_daeun_sequence(year_stem)
        start_age = self._calc_start_age(
            birth_year, birth_month, birth_day, birth_hour, birth_minute, year_stem,
        )

        return [
            DaeunPeriod(
                ganji=ganji,
                start_age=start_age + i * 10,
                end_age=start_age + i * 10 + 9,
            )
            for i, ganji in enumerate(sequence)
        ]

    def _get_daeun_sequence(self, year_stem: str, count: int = 8) -> list[str]:
        """
        대운 순서를 생성한다.
        양남/음녀 → 순행, 음남/양녀 → 역행.
        """
        is_yang = Stem[year_stem].is_yang
        forward = is_yang == self.is_male

        month_pillar = self.natal.saju.month_pillar
        stem_idx = Stem[month_pillar[0]].order
        branch_idx = Branch[month_pillar[1]].order
        step = 1 if forward else -1

        return [
            Stem.by_order(stem_idx + step * i).name
            + Branch.by_order(branch_idx + step * i).name
            for i in range(1, count + 1)
        ]

    def _calc_start_age(
        self,
        birth_year: int,
        birth_month: int,
        birth_day: int,
        birth_hour: int,
        birth_minute: int,
        year_stem: str,
    ) -> int:
        """
        대운 시작 나이를 계산한다.
        생일에서 가장 가까운 절(節)까지의 일수 ÷ 3.
        순행이면 다음 절, 역행이면 이전 절.
        """
        is_yang = Stem[year_stem].is_yang
        forward = is_yang == self.is_male
        birth_dt = datetime(birth_year, birth_month, birth_day, birth_hour, birth_minute)

        calc = SajuCalculator()
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

    # ── 해석 메서드 ──

    def get_current_daeun(self, age: int) -> DaeunPeriod | None:
        """현재 나이에 해당하는 대운을 찾는다."""
        for daeun in self.daeun:
            if daeun.start_age <= age <= daeun.end_age:
                return daeun
        return None

    def check_yongshin_in_seun(self) -> bool:
        """세운에 용신 오행이 포함되어 있는지 확인한다."""
        yongshin = self.natal.yongshin
        return any(lookup(ch).element.name == yongshin for ch in self.seun_ganji)

    def check_yongshin_in_daeun(self, daeun: DaeunPeriod) -> bool:
        """대운에 용신 오행이 포함되어 있는지 확인한다."""
        yongshin = self.natal.yongshin
        return any(lookup(ch).element.name == yongshin for ch in daeun.ganji)

    def get_seun_sipsin_domains(self) -> list[dict]:
        """세운 십신의 영역 해석을 반환한다."""
        return [
            {"char": char, "sipsin": sipsin, "domain": Sipsin[sipsin].domain}
            for char, sipsin in self.seun
        ]

    def get_daeun_sipsin_domains(self, daeun: DaeunPeriod) -> list[dict]:
        """대운 간지의 십신 영역 해석을 반환한다."""
        ds = self.natal.saju.day_stem
        return [
            {
                "char": ch,
                "sipsin": (s := Sipsin.of(ds, ch)).name,
                "domain": s.domain,
            }
            for ch in daeun.ganji
        ]

    def find_clashes(self, ganji: str) -> list[dict]:
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

    def find_combines(self, ganji: str) -> list[dict]:
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
