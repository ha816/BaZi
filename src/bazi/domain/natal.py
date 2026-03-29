from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from sajupy import calculate_saju as _sajupy_calculate

from bazi.domain.ganji import Branch, Oheng, SibiUnseong, Sipsin, Stem


class Saju:
    """사주(四柱) - 년주·월주·일주·시주, 생년월일시를 간지로 나타낸 4개의 기둥.

    각 기둥은 천간(天干)+지지(地支) 두 글자로 이루어진 간지(干支) 문자열이다.
    """

    def __init__(
        self,
        year: int, month: int, day: int,
        hour: int, minute: int = 0,
        city: str = "Seoul",
        use_solar_time: bool = True,
    ):
        result = _sajupy_calculate(
            year=year, month=month, day=day,
            hour=hour, minute=minute, city=city,
            use_solar_time=use_solar_time,
        )
        self.year_pillar: str = result["year_pillar"]
        self.month_pillar: str = result["month_pillar"]
        self.day_pillar: str = result["day_pillar"]
        self.hour_pillar: str = result["hour_pillar"]

    @property
    def pillars(self) -> list[str]:
        return [self.year_pillar, self.month_pillar, self.day_pillar, self.hour_pillar]

    @property
    def day_stem(self) -> str:
        """일간(日干) - 일주의 천간."""
        return self.day_pillar[0]

    @property
    def palja(self) -> str:
        """팔자(八字) - 8글자 전체."""
        return "".join(self.pillars)


class Pillar(Enum):
    """사주의 네 기둥(四柱).

    order는 기둥의 위치(0~3), korean은 한글 이름이다.
    """

    年柱 = (0, "년주")  # 연주 - 태어난 해
    月柱 = (1, "월주")  # 월주 - 태어난 달
    日柱 = (2, "일주")  # 일주 - 태어난 날
    時柱 = (3, "시주")  # 시주 - 태어난 시

    def __init__(self, order: int, korean: str):
        self.order = order
        self.korean = korean

    @classmethod
    def by_order(cls, index: int) -> "Pillar":
        """인덱스(0~3)로 기둥을 찾는다."""
        return list(cls)[index]


class Jeol(Enum):
    """절(節) - 절기(節氣) 중 각 월의 시작을 알리는 12개.

    절기는 태양의 위치에 따라 1년을 24등분한 것이며,
    절(節) 12개는 각 월의 시작점으로 대운 계산의 기준이 된다.
    value는 sajupy에서 사용하는 한글 이름이다.
    """

    小寒 = "소한"  # 1월절 - 추위가 작아지기 시작
    立春 = "입춘"  # 2월절 - 봄의 시작
    驚蟄 = "경칩"  # 3월절 - 개구리가 깨어남
    清明 = "청명"  # 4월절 - 하늘이 맑고 밝음
    立夏 = "입하"  # 5월절 - 여름의 시작
    芒種 = "망종"  # 6월절 - 씨 뿌릴 때
    小暑 = "소서"  # 7월절 - 더위가 작아지기 시작
    立秋 = "입추"  # 8월절 - 가을의 시작
    白露 = "백로"  # 9월절 - 이슬이 내림
    寒露 = "한로"  # 10월절 - 찬 이슬
    立冬 = "입동"  # 11월절 - 겨울의 시작
    大雪 = "대설"  # 12월절 - 큰 눈

    @classmethod
    def korean_names(cls) -> frozenset[str]:
        """sajupy 데이터 조회용 한글 이름 집합을 반환한다."""
        return frozenset(j.value for j in cls)


class Sinsal(Enum):
    """신살(神殺) - 사주에 나타나는 특수한 작용.

    삼합(三合) 기반 신살: 일지(日支)의 삼합 그룹을 기준으로 판단한다.
    천간(天干) 기반 귀인/살: 일간(日干)을 기준으로 사주 지지에서 찾는다.
    """

    驛馬 = ("역마살", "이동·변동·해외·활동적")
    桃花 = ("도화살", "매력·이성·예술·인기")
    華蓋 = ("화개살", "학문·종교·예술·고독")
    天乙貴人 = ("천을귀인", "귀인의 도움·위기 극복·사회적 인연")
    文昌貴人 = ("문창귀인", "학업·시험·자격증·문서운")
    白虎殺 = ("백호살", "사고·수술·혈광·급변")
    將星 = ("장성살", "리더십·권위·통솔력")

    def __init__(self, korean: str, meaning: str):
        self.korean = korean
        self.meaning = meaning

    @classmethod
    def find_all(
        cls,
        day_stem: "Stem",
        day_branch: Branch,
        all_branches: list[Branch],
    ) -> list[tuple[Branch, "Sinsal"]]:
        """사주 전체 지지에서 신살·귀인을 찾는다."""
        results: list[tuple[Branch, Sinsal]] = []

        # 삼합 기반 신살 (역마·도화·화개·장성)
        for branches, mapping in _SAMHAP_SINSAL:
            if day_branch in branches:
                for sinsal, trigger in mapping.items():
                    for b in all_branches:
                        if b == trigger:
                            results.append((b, sinsal))
                break

        # 일간 기반 귀인 (천을귀인·문창귀인)
        for stem_triggers in _STEM_SINSAL:
            if day_stem in stem_triggers:
                for sinsal, trigger_branches in stem_triggers[day_stem].items():
                    for b in all_branches:
                        if b in trigger_branches:
                            results.append((b, sinsal))
                break

        # 백호살: 일지 기준
        if day_branch in _BAEKHO_MAP:
            trigger = _BAEKHO_MAP[day_branch]
            for b in all_branches:
                if b == trigger and b != day_branch:
                    results.append((b, cls.白虎殺))

        return results


