from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class CompatibilityResult:
    total_score: int
    label: str
    domain_scores: dict[str, dict]  # {연애/결혼/재물/직업: {score, level, reason}}
    description: str
    stem_combine: bool
    branch_combine: bool
    branch_clash: bool


@dataclass
class Compatibility:
    id: UUID
    profile_id_1: UUID
    profile_id_2: UUID
    year: int
    result: dict
    created_at: datetime
