from dependency_injector import containers, providers
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from kkachi.adapter.outer.db.member_repo import MemberRepo
from kkachi.adapter.outer.db.payment_repo import PaymentRepo
from kkachi.adapter.outer.db.profile_repo import AnalysisRepo, CompatibilityRepo, FeedbackRepo, FortuneRepo, ProfileRepo
from kkachi.adapter.outer.llm_adapter import LlmAdapter
from kkachi.adapter.outer.natal_adapter import NatalAdapter, PostnatalAdapter
from kkachi.adapter.outer.weather_adapter import WeatherAdapter
from kkachi.application.compatibility_service import CompatibilityService
from kkachi.application.fortune_service import FortuneService
from kkachi.application.member_service import MemberService
from kkachi.application.payment_service import PaymentService
from kkachi.application.profile_service import ProfileService
from kkachi.application.saju_service import SajuService


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(
        modules=[
            "kkachi.adapter.inner.saju_controller",
            "kkachi.adapter.inner.member_controller",
            "kkachi.adapter.inner.profile_controller",
            "kkachi.adapter.inner.compatibility_controller",
            "kkachi.adapter.inner.payment_controller",
            "kkachi.adapter.inner.weather_controller",
        ],
    )

    config = providers.Configuration()

    # DB
    db_engine = providers.Singleton(create_async_engine, url=config.db.url, echo=False)
    session_factory = providers.Singleton(async_sessionmaker, bind=db_engine, expire_on_commit=False)

    # Repos
    member_repo = providers.Singleton(MemberRepo, session_factory=session_factory)
    profile_repo = providers.Singleton(ProfileRepo, session_factory=session_factory)
    analysis_repo = providers.Singleton(AnalysisRepo, session_factory=session_factory)
    feedback_repo = providers.Singleton(FeedbackRepo, session_factory=session_factory)
    payment_repo = providers.Singleton(PaymentRepo, session_factory=session_factory)

    # Saju (기존)
    natal_adapter = providers.Singleton(NatalAdapter)
    postnatal_adapter = providers.Singleton(PostnatalAdapter)
    llm_adapter = providers.Singleton(LlmAdapter)
    saju_service = providers.Singleton(
        SajuService,
        natal_port=natal_adapter,
        postnatal_port=postnatal_adapter,
        llm_port=llm_adapter,
    )

    # 신규
    member_service = providers.Singleton(MemberService, member_port=member_repo)
    payment_service = providers.Singleton(
        PaymentService,
        payment_port=payment_repo,
        toss_secret_key=config.toss.secret_key,
    )
    profile_service = providers.Singleton(
        ProfileService,
        profile_port=profile_repo,
        analysis_port=analysis_repo,
        saju_service=saju_service,
        payment_port=payment_repo,
    )
    compatibility_repo = providers.Singleton(CompatibilityRepo, session_factory=session_factory)
    compatibility_service = providers.Singleton(
        CompatibilityService,
        profile_port=profile_repo,
        compatibility_port=compatibility_repo,
        saju_service=saju_service,
    )
    weather_adapter = providers.Singleton(WeatherAdapter)
    fortune_repo = providers.Singleton(FortuneRepo, session_factory=session_factory)
    fortune_service = providers.Singleton(
        FortuneService,
        profile_port=profile_repo,
        fortune_port=fortune_repo,
        saju_service=saju_service,
        weather_adapter=weather_adapter,
    )
