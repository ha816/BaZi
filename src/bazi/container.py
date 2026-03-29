from dependency_injector import containers, providers

from bazi.application.natal_service import NatalAnalyzer, PostnatalAnalyzer
from bazi.application.saju_service import Interpreter, SajuService


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(
        modules=["bazi.adapter.inner.saju_controller"],
    )

    natal_analyzer = providers.Singleton(NatalAnalyzer)
    postnatal_analyzer = providers.Singleton(PostnatalAnalyzer)
    interpreter = providers.Singleton(Interpreter)

    saju_service = providers.Singleton(
        SajuService,
        natal_port=natal_analyzer,
        postnatal_port=postnatal_analyzer,
        interpreter=interpreter,
    )
