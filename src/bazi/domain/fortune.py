"""운세 도메인 상수 - 사주(四柱), 기둥(柱), 절기(節氣).

사주(四柱): 년주·월주·일주·시주, 사람의 생년월일시를 간지로 나타낸 4개의 기둥.
절기(節氣): 태양의 위치에 따라 1년을 24등분한 것.
  - 절(節) 12개: 각 월의 시작점. 대운 계산의 기준이 된다.
  - 기(氣) 12개: 각 월의 중간점. (현재 미사용)
"""

from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True)
class Saju:
    """사주(四柱) - 네 기둥으로 구성된 사람의 명식.

    각 기둥은 천간(天干)+지지(地支) 두 글자로 이루어진 간지(干支) 문자열이다.
    """

    year_pillar: str   # 년주(年柱) - 태어난 해
    month_pillar: str  # 월주(月柱) - 태어난 달
    day_pillar: str    # 일주(日柱) - 태어난 날
    hour_pillar: str   # 시주(時柱) - 태어난 시

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
