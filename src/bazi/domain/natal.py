"""선천·후천 분석 결과 데이터."""

from dataclasses import dataclass

from bazi.domain.fortune import Saju


@dataclass
class NatalInfo:
    saju: Saju
    my_main_element: str
    element_stats: dict[str, int]
    strength: int
    yongshin: str
    sipsin: list[tuple[str, str]]
    personality: str
    sipsin_domains: list[dict]


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
    seun_ganji: str
    seun: list[tuple[str, str]]
    daeun: list[DaeunPeriod]