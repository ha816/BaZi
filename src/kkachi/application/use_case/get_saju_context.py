from dataclasses import dataclass
from datetime import datetime

from kkachi.application.saju_service import SajuService
from kkachi.domain.user import Gender, User


@dataclass
class SajuContextInput:
    birth_dt: datetime
    gender: str  # "male" | "female"
    year: int
    city: str = "Seoul"
    name: str = ""


class GetSajuContextUseCase:
    def __init__(self, saju_service: SajuService):
        self._svc = saju_service

    async def execute(self, inp: SajuContextInput) -> str:
        gender = Gender.MALE if inp.gender == "male" else Gender.FEMALE
        user = User(name=inp.name, gender=gender, birth_dt=inp.birth_dt, city=inp.city)
        natal_info, postnatal_info = self._svc.analyze(user, inp.year)
        interpretation = await self._svc.interpret(natal_info, postnatal_info, user=user, name=inp.name)
        return self._svc.build_chat_context(interpretation, user, inp.name)
