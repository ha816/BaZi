from dependency_injector import containers, providers

from bazi.adapter.outer.natal_adapter import NatalAdapter, PostnatalAdapter
from bazi.application.saju_service import SajuService


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(
        modules=["bazi.adapter.inner.saju_controller"],
    )

    natal_adapter = providers.Singleton(NatalAdapter)
    postnatal_adapter = providers.Singleton(PostnatalAdapter)
    saju_service = providers.Singleton(
        SajuService,
        natal_port=natal_adapter,
        postnatal_port=postnatal_adapter,
    )
