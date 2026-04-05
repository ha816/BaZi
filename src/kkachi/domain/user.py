from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class Gender(str, Enum):
    """성별. str을 상속하여 JSON 직렬화/Pydantic 호환을 지원한다."""
    MALE = "male"
    FEMALE = "female"

    @property
    def is_male(self) -> bool:
        return self == Gender.MALE


@dataclass
class User:
    """사주 분석 대상자. 이름·성별·생년월일시·도시 정보를 담는다."""
    name: str
    gender: Gender
    birth_dt: datetime
    city: str = "Seoul"
    longitude: float | None = None

    def age(self, base_year: int | None = None) -> int:
        """한국 나이를 계산한다."""
        if base_year is None:
            base_year = datetime.now().year
        return base_year - self.birth_dt.year + 1
