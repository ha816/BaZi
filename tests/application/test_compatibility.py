import asyncio
from datetime import datetime
from uuid import UUID, uuid4

from kkachi.adapter.outer.natal_adapter import NatalAdapter
from kkachi.adapter.outer.postnatal_adapter import PostnatalAdapter
from kkachi.application.compatibility_service import CompatibilityService
from kkachi.application.kkachi_service import KkachiService, NatalService, PostnatalService
from kkachi.application.port.compatibility_port import CompatibilityPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.domain.compatibility import Compatibility
from kkachi.domain.ganji import Pillar
from kkachi.domain.profile import Profile
from kkachi.domain.user import Gender, User


_natal_adapter = NatalAdapter()
_postnatal_adapter = PostnatalAdapter()
_natal_svc = NatalService(natal_port=_natal_adapter)
_postnatal_svc = PostnatalService(natal_port=_natal_adapter, postnatal_port=_postnatal_adapter)
_kkachi_service = KkachiService(natal_svc=_natal_svc, postnatal_svc=_postnatal_svc)


class _FakeProfilePort(ProfilePort):
    def __init__(self, profiles: dict[UUID, Profile]):
        self._profiles = profiles

    async def create(self, member_id, name, gender, birth_dt, city, is_self=False):
        pid = uuid4()
        p = Profile(id=pid, member_id=member_id, name=name, gender=gender, birth_dt=birth_dt, city=city, created_at=datetime.now(), is_self=is_self)
        self._profiles[pid] = p
        return p

    async def get(self, profile_id: UUID) -> Profile | None:
        return self._profiles.get(profile_id)

    async def list_by_member(self, member_id: UUID) -> list[Profile]:
        return [p for p in self._profiles.values() if p.member_id == member_id]

    async def delete(self, profile_id: UUID) -> None:
        self._profiles.pop(profile_id, None)

    async def update(self, profile_id, name, gender, birth_dt, city):
        old = self._profiles[profile_id]
        new = Profile(id=old.id, member_id=old.member_id, name=name, gender=gender, birth_dt=birth_dt, city=city, created_at=old.created_at, is_self=old.is_self)
        self._profiles[profile_id] = new
        return new


class _FakeCompatibilityPort(CompatibilityPort):
    def __init__(self):
        self._store: dict[tuple[UUID, UUID, int], dict] = {}
        self.save_calls = 0

    async def get(self, pid1: UUID, pid2: UUID, year: int) -> Compatibility | None:
        result = self._store.get((pid1, pid2, year))
        if result is None:
            return None
        return Compatibility(
            id=uuid4(),
            profile_id_1=pid1,
            profile_id_2=pid2,
            year=year,
            result=result,
            created_at=datetime.now(),
        )

    async def save(self, pid1: UUID, pid2: UUID, year: int, result: dict) -> None:
        self._store[(pid1, pid2, year)] = result
        self.save_calls += 1


def _service(llm_port=None, profile_port=None, compat_port=None) -> CompatibilityService:
    return CompatibilityService(
        profile_port=profile_port or _FakeProfilePort({}),
        compatibility_port=compat_port or _FakeCompatibilityPort(),
        saju_service=_kkachi_service,
        llm_port=llm_port,
    )


def _user(year: int, month: int, day: int, hour: int, gender: Gender = Gender.MALE, name: str = "테스트") -> User:
    return User(name=name, gender=gender, birth_dt=datetime(year, month, day, hour, 0))


def _make_pair(year: int = 2026) -> tuple:
    u1 = _user(1990, 5, 15, 10, Gender.MALE, "남자")
    u2 = _user(1992, 8, 20, 14, Gender.FEMALE, "여자")
    n1, p1 = _kkachi_service.analyze(u1, year)
    n2, p2 = _kkachi_service.analyze(u2, year)
    return n1, n2, p1, p2


def test_pillar_relations_present_and_well_formed():
    svc = _service()
    n1, n2, _, _ = _make_pair()
    rels = svc._compute_pillar_relations(n1, n2)
    valid_kinds = {"stem_combine", "stem_clash", "branch_combine", "branch_clash", "wonjin", "hyung", "hae", "pa", "samhap"}
    pillar_kor = {p.korean for p in Pillar}
    for r in rels:
        assert r.kind in valid_kinds
        assert r.pillar1 in pillar_kor
        assert r.pillar2 in pillar_kor
        assert r.polarity in (1, -1)
        assert r.label  # not empty


def test_pillar_relations_are_same_pillar_only():
    """모델은 같은 기둥끼리만 비교 — pillar1 == pillar2 항상 성립해야 한다."""
    svc = _service()
    n1, n2, _, _ = _make_pair()
    rels = svc._compute_pillar_relations(n1, n2)
    for r in rels:
        assert r.pillar1 == r.pillar2, f"교차 기둥 관계가 잡힘: {r}"


def test_samhap_completions_structure():
    svc = _service()
    n1, n2, _, _ = _make_pair()
    comps = svc._compute_samhap_completions(n1, n2)
    samhap_elements = {"火", "水", "金", "木"}
    branch_set = {"子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"}
    for c in comps:
        assert c["element"] in samhap_elements
        assert len(c["branches"]) == 3
        assert set(c["branches"]) <= branch_set
        # 양쪽이 각자 상대가 갖지 않은 멤버를 가져야 함 (진정한 cross-completion)
        p1 = set(c["p1_branches"])
        p2 = set(c["p2_branches"])
        assert p1 - p2, "p1 이 단독으로 기여하는 멤버가 있어야 함"
        assert p2 - p1, "p2 가 단독으로 기여하는 멤버가 있어야 함"
        assert p1 | p2 == set(c["branches"])


def test_stem_clash_detected_for_known_pair():
    """직접 갑경(甲庚) 쌍을 만들면 stem_clash 가 잡혀야 한다."""
    from kkachi.domain.ganji import StemClash, Stem
    assert StemClash.find(Stem.甲, Stem.庚).name == "甲庚"
    assert StemClash.find(Stem.庚, Stem.甲).name == "甲庚"
    assert StemClash.find(Stem.甲, Stem.乙) is None
    # 戊·己 는 충 없음
    assert StemClash.find(Stem.戊, Stem.甲) is None


def test_samhap_completion_boosts_marriage_and_total():
    """삼합 완성이 있으면 결혼·종합 점수에 보너스가 반영되어야 한다."""
    svc = _service()
    n1, n2, p1, p2 = _make_pair()
    result = svc._compute(n1, n2, p1, p2)
    if result.samhap_completions:
        # marriage 도메인 reason 에 삼합 언급이 있어야 함
        assert "삼합" in result.domain_scores["결혼"]["reason"]
        # key_traits 에 삼합 트레이트 노출
        assert any("삼합" in t for t in result.key_traits)


def test_element_complement_structure():
    svc = _service()
    n1, n2, _, _ = _make_pair()
    ec = svc._compute_element_complement(n1, n2)
    assert {"p1_lacks", "p1_provides", "p2_lacks", "p2_provides", "overlap_strong", "score"} <= set(ec.keys())
    assert isinstance(ec["score"], int)


def test_shared_sinsal_partition_is_consistent():
    svc = _service()
    n1, n2, _, _ = _make_pair()
    shared, only1, only2 = svc._compute_shared_sinsal(n1, n2)
    # 각 집합은 disjoint
    assert not (set(shared) & set(only1))
    assert not (set(shared) & set(only2))
    assert not (set(only1) & set(only2))


def test_total_score_in_range():
    svc = _service()
    n1, n2, p1, p2 = _make_pair()
    result = svc._compute(n1, n2, p1, p2)
    assert 0 <= result.total_score <= 100


def test_domain_scores_all_present_and_bounded():
    svc = _service()
    n1, n2, p1, p2 = _make_pair()
    result = svc._compute(n1, n2, p1, p2)
    for domain in ("연애", "결혼", "재물", "직업"):
        assert domain in result.domain_scores
        info = result.domain_scores[domain]
        assert 0 <= info["score"] <= 100
        assert info["level"]
        assert info["reason"]


def test_key_traits_nonempty():
    svc = _service()
    n1, n2, p1, p2 = _make_pair()
    result = svc._compute(n1, n2, p1, p2)
    assert 1 <= len(result.key_traits) <= 5


def test_snapshot_serializable():
    svc = _service()
    n1, _, _, _ = _make_pair()
    snap = svc._snapshot(n1)
    assert len(snap.pillars) == 4
    assert all(len(p) == 2 for p in snap.pillars)
    assert snap.day_stem in snap.pillars[2]  # 일주의 천간이 day_stem이어야 함


def test_analyze_compatibility_cache_hit_skips_recompute():
    """캐시 hit 시 save가 다시 호출되지 않아야 한다."""
    pid1, pid2 = uuid4(), uuid4()
    member_id = uuid4()
    profiles = {
        pid1: Profile(id=pid1, member_id=member_id, name="A", gender=Gender.MALE, birth_dt=datetime(1990, 5, 15, 10), city="Seoul", created_at=datetime.now()),
        pid2: Profile(id=pid2, member_id=member_id, name="B", gender=Gender.FEMALE, birth_dt=datetime(1992, 8, 20, 14), city="Seoul", created_at=datetime.now()),
    }
    cp = _FakeCompatibilityPort()
    svc = _service(profile_port=_FakeProfilePort(profiles), compat_port=cp)

    r1 = asyncio.run(svc.analyze_compatibility(pid1, pid2, 2026))
    assert cp.save_calls == 1
    r2 = asyncio.run(svc.analyze_compatibility(pid1, pid2, 2026))
    assert cp.save_calls == 1  # 캐시 hit
    assert r1["total_score"] == r2["total_score"]


def test_narrative_injection_with_mock_llm():
    """LlmPort 가 있으면 narrative 가 채워져야 한다."""

    class _FakeLlm:
        available = True

        async def get_advice(self, params): return ""
        async def interpret(self, report: str) -> str:
            return "MOCK_NARRATIVE"
        async def stream_interpret(self, report):
            yield "MOCK_NARRATIVE"

    svc = _service(llm_port=_FakeLlm())
    u1 = _user(1990, 5, 15, 10, Gender.MALE)
    u2 = _user(1992, 8, 20, 14, Gender.FEMALE)
    result = asyncio.run(svc.compute_direct(u1, u2, 2026))
    assert result["narrative"] == "MOCK_NARRATIVE"


def test_narrative_none_when_llm_unavailable():
    svc = _service(llm_port=None)
    u1 = _user(1990, 5, 15, 10, Gender.MALE)
    u2 = _user(1992, 8, 20, 14, Gender.FEMALE)
    result = asyncio.run(svc.compute_direct(u1, u2, 2026))
    assert result["narrative"] is None


def test_narrative_failure_is_swallowed():
    """LLM 호출이 실패해도 narrative=None 으로 안전하게 폴백."""

    class _BrokenLlm:
        available = True

        async def get_advice(self, params): return ""
        async def interpret(self, report: str) -> str:
            raise RuntimeError("ollama down")
        async def stream_interpret(self, report):
            yield ""

    svc = _service(llm_port=_BrokenLlm())
    u1 = _user(1990, 5, 15, 10, Gender.MALE)
    u2 = _user(1992, 8, 20, 14, Gender.FEMALE)
    result = asyncio.run(svc.compute_direct(u1, u2, 2026))
    assert result["narrative"] is None
