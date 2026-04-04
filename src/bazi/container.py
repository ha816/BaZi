from dependency_injector import containers, providers

from bazi.adapter.outer.db.base import make_engine, make_session_factory
from bazi.adapter.outer.db.member_repo import MemberRepo
from bazi.adapter.outer.db.profile_repo import AnalysisRepo, CompatibilityRepo, ProfileRepo
from bazi.adapter.outer.natal_adapter import NatalAdapter, PostnatalAdapter
from bazi.application.compatibility_service import CompatibilityService
from bazi.application.member_service import MemberService
from bazi.application.profile_service import ProfileService
from bazi.application.saju_service import SajuService


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(
        modules=[
            "bazi.adapter.inner.saju_controller",
            "bazi.adapter.inner.member_controller",
            "bazi.adapter.inner.profile_controller",
            "bazi.adapter.inner.compatibility_controller",
        ],
    )

    config = providers.Configuration()

    # DB
    db_engine = providers.Singleton(make_engine, db_url=config.db.url)
    session_factory = providers.Singleton(make_session_factory, engine=db_engine)

    # Repos
    member_repo = providers.Singleton(MemberRepo, session_factory=session_factory)
    profile_repo = providers.Singleton(ProfileRepo, session_factory=session_factory)
    analysis_repo = providers.Singleton(AnalysisRepo, session_factory=session_factory)

    # Saju (기존)
    natal_adapter = providers.Singleton(NatalAdapter)
    postnatal_adapter = providers.Singleton(PostnatalAdapter)
    saju_service = providers.Singleton(
        SajuService,
        natal_port=natal_adapter,
        postnatal_port=postnatal_adapter,
    )

    # 신규
    member_service = providers.Singleton(MemberService, member_port=member_repo)
    profile_service = providers.Singleton(
        ProfileService,
        profile_port=profile_repo,
        analysis_port=analysis_repo,
        saju_service=saju_service,
    )
    compatibility_repo = providers.Singleton(CompatibilityRepo, session_factory=session_factory)
    compatibility_service = providers.Singleton(
        CompatibilityService,
        profile_port=profile_repo,
        compatibility_port=compatibility_repo,
        saju_service=saju_service,
    )
