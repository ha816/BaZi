from dependency_injector import containers, providers

from bazi.application.interpreter.advice import AdviceInterpreter
from bazi.application.interpreter.daeun import DaeunInterpreter
from bazi.application.interpreter.fortune import FortuneInterpreter
from bazi.application.interpreter.personality import ElementBalanceInterpreter, PersonalityInterpreter
from bazi.application.interpreter.relationship import RelationshipInterpreter
from bazi.application.interpreter.seun import SeunInterpreter
from bazi.application.interpreter.yongshin import YongshinInterpreter
from bazi.application.natal_service import NatalAnalyzer, PostnatalAnalyzer
from bazi.application.saju_service import Interpreter


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(
        modules=["bazi.adapter.inner.saju_controller"],
    )

    natal_analyzer = providers.Singleton(NatalAnalyzer)
    postnatal_analyzer = providers.Singleton(PostnatalAnalyzer)

    personality_interpreter = providers.Singleton(PersonalityInterpreter)
    element_balance_interpreter = providers.Singleton(ElementBalanceInterpreter)
    yongshin_interpreter = providers.Singleton(YongshinInterpreter)
    seun_interpreter = providers.Singleton(SeunInterpreter)
    daeun_interpreter = providers.Singleton(DaeunInterpreter)
    fortune_interpreter = providers.Singleton(FortuneInterpreter)
    relationship_interpreter = providers.Singleton(RelationshipInterpreter)
    advice_interpreter = providers.Singleton(AdviceInterpreter)

    interpreter = providers.Singleton(Interpreter)
