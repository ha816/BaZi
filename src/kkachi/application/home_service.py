from datetime import date
from uuid import UUID

from kkachi.application.compatibility_daily import compute_daily_compat
from kkachi.application.fortune_rules import build_today
from kkachi.application.fortune_service import FortuneService
from kkachi.application.horoscope_rules import build_my_horoscope, build_sky
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.analysis_port import AnalysisPort
from kkachi.application.port.astro_port import AstroPort
from kkachi.application.port.compatibility_port import CompatibilityPort
from kkachi.application.port.member_port import MemberPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.report_builder import REPORT_PROMPT_VERSION, cached_report_text
from kkachi.application.saju_character import build_saju_character
from kkachi.domain.ganji import Pillar
from kkachi.domain.profile import Profile
from kkachi.domain.user import User

_FORTUNE_KEYS = ("headline", "action", "caution", "total_score", "level", "day_element", "solar_term", "son_eomneun_nal", "yongshin")
_WEEK_KEYS = ("date", "total_score", "level", "weather")  # 홈 "이 시간대가 좋아요"·"주간 시운" 카드 (2026-10-26)


class HomeService:
    """홈 한 장(specs/home/index.md §2-1) — 오늘의 나 · 오늘 내 사람들 · 까치 소식(today) · 이어서 할 것 후보를 요청 한 번에.
    캐릭터·오늘의 궁합은 natal만으로 계산한다(한 사람 1ms 미만) — analyses 캐시를 읽거나 쓰지 않는다."""

    def __init__(
        self,
        member_port: MemberPort,
        profile_port: ProfilePort,
        fortune_service: FortuneService,
        saju_service: KkachiService,
        analysis_port: AnalysisPort,
        compatibility_port: CompatibilityPort,
        astro_port: AstroPort,
    ):
        self._member_port = member_port
        self._profile_port = profile_port
        self._fortune = fortune_service
        self._saju = saju_service
        self._analysis_port = analysis_port
        self._compat_port = compatibility_port
        self._astro = astro_port

    async def get_home(self, member_id: UUID, today: date | None = None) -> dict | None:
        """회원이 없으면 None. 기본 프로필(is_self)이 없으면 me는 None, people은 궁합 없이."""
        if await self._member_port.get(member_id) is None:
            return None
        today = today or date.today()
        profiles = await self._profile_port.list_by_member(member_id)  # 최근에 추가한 사람 먼저
        me = next((p for p in profiles if p.is_self), None)
        others = [p for p in profiles if p is not me]

        my_natal = self._natal(me) if me else None
        people = []
        for p in others:
            natal = self._natal(p)
            compat = compute_daily_compat(my_natal, natal, today, me.name, p.name) if my_natal else None
            people.append({
                "profile_id": str(p.id),
                "name": p.name,
                "character": self._character(natal, p, full=False),
                "marks": self._marks(natal),
                "compat": {k: compat[k] for k in ("score", "level", "headline")} if compat else None,
            })

        today_block = {**build_today(today), "sky": build_sky(self._astro, today)}  # 오늘의 띠 + 오늘의 별자리
        if me is None:
            return {"date": today.isoformat(), "me": None, "people": people, "today": today_block, "next": []}

        week = await self._fortune.get_forecast(me.id, days=7, start_date=today)
        return {
            "date": today.isoformat(),
            "me": {
                "profile_id": str(me.id),
                "name": me.name,
                "character": self._character(my_natal, me, full=True),
                "zodiac_branch": my_natal.saju[Pillar.年柱].branch.name,
                "horoscope": build_my_horoscope(self._astro, self._user(me), today),
                "marks": self._marks(my_natal),
                "fortune": {k: week[0].get(k) for k in _FORTUNE_KEYS},
                "week": [{k: d.get(k) for k in _WEEK_KEYS} for d in week],
            },
            "people": people,
            "today": today_block,
            "next": await self._get_next(me, others, week, today.year),
        }

    def _natal(self, profile: Profile):
        return self._saju.analyze_natal(self._user(profile))

    @staticmethod
    def _user(profile: Profile) -> User:
        return User(
            name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt,
            city=profile.city, hour_unknown=profile.birth_hour_unknown,
        )

    @staticmethod
    def _character(natal, profile: Profile, full: bool) -> dict:
        ch = build_saju_character(natal, profile.gender.is_male)
        keys = ("key", "art_key", "title", "line") if full else ("key", "art_key")
        return {k: ch[k] for k in keys}

    @staticmethod
    def _marks(natal) -> dict:
        """사주 한 입 카드의 "내 사람들에게도 있을까?"용 — 가진 신살(한글 이름)·십신(한자), 중복 없이 (2026-10-26)."""
        return {
            "sinsal": sorted({s.korean for _, s in natal.sinsal}),
            "sipsin": sorted({s.name for _, s in natal.sipsin}),
        }

    async def _get_next(self, me: Profile, others: list[Profile], week: list[dict], year: int) -> list[dict]:
        """서버가 아는 '이어서 할 것' 후보, 스펙 §3-3 순서(알림 켜기는 클라이언트가 맨 앞에 붙인다)."""
        nxt = []
        good = next((d for d in week[1:] if d.get("level") == "좋은 날"), None)
        if good:
            nxt.append({"kind": "good_day", "date": good["date"], "action": good.get("action", "")})
        for p in others:
            lo, hi = (me.id, p.id) if str(me.id) < str(p.id) else (p.id, me.id)
            if await self._compat_port.get(lo, hi, year) is None:
                nxt.append({"kind": "compat", "profile_id": str(p.id), "name": p.name})
                break
        row = await self._analysis_port.get(me.id, year)
        if cached_report_text(row.result.get("ai_report") if row else None, REPORT_PROMPT_VERSION) is None:
            nxt.append({"kind": "ai_report"})
        return nxt
