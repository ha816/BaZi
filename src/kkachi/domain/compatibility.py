from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class PillarRelation:
    """두 사람의 기둥(柱) 간 관계 하나를 표현."""
    pillar1: str           # "年柱" | "月柱" | "日柱" | "時柱" (첫 번째 분)
    pillar2: str           # 두 번째 분 기둥
    kind: str              # "stem_combine" | "branch_combine" | "branch_clash" | "wonjin" | "hyung" | "hae" | "pa" | "samhap"
    label: str             # 표시용 한자 라벨 (예: "卯戌 합", "丑未 충")
    polarity: int          # +1 길 / -1 흉 / 0 중립


@dataclass
class PillarSnapshot:
    """프론트가 두 사주를 비교 렌더링하기 위한 압축 데이터."""
    pillars: list[str]                  # ["甲子", "丙寅", ...]
    day_stem: str                       # "甲"
    element_stats: dict[str, int]       # {"木": 2, "火": 3, ...}
    my_main_element: str                # "火"
    strength_label: str                 # "신강(身強)"
    yongshin: str                       # "水"
    hour_unknown: bool = False          # 시주 없음 (세 기둥)


@dataclass
class CompatibilityResult:
    total_score: int
    label: str
    domain_scores: dict[str, dict]  # {연애/결혼/재물/직업: {score, level, reason}}
    description: str
    stem_combine: bool
    branch_combine: bool
    branch_clash: bool
    # 신규 — 두 사주 비교 데이터
    pillar1_snapshot: PillarSnapshot | None = None
    pillar2_snapshot: PillarSnapshot | None = None
    pillar_relations: list[PillarRelation] = field(default_factory=list)
    element_complement: dict = field(default_factory=dict)
    shared_sinsal: list[str] = field(default_factory=list)
    unique_sinsal_1: list[str] = field(default_factory=list)
    unique_sinsal_2: list[str] = field(default_factory=list)
    samhap_completions: list[dict] = field(default_factory=list)
    key_traits: list[str] = field(default_factory=list)
    narrative: str | None = None


@dataclass
class Compatibility:
    id: UUID
    profile_id_1: UUID
    profile_id_2: UUID
    year: int
    result: dict
    created_at: datetime
