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
class TrigramInfo:
    char: str            # 예: "坎"
    reading: str         # 예: "감"
    element: str         # 예: "水"
    element_korean: str  # 예: "물"
    description: str     # 8괘 풀이


@dataclass
class LuckyDirection:
    direction: str       # "북"
    kind_korean: str     # "생기"
    kind_han: str        # "生氣"
    meaning: str         # "최고 길방, 재물·성취"


@dataclass
class FengShuiResult:
    kua_number: int
    trigram: TrigramInfo
    group: str               # "동사택(東四宅)"
    is_eastern: bool
    lucky_directions: list[LuckyDirection] = field(default_factory=list)
    unlucky_directions: list[str] = field(default_factory=list)
    avoid_advice: str = ""
    interior_intro: str = ""
    interior_tips: list[InterpretTip] = field(default_factory=list)


@dataclass
class ZodiacInfo:
    branch: str          # 子
    korean: str          # 쥐
    emoji: str           # 🐭
    keyword: str         # 지혜·적응
    traits: list[str] = field(default_factory=list)
    strength: str = ""
    weakness: str = ""
    compatible: list[str] = field(default_factory=list)


@dataclass
class ZodiacRelation:
    branch: str
    info: ZodiacInfo
    relation: str        # 나·삼합·육합·원진·충·보통
    relation_label: str  # 삼합(三合)


@dataclass
class PillarZodiac:
    branch: str
    info: ZodiacInfo
    pillar_label: str    # 년주(年柱)
    role: str            # 사회적 자아
    role_desc: str       # 남들이 보는 나의 대외 이미지
    is_year: bool


@dataclass
class SamhapInfo:
    element: str         # 水
    label: str           # 水 삼합
    members: list[str] = field(default_factory=list)
    in_pillars: bool = False


@dataclass
class PillarPair:
    i: int               # pillar index a (0=년주, 1=월주, 2=일주, 3=시주)
    j: int               # pillar index b
    pillar_label_a: str  # 년주(年柱)
    pillar_label_b: str  # 일주(日柱)
    branch_a: str        # 寅
    branch_b: str        # 戌
    zodiac_a: str        # 호랑이
    zodiac_b: str        # 개
    relation: str        # 삼합·육합·충·원진
    relation_label: str  # 삼합(三合)


@dataclass
class ZodiacResult:
    year_branch: str
    year_info: ZodiacInfo
    relations: list[ZodiacRelation] = field(default_factory=list)
    pillar_zodiacs: list[PillarZodiac] = field(default_factory=list)
    pillar_pairs: list[PillarPair] = field(default_factory=list)
    pillar_tip: str = ""
    samhap: SamhapInfo | None = None


@dataclass
class NatalResult:
    """선천 분석 결과 — 생년월일로 고정되는 값."""

    # 원국
    pillars: list[str] = field(default_factory=list)
    day_stem: str = ""
    day_stem_korean: str = ""
    pillar_stems_korean: list[str] = field(default_factory=list)
    pillar_branches_korean: list[str] = field(default_factory=list)

    # 오행·강약·용신
    element_stats: dict[str, int] = field(default_factory=dict)
    strength_value: int = 0
    strength_label: str = ""
    my_element: dict[str, str] = field(default_factory=dict)
    yongshin_info: dict[str, str] = field(default_factory=dict)
    kisin_info: dict[str, str] = field(default_factory=dict)
    yongshin_guide: dict[str, str] = field(default_factory=dict)
    kisin_guide: dict[str, str] = field(default_factory=dict)

    # 십신·십이운성·신살
    sipsin: list[dict[str, str]] = field(default_factory=list)
    sibi_unseong: list[dict[str, str]] = field(default_factory=list)
    sinsal: list[dict[str, str]] = field(default_factory=list)

    # 지장간·십이신살·공망
    jizan_gan: list[list[dict[str, str | int]]] = field(default_factory=list)
    sibi_sinsal: list[str] = field(default_factory=list)
    gongmang: list[bool] = field(default_factory=list)

    # 일간 음양
    day_stem_yin_yang: str = ""

    # 팔자 각 글자 오행 (년/월/일/시 순)
    pillar_elements: list[dict] = field(default_factory=list)

    # 팔자 요약
    pillar_summary: str = ""

    # 카드별 동적 풀이 텍스트 (사주별로 합성)
    narratives: dict[str, str] = field(default_factory=dict)

    # 텍스트 해석
    personality: list[InterpretBlock] = field(default_factory=list)
    element_balance: list[InterpretBlock] = field(default_factory=list)
    feng_shui: FengShuiResult | None = None
    zodiac: ZodiacResult | None = None


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

    # 가장 가까운 용신의 해
    nearest_yongshin_year: int | None = None

    # 이번달 포함 6개월 ganji + 용신 매칭
    upcoming_months: list[dict] = field(default_factory=list)

    # 이번달 십신 → 영역별 뱃지 라벨 (DomainBarChart 키와 일치)
    month_badges: dict[str, list[str]] = field(default_factory=dict)

    # 연도별 띠 관계 (4년치, 좋은 해 없으면 마지막 슬롯에 가까운 좋은 해)
    year_zodiac_relations: list[dict] = field(default_factory=list)
    year_zodiac_narrative: str = ""

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
