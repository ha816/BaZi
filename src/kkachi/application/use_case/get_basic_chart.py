from dataclasses import dataclass
from datetime import datetime

from kkachi.application.saju_service import SajuService
from kkachi.domain.user import Gender, User


@dataclass
class BasicChartInput:
    birth_dt: datetime
    gender: str
    year: int
    city: str = "Seoul"


class GetBasicChartUseCase:
    def __init__(self, saju_service: SajuService):
        self._svc = saju_service

    def execute(self, inp: BasicChartInput) -> dict:
        gender = Gender.MALE if inp.gender == "male" else Gender.FEMALE
        user = User(name="", gender=gender, birth_dt=inp.birth_dt, city=inp.city)
        return self._svc.basic_analyze(user, inp.year)
