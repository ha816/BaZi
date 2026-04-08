from dataclasses import dataclass
from datetime import date


@dataclass
class Fortune:
    date: str           # "2026-04-05"
    day_pillar: str     # "丙午"
    day_element: str    # "火"
    total_score: int    # 0~100
    level: str          # "좋은 날" / "평범한 날" / "주의가 필요한 날"
    domain_scores: dict # {재물/연애/직업/건강: {score, level, reason}}
    description: str    # 2~3문장 요약
    tips: list[str]     # 짧은 조언 1~3개
    weather: dict | None = None   # {temperature, element, condition}
    solar_term: str | None = None  # 절기명 예) "입춘(立春)"


@dataclass
class FortuneCache:
    id: object
    profile_id: object
    fortune_date: date
    result: dict
    created_at: object