_SAMHAP_SINSAL: list[tuple[frozenset[Branch], dict[Sinsal, Branch]]] = [
    (frozenset({Branch.寅, Branch.午, Branch.戌}),
     {Sinsal.驛馬: Branch.申, Sinsal.桃花: Branch.卯, Sinsal.華蓋: Branch.戌, Sinsal.將星: Branch.午}),
    (frozenset({Branch.申, Branch.子, Branch.辰}),
     {Sinsal.驛馬: Branch.寅, Sinsal.桃花: Branch.酉, Sinsal.華蓋: Branch.辰, Sinsal.將星: Branch.子}),
    (frozenset({Branch.巳, Branch.酉, Branch.丑}),
     {Sinsal.驛馬: Branch.亥, Sinsal.桃花: Branch.午, Sinsal.華蓋: Branch.丑, Sinsal.將星: Branch.酉}),
    (frozenset({Branch.亥, Branch.卯, Branch.未}),
     {Sinsal.驛馬: Branch.巳, Sinsal.桃花: Branch.子, Sinsal.華蓋: Branch.未, Sinsal.將星: Branch.卯}),
]

# 천을귀인(天乙貴人): 일간별 해당 지지
# 문창귀인(文昌貴人): 일간별 해당 지지
_STEM_SINSAL: list[dict[Stem, dict[Sinsal, list[Branch]]]] = [
    {
        Stem.甲: {Sinsal.天乙貴人: [Branch.丑, Branch.未], Sinsal.文昌貴人: [Branch.巳]},
        Stem.乙: {Sinsal.天乙貴人: [Branch.子, Branch.申], Sinsal.文昌貴人: [Branch.午]},
        Stem.丙: {Sinsal.天乙貴人: [Branch.酉, Branch.亥], Sinsal.文昌貴人: [Branch.申]},
        Stem.丁: {Sinsal.天乙貴人: [Branch.酉, Branch.亥], Sinsal.文昌貴人: [Branch.酉]},
        Stem.戊: {Sinsal.天乙貴人: [Branch.丑, Branch.未], Sinsal.文昌貴人: [Branch.申]},
        Stem.己: {Sinsal.天乙貴人: [Branch.子, Branch.申], Sinsal.文昌貴人: [Branch.酉]},
        Stem.庚: {Sinsal.天乙貴人: [Branch.丑, Branch.未], Sinsal.文昌貴人: [Branch.亥]},
        Stem.辛: {Sinsal.天乙貴人: [Branch.寅, Branch.午], Sinsal.文昌貴人: [Branch.子]},
        Stem.壬: {Sinsal.天乙貴人: [Branch.卯, Branch.巳], Sinsal.文昌貴人: [Branch.寅]},
        Stem.癸: {Sinsal.天乙貴人: [Branch.卯, Branch.巳], Sinsal.文昌貴人: [Branch.卯]},
    },
]

# 백호살(白虎殺): 일지별 충(衝) 대응 지지
_BAEKHO_MAP: dict[Branch, Branch] = {
    Branch.子: Branch.午, Branch.丑: Branch.未,
    Branch.寅: Branch.申, Branch.卯: Branch.酉,
    Branch.辰: Branch.戌, Branch.巳: Branch.亥,
    Branch.午: Branch.子, Branch.未: Branch.丑,
    Branch.申: Branch.寅, Branch.酉: Branch.卯,
    Branch.戌: Branch.辰, Branch.亥: Branch.巳,
}


@dataclass
class NatalInfo:
    saju: Saju
    my_main_element: Oheng
    element_stats: dict[Oheng, int]
    strength: int
    yongshin: Oheng
    sipsin: list[tuple[str, Sipsin]]
    sibi_unseong: list[tuple[str, SibiUnseong]]
    sinsal: list[tuple[Branch, Sinsal]]
    personality: str

    @property
    def strength_label(self) -> str:
        if self.strength > 0:
            return "신강(身強)"
        elif self.strength < 0:
            return "신약(身弱)"
        return "중화(中和)"


@dataclass
class DaeunPeriod:
    """대운 하나의 기간 정보"""
    ganji: str
    start_age: int
    end_age: int
    has_yongshin: bool = False


@dataclass
class PostnatalInfo:
    """후천 분석 결과"""
    year: int
    seun_stem: tuple[str, Sipsin]
    seun_branch: tuple[str, Sipsin]
    daeun: list[DaeunPeriod]

    # 용신 충족
    yongshin_in_seun: bool = False
    yongshin_in_daeun: bool = False

    # 현재 대운
    current_daeun: DaeunPeriod | None = None
    daeun_sipsin: list[tuple[str, Sipsin]] = field(default_factory=list)

    # 충·합
    seun_clashes: list[dict] = field(default_factory=list)
    seun_combines: list[dict] = field(default_factory=list)
    daeun_clashes: list[dict] = field(default_factory=list)
    daeun_combines: list[dict] = field(default_factory=list)

    # 영역별 점수
    domain_scores: dict[str, dict] = field(default_factory=dict)

    # 삼재
    samjae: dict | None = None
