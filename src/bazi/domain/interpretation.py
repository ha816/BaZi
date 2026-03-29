from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Interpretation:
    """구조화된 종합 해석 결과. 텍스트 해석 + 차트/UI용 데이터를 모두 포함한다."""

    # 사주 원국
    pillars: list[str] = field(default_factory=list)
    day_stem: str = ""

    # 오행·강약·용신 (차트용)
    element_stats: dict[str, int] = field(default_factory=dict)
    strength_value: int = 0
    strength_label: str = ""
    my_element: dict[str, str] = field(default_factory=dict)
    yongshin_info: dict[str, str] = field(default_factory=dict)

    # 세운
    year: int = 0
    seun_ganji: str = ""
    seun_stem: dict[str, str] = field(default_factory=dict)
    seun_branch: dict[str, str] = field(default_factory=dict)
    yongshin_in_seun: bool = False
    yongshin_in_daeun: bool = False

    # 대운 (차트용)
    daeun: list[dict] = field(default_factory=list)
    current_daeun: dict | None = None
    daeun_sipsin: list[dict[str, str]] = field(default_factory=list)

    # 충·합
    seun_clashes: list[dict] = field(default_factory=list)
    seun_combines: list[dict] = field(default_factory=list)
    daeun_clashes: list[dict] = field(default_factory=list)
    daeun_combines: list[dict] = field(default_factory=list)

    # 영역별 점수 (차트용)
    domain_scores: dict[str, dict] = field(default_factory=dict)

    # 십신·십이운성·신살
    sipsin: list[dict[str, str]] = field(default_factory=list)
    sibi_unseong: list[dict[str, str]] = field(default_factory=list)
    sinsal: list[dict[str, str]] = field(default_factory=list)

    # 삼재
    samjae: dict | None = None

    # 텍스트 해석
    personality: list[str] = field(default_factory=list)
    element_balance: list[str] = field(default_factory=list)
    yongshin: list[str] = field(default_factory=list)
    fortune_by_domain: list[str] = field(default_factory=list)
    annual_fortune: list[str] = field(default_factory=list)
    major_fortune: list[str] = field(default_factory=list)
    relationships: list[str] = field(default_factory=list)
    advice: list[str] = field(default_factory=list)