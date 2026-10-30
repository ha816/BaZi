import asyncio
from datetime import date, datetime
from uuid import uuid4

from kkachi.application.home_service import HomeService
from kkachi.application.report_builder import REPORT_PROMPT_VERSION
from kkachi.container import Container
from kkachi.domain.ganji import Sipsin
from kkachi.domain.member import Member
from kkachi.domain.natal import Sinsal
from kkachi.domain.profile import Analysis, Profile
from kkachi.domain.user import Gender

TODAY = date(2026, 10, 24)
MEMBER = Member(id=uuid4(), name="회원", email="a@b.c", created_at=datetime(2026, 1, 1))
OTHER_MEMBER = uuid4()


def _profile(name, gender, birth, is_self=False, member_id=MEMBER.id):
    return Profile(
        id=uuid4(), member_id=member_id, name=name, gender=gender, birth_dt=birth,
        city="Seoul", created_at=datetime(2026, 1, 1), is_self=is_self,
    )


ME = _profile("나", Gender.FEMALE, datetime(1990, 5, 3, 9), is_self=True)
MOM = _profile("엄마", Gender.FEMALE, datetime(1962, 2, 11, 7))
FRIEND = _profile("친구", Gender.MALE, datetime(1991, 8, 20, 15))
STRANGER = _profile("남", Gender.MALE, datetime(1985, 1, 1, 12), member_id=OTHER_MEMBER)


class FakeMembers:
    async def get(self, member_id):
        return MEMBER if member_id == MEMBER.id else None


class FakeProfiles:
    def __init__(self, profiles):
        self.profiles = profiles

    async def list_by_member(self, member_id):
        return [p for p in self.profiles if p.member_id == member_id]


class FakeFortune:
    def __init__(self, levels):
        self.levels = levels
        self.calls = []

    async def get_forecast(self, profile_id, days=7, start_date=None):
        self.calls.append(profile_id)
        return [
            {"date": f"2026-10-{24 + i}", "headline": "나님, 오늘은 맑은 날이에요.", "action": f"할 것 {i}", "caution": "",
             "total_score": 60, "level": lvl, "day_element": "火", "solar_term": None, "son_eomneun_nal": False}
            for i, lvl in enumerate(self.levels)
        ]


class FakeAnalyses:
    def __init__(self, report=None):
        self.report = report

    async def get(self, profile_id, year):
        result = {"ai_report": self.report} if self.report else {}
        return Analysis(id=uuid4(), profile_id=profile_id, year=year, result=result, created_at=datetime(2026, 1, 1))


class FakeCompat:
    def __init__(self, done_pairs=()):
        self.done = {frozenset(p) for p in done_pairs}

    async def get(self, pid1, pid2, year):
        assert str(pid1) < str(pid2)  # 캐시 키는 min/max 순
        return object() if frozenset((pid1, pid2)) in self.done else None


def _svc(profiles, levels=("평범한 날",) * 7, report=None, done_pairs=()):
    fortune = FakeFortune(list(levels))
    svc = HomeService(
        member_port=FakeMembers(), profile_port=FakeProfiles(profiles), fortune_service=fortune,
        saju_service=Container().kkachi_service(), analysis_port=FakeAnalyses(report),
        compatibility_port=FakeCompat(done_pairs), astro_port=Container().astro_adapter(),
    )
    return svc, fortune


def _home(svc, member_id=MEMBER.id):
    return asyncio.run(svc.get_home(member_id, today=TODAY))


def test_unknown_member_is_none():
    svc, _ = _svc([ME])
    assert _home(svc, uuid4()) is None


def test_me_has_character_and_today_fortune_people_have_face_and_compat():
    svc, fortune = _svc([MOM, ME, FRIEND, STRANGER])
    home = _home(svc)

    assert home["date"] == "2026-10-24"
    me = home["me"]
    assert me["profile_id"] == str(ME.id)
    assert set(me["character"]) == {"key", "art_key", "title", "line"}
    assert me["character"]["art_key"] == f"{me['character']['key']}_여"  # 여성판 그림
    assert me["fortune"]["headline"].startswith("나님, ") and me["fortune"]["day_element"] == "火"
    assert fortune.calls == [ME.id]  # 운세는 나만, 한 번
    assert [d["date"] for d in me["week"]] == [f"2026-10-{24 + i}" for i in range(7)]  # 주간 시운 7일
    assert set(me["week"][0]) == {"date", "total_score", "level", "weather"}
    assert set(me["marks"]) == {"sinsal", "sipsin"} and me["marks"]["sipsin"]  # 사주 한 입 "내 사람들에게도 있을까?"
    assert set(friend_marks := home["people"][1]["marks"]) == {"sinsal", "sipsin"}
    assert set(friend_marks["sinsal"]) <= {s.korean for s in Sinsal}  # 프론트 SINSAL_INFO 키와 같은 한글 이름
    assert set(friend_marks["sipsin"]) <= {s.name for s in Sipsin}  # 프론트 SIPSIN_INFO 키와 같은 한자
    assert me["zodiac_branch"] == "午"  # 1990 경오년생 — 까치 소식 '오늘의 띠'에 내 띠 표시
    assert home["today"]["date"] == "2026-10-24" and len(home["today"]["zodiac"]) == 12
    # 오늘의 별자리(2026-10-30) — 1990-05-03 09:00 서울: 태양 황소·달 사자·상승 게. 일반판 12개는 today.sky
    assert me["horoscope"]["chart"] == {"sun": "taurus", "moon": "leo", "asc": "cancer", "uncertain": []}
    assert me["horoscope"]["headline"].startswith("나님, ") and me["horoscope"]["lucky_item"]
    assert len(home["today"]["sky"]["signs"]) == 12 and home["today"]["sky"]["moon_phase"]

    # 기본 프로필을 뺀 내 사람만, 리포 순서 그대로 — 다른 회원의 프로필은 없다
    assert [p["name"] for p in home["people"]] == ["엄마", "친구"]
    friend = home["people"][1]
    assert set(friend["character"]) == {"key", "art_key"}
    assert friend["character"]["art_key"] == friend["character"]["key"]  # 남성은 유형 키 그대로
    assert friend["compat"]["level"] in ("좋음", "보통", "주의")
    assert 0 <= friend["compat"]["score"] <= 100 and friend["compat"]["headline"]


def test_no_self_profile_means_no_me_and_no_compat():
    svc, fortune = _svc([MOM])
    home = _home(svc)
    assert home["me"] is None and home["next"] == []
    assert home["today"]["day_pillar"] and home["today"]["sky"]["sun"]  # 기본 프로필이 없어도 까치 소식·오늘의 별자리는 있다
    assert home["people"][0]["compat"] is None and home["people"][0]["character"]["key"]
    assert fortune.calls == []


def test_next_candidates_in_order():
    levels = ["좋은 날", "평범한 날", "좋은 날", "평범한 날", "좋은 날", "평범한 날", "평범한 날"]
    svc, _ = _svc([MOM, ME, FRIEND], levels=levels, done_pairs=[(ME.id, MOM.id)])
    nxt = _home(svc)["next"]
    # 좋은 날은 오늘(0번)이 아니라 내일 이후 첫 날, 궁합은 아직 안 본 첫 사람, AI 풀이는 없음
    assert nxt == [
        {"kind": "good_day", "date": "2026-10-26", "action": "할 것 2"},
        {"kind": "compat", "profile_id": str(FRIEND.id), "name": "친구"},
        {"kind": "ai_report"},
    ]


def test_next_skips_done_items():
    report = {"text": "글", "version": REPORT_PROMPT_VERSION}
    svc, _ = _svc([MOM, ME], report=report, done_pairs=[(ME.id, MOM.id)])
    assert _home(svc)["next"] == []

    old = {"text": "옛 글", "version": REPORT_PROMPT_VERSION - 1}  # 옛 프롬프트 글은 없는 것으로
    svc, _ = _svc([ME], report=old)
    assert _home(svc)["next"] == [{"kind": "ai_report"}]
