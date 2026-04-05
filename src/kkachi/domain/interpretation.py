from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class InterpretTip:
    label: str
    text: str


@dataclass
class InterpretBlock:
    description: str
    category: str | None = None
    tips: list[InterpretTip] = field(default_factory=list)


@dataclass
class NatalResult:
    """선천 분석 결과 — 생년월일로 고정되는 값."""

    # 원국
    pillars: list[str] = field(default_factory=list)
    day_stem: str = ""

    # 오행·강약·용신
    element_stats: dict[str, int] = field(default_factory=dict)
    strength_value: int = 0
    strength_label: str = ""
    my_element: dict[str, str] = field(default_factory=dict)
    yongshin_info: dict[str, str] = field(default_factory=dict)

    # 십신·십이운성·신살
    sipsin: list[dict[str, str]] = field(default_factory=list)
    sibi_unseong: list[dict[str, str]] = field(default_factory=list)
    sinsal: list[dict[str, str]] = field(default_factory=list)

    # 텍스트 해석
    personality: list[InterpretBlock] = field(default_factory=list)
    element_balance: list[InterpretBlock] = field(default_factory=list)


@dataclass
class PostnatalResult:
    """후천 분석 결과 — 분석 연도에 따라 바뀌는 값."""

    # 세운
    year: int = 0
    seun_ganji: str = ""
    seun_stem: dict[str, str] = field(default_factory=dict)
    seun_branch: dict[str, str] = field(default_factory=dict)
    yongshin_in_seun: bool = False
    yongshin_in_daeun: bool = False

    # 대운
    daeun: list[dict] = field(default_factory=list)
    current_daeun: dict | None = None
    daeun_sipsin: list[dict[str, str]] = field(default_factory=list)

    # 충·합
    seun_clashes: list[dict] = field(default_factory=list)
    seun_combines: list[dict] = field(default_factory=list)
    daeun_clashes: list[dict] = field(default_factory=list)
    daeun_combines: list[dict] = field(default_factory=list)

    # 영역별 점수·삼재
    domain_scores: dict[str, dict] = field(default_factory=dict)
    samjae: dict | None = None

    # 텍스트 해석
    yongshin: list[InterpretBlock] = field(default_factory=list)
    fortune_by_domain: list[InterpretBlock] = field(default_factory=list)
    annual_fortune: list[InterpretBlock] = field(default_factory=list)
    samjae_fortune: list[InterpretBlock] = field(default_factory=list)
    major_fortune: list[InterpretBlock] = field(default_factory=list)
    relationships: list[InterpretBlock] = field(default_factory=list)
    advice: list[InterpretBlock] = field(default_factory=list)


@dataclass
class Interpretation:
    """종합 해석 결과 — 선천 + 후천."""

    natal: NatalResult = field(default_factory=NatalResult)
    postnatal: PostnatalResult = field(default_factory=PostnatalResult)
