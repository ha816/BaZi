from collections import Counter
from datetime import datetime

from sajupy import calculate_saju as _sajupy_calculate

from kkachi.application.port.saju_port import NatalPort
from kkachi.domain.ganji import (
    Branch,
    Gongmang,
    Oheng,
    Pillar,
    SibiUnseong,
    Sipsin,
    Stem,
    StemBranch,
)
from kkachi.domain.natal import NatalInfo, Saju, Sinsal
from kkachi.domain.user import User

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
        self.saju = cal_saju(user.birth_dt, city=user.city, longitude=user.longitude, include_hour=not user.hour_unknown)
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


_CITY_LONGITUDE: dict[str, float] = {
    # 한국
    "seoul": 126.978, "서울": 126.978, "서울특별시": 126.978,
    "busan": 129.075, "부산": 129.075, "부산광역시": 129.075,
    "incheon": 126.705, "인천": 126.705, "인천광역시": 126.705,
    "daegu": 128.601, "대구": 128.601, "대구광역시": 128.601,
    "daejeon": 127.385, "대전": 127.385, "대전광역시": 127.385,
    "gwangju": 126.851, "광주": 126.851, "광주광역시": 126.851,
    "ulsan": 129.312, "울산": 129.312, "울산광역시": 129.312,
    "suwon": 127.009, "수원": 127.009,
    "jeju": 126.531, "제주": 126.531, "제주시": 126.531,
    # 주요 해외 도시
    "new york": -74.006, "los angeles": -118.244, "london": -0.118,
    "tokyo": 139.692, "beijing": 116.407, "shanghai": 121.474,
    "paris": 2.347, "berlin": 13.405, "sydney": 151.209,
    "singapore": 103.820, "hong kong": 114.158,
}


def _resolve_longitude(city: str, longitude: float | None) -> float:
    """longitude가 없으면 내부 룩업, 그것도 없으면 서울 경도.

    sajupy에 city를 넘기면 Nominatim을 동기 호출해 이벤트 루프를 막고 429로 멈추므로 항상 경도만 넘긴다.
    """
    if longitude is not None:
        return longitude
    return _CITY_LONGITUDE.get(city.strip().lower(), _CITY_LONGITUDE["seoul"])


def cal_saju(
    birth_dt: datetime,
    city: str = "Seoul",
    longitude: float | None = None,
    use_solar_time: bool = True,
    include_hour: bool = True,
) -> Saju:
    """sajupy를 호출하여 도메인 Saju 객체를 생성한다.

    sajupy는 시각이 필수라 미상이어도 birth_dt(프론트 기본 정오)로 계산하고, include_hour=False면 시주만 버린다.
    정오 기준이면 자시(子時) 경계에 걸리지 않아 일주(日柱)는 안전하다.
    """
    result = _sajupy_calculate(
        year=birth_dt.year, month=birth_dt.month, day=birth_dt.day,
        hour=birth_dt.hour, minute=birth_dt.minute,
        longitude=_resolve_longitude(city, longitude),
        use_solar_time=use_solar_time,
    )
    return Saju(
        year=StemBranch.from_text(result["year_pillar"]),
        month=StemBranch.from_text(result["month_pillar"]),
        day=StemBranch.from_text(result["day_pillar"]),
        hour=StemBranch.from_text(result["hour_pillar"]) if include_hour else None,
    )
