from dataclasses import dataclass
from datetime import datetime

from kkachi.application.saju_service import SajuService
from kkachi.domain.user import Gender, User


@dataclass
class AnnualFortuneInput:
    birth_dt: datetime
    gender: str
    year: int
    city: str = "Seoul"
    name: str = ""


class GetAnnualFortuneUseCase:
    def __init__(self, saju_service: SajuService):
        self._svc = saju_service

    async def execute(self, inp: AnnualFortuneInput) -> dict:
        gender = Gender.MALE if inp.gender == "male" else Gender.FEMALE
        user = User(name=inp.name, gender=gender, birth_dt=inp.birth_dt, city=inp.city)
        natal_info, postnatal_info = self._svc.analyze(user, inp.year)
        interpretation = await self._svc.interpret(natal_info, postnatal_info, user=user, name=inp.name)
        post = interpretation.postnatal
        return {
            "year": post.year,
            "seun_ganji": post.seun_ganji,
            "domain_scores": post.domain_scores,
            "samjae": post.samjae,
            "current_daeun": post.current_daeun,
            "seun_clashes": [c.get("narrative", "") for c in post.seun_clashes],
            "seun_combines": [c.get("narrative", "") for c in post.seun_combines],
            "core_summary": post.core_summary,
            "yongshin_in_seun": post.yongshin_in_seun,
        }
