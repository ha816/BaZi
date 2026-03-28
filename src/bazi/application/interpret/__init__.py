from bazi.application.interpretation import Interpretation, build_chart_data
from bazi.application.interpret.advice import AdviceInterpreter
from bazi.application.interpret.daeun import DaeunInterpreter
from bazi.application.interpret.fortune import FortuneInterpreter
from bazi.application.interpret.personality import ElementBalanceInterpreter, PersonalityInterpreter
from bazi.application.interpret.relationship import RelationshipInterpreter
from bazi.application.interpret.seun import SeunInterpreter
from bazi.application.interpret.yongshin import YongshinInterpreter
from bazi.domain.natal import NatalInfo, PostnatalInfo


class Interpreter:
    """종합 해석기 — 각 해석 컴포넌트를 조합하여 Interpretation을 반환한다."""

    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> Interpretation:
        return Interpretation(
            **build_chart_data(natal, postnatal),
            personality=PersonalityInterpreter()(natal),
            element_balance=ElementBalanceInterpreter()(natal),
            yongshin=YongshinInterpreter()(natal, postnatal),
            fortune_by_domain=FortuneInterpreter()(postnatal),
            annual_fortune=SeunInterpreter()(natal, postnatal),
            major_fortune=DaeunInterpreter()(postnatal),
            relationships=RelationshipInterpreter()(postnatal),
            advice=AdviceInterpreter()(natal, postnatal),
        )
