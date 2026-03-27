"""사주 도메인 모델 - 사주(四柱), 기둥(柱), 절기(節氣), 분석 결과 데이터.

사주(四柱): 년주·월주·일주·시주, 사람의 생년월일시를 간지로 나타낸 4개의 기둥.
절기(節氣): 태양의 위치에 따라 1년을 24등분한 것.
  - 절(節) 12개: 각 월의 시작점. 대운 계산의 기준이 된다.
  - 기(氣) 12개: 각 월의 중간점. (현재 미사용)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING

from sajupy import calculate_saju as _sajupy_calculate

from bazi.domain.ganji import Branch

if TYPE_CHECKING:
    from bazi.domain.ganji import Oheng, SibiUnseong, Sipsin


class Saju:
    """사주(四柱) - 생년월일시로부터 계산된 네 기둥.

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
    """절(節) - 각 월의 시작을 알리는 절기 12개.

    대운 계산에서 생일로부터 가장 가까운 절까지의 거리를 구하는 데 사용된다.
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


# ── 신살(神殺) ──


class Sinsal(Enum):
    """신살(神殺) - 사주에 나타나는 특수한 작용.

    일지(日支)의 삼합(三合) 그룹을 기준으로 판단한다.
    """

    驛馬 = ("역마살", "이동·변동·해외·활동적")
    桃花 = ("도화살", "매력·이성·예술·인기")
    華蓋 = ("화개살", "학문·종교·예술·고독")

    def __init__(self, korean: str, meaning: str):
        self.korean = korean
        self.meaning = meaning

    @classmethod
    def find_all(cls, day_branch: Branch, all_branches: list[Branch]) -> list[tuple[Branch, "Sinsal"]]:
        """일지 기준으로 사주 전체 지지에서 신살을 찾는다."""
        group = None
        for branches, mapping in _SAMHAP_SINSAL:
            if day_branch in branches:
                group = mapping
                break
        if group is None:
            return []

        results = []
        for sinsal, trigger in group.items():
            for b in all_branches:
                if b == trigger:
                    results.append((b, sinsal))
        return results


_SAMHAP_SINSAL: list[tuple[frozenset[Branch], dict[Sinsal, Branch]]] = [
    (frozenset({Branch.寅, Branch.午, Branch.戌}),
     {Sinsal.驛馬: Branch.申, Sinsal.桃花: Branch.卯, Sinsal.華蓋: Branch.戌}),
    (frozenset({Branch.申, Branch.子, Branch.辰}),
     {Sinsal.驛馬: Branch.寅, Sinsal.桃花: Branch.酉, Sinsal.華蓋: Branch.辰}),
    (frozenset({Branch.巳, Branch.酉, Branch.丑}),
     {Sinsal.驛馬: Branch.亥, Sinsal.桃花: Branch.午, Sinsal.華蓋: Branch.丑}),
    (frozenset({Branch.亥, Branch.卯, Branch.未}),
     {Sinsal.驛馬: Branch.巳, Sinsal.桃花: Branch.子, Sinsal.華蓋: Branch.未}),
]


# ── 분석 결과 데이터 ──


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


@dataclass
class DaeunPeriod:
    """대운 하나의 기간 정보"""
    ganji: str
    start_age: int
    end_age: int


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
