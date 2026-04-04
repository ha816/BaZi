from dataclasses import asdict
from uuid import UUID

from bazi.application.port.member_port import CompatibilityPort, ProfilePort
from bazi.application.saju_service import SajuService
from bazi.domain.compatibility import CompatibilityResult
from bazi.domain.ganji import Pillar, Sipsin
from bazi.domain.natal import NatalInfo, PostnatalInfo, Sinsal
from bazi.domain.user import User


def _level(score: int) -> str:
    if score >= 80:
        return "최고"
    if score >= 60:
        return "좋음"
    if score >= 40:
        return "보통"
    if score >= 20:
        return "아쉬움"
    return "주의"


def _make_description(natal1: NatalInfo, natal2: NatalInfo, stem_combine: bool, branch_combine: bool, branch_clash: bool) -> str:
    el1 = natal1.my_main_element
    el2 = natal2.my_main_element
    parts = []

    if el1 == el2:
        parts.append(f"두 분은 같은 {el1.name} 기운을 가졌습니다. 비슷한 성향으로 공감대가 넓지만 경쟁심이 생길 수 있습니다.")
    elif el1.generates == el2:
        parts.append(f"두 분은 {el1.name}과 {el2.name}의 관계입니다. {el1.name}이 {el2.name}를 키워주는 상생 관계로, 한 분이 자연스럽게 다른 분을 이끌어주는 사이입니다.")
    elif el2.generates == el1:
        parts.append(f"두 분은 {el2.name}과 {el1.name}의 관계입니다. {el2.name}이 {el1.name}를 키워주는 상생 관계로, 서로를 성장시키는 든든한 파트너입니다.")
    elif el1.overcomes == el2:
        parts.append(f"두 분은 {el1.name}과 {el2.name}의 관계입니다. {el1.name}이 {el2.name}를 억제하는 상극 관계로, 주도권 갈등이 생길 수 있지만 강한 자극이 되기도 합니다.")
    else:
        parts.append(f"두 분은 {el2.name}과 {el1.name}의 관계입니다. {el2.name}이 {el1.name}를 억제하는 상극 관계로, 긴장감이 있지만 강한 끌림이 있습니다.")

    if stem_combine:
        parts.append("일간(日干)이 천간합(天干合)을 이루어 기질적으로 잘 맞습니다.")
    if branch_combine:
        parts.append("일지(日支)가 육합(六合)을 이루어 감정적 교감이 깊습니다.")
    if branch_clash:
        parts.append("일지(日支)가 충(衝)을 이루어 갈등이 생기기 쉬우니 서로 배려가 필요합니다.")

    return " ".join(parts)


def _compute_domain_scores(
    natal1: NatalInfo, natal2: NatalInfo,
    postnatal1: PostnatalInfo, postnatal2: PostnatalInfo,
    branch_combine: bool, branch_clash: bool,
) -> dict[str, dict]:
    def avg_postnatal(key: str) -> float:
        s1 = postnatal1.domain_scores.get(key, {}).get("score", 0)
        s2 = postnatal2.domain_scores.get(key, {}).get("score", 0)
        return (s1 + s2) / 2

    has_dokhwa1 = any(s == Sinsal.桃花 for _, s in natal1.sinsal)
    has_dokhwa2 = any(s == Sinsal.桃花 for _, s in natal2.sinsal)
    has_jaesong1 = any(s in (Sipsin.正財, Sipsin.偏財) for _, s in natal1.sipsin)
    has_jaesong2 = any(s in (Sipsin.正財, Sipsin.偏財) for _, s in natal2.sipsin)
    has_gwansong1 = any(s in (Sipsin.正官, Sipsin.偏官) for _, s in natal1.sipsin)
    has_gwansong2 = any(s in (Sipsin.正官, Sipsin.偏官) for _, s in natal2.sipsin)

    strongest2 = max(natal2.element_stats, key=lambda o: natal2.element_stats.get(o, 0))
    strongest1 = max(natal1.element_stats, key=lambda o: natal1.element_stats.get(o, 0))
    yongshin_boost = 0
    if strongest2.generates == natal1.yongshin:
        yongshin_boost += 1
    if strongest1.generates == natal2.yongshin:
        yongshin_boost += 1

    # 연애
    love = 50
    if branch_combine:
        love += 25
    if branch_clash:
        love -= 20
    if has_dokhwa1 or has_dokhwa2:
        love += 10
    love += int(avg_postnatal("표현·건강운") * 8)
    love = max(0, min(100, love))
    love_reasons = []
    if branch_combine:
        love_reasons.append("일지(日支)가 육합을 이루어 감정 교감이 깊음")
    if branch_clash:
        love_reasons.append("일지(日支) 충(衝)으로 감정 기복에 주의 필요")
    if has_dokhwa1 or has_dokhwa2:
        love_reasons.append("도화살이 있어 이성적 매력이 높음")
    love_reason = ", ".join(love_reasons) if love_reasons else "기본 오행 관계로 산출"

    # 결혼
    marriage = 45 + yongshin_boost * 15
    if branch_combine:
        marriage += 10
    marriage += int(avg_postnatal("대인관계") * 5)
    marriage = max(0, min(100, marriage))
    marriage_reasons = []
    if yongshin_boost:
        marriage_reasons.append(f"상대방의 기운이 내 용신을 보완해 안정적")
    if branch_combine:
        marriage_reasons.append("일지 합으로 장기적 호흡이 잘 맞음")
    marriage_reason = ", ".join(marriage_reasons) if marriage_reasons else "용신·일지 관계로 산출"

    # 재물
    wealth = 45
    if has_jaesong1 and has_jaesong2:
        wealth += 15
    elif has_jaesong1 or has_jaesong2:
        wealth += 8
    wealth += int(avg_postnatal("재물운") * 10)
    wealth = max(0, min(100, wealth))
    wealth_reasons = []
    if has_jaesong1 and has_jaesong2:
        wealth_reasons.append("두 분 모두 재성(財星)을 보유해 금전 감각이 맞음")
    elif has_jaesong1 or has_jaesong2:
        wealth_reasons.append("한 분이 재성을 보유해 재물 흐름을 이끌어줌")
    wealth_reasons.append(f"올해 재물운 평균 {avg_postnatal('재물운'):.1f}점 반영")
    wealth_reason = ", ".join(wealth_reasons)

    # 직업
    career = 45
    if has_gwansong1 and has_gwansong2:
        career += 15
    elif has_gwansong1 or has_gwansong2:
        career += 8
    career += int(avg_postnatal("직장·사회운") * 10)
    career = max(0, min(100, career))
    career_reasons = []
    if has_gwansong1 and has_gwansong2:
        career_reasons.append("두 분 모두 관성(官星)을 보유해 사회적 목표가 비슷함")
    elif has_gwansong1 or has_gwansong2:
        career_reasons.append("한 분이 관성을 보유해 방향을 이끌어줌")
    career_reasons.append(f"올해 직장·사회운 평균 {avg_postnatal('직장·사회운'):.1f}점 반영")
    career_reason = ", ".join(career_reasons)

    return {
        "연애": {"score": love, "level": _level(love), "reason": love_reason},
        "결혼": {"score": marriage, "level": _level(marriage), "reason": marriage_reason},
        "재물": {"score": wealth, "level": _level(wealth), "reason": wealth_reason},
        "직업": {"score": career, "level": _level(career), "reason": career_reason},
    }


class CompatibilityService:
    def __init__(
        self,
        profile_port: ProfilePort,
        compatibility_port: CompatibilityPort,
        saju_service: SajuService,
    ):
        self._profile_port = profile_port
        self._compatibility_port = compatibility_port
        self._saju_service = saju_service

    async def analyze_compatibility(self, pid1: UUID, pid2: UUID, year: int) -> dict:
        lo, hi = (pid1, pid2) if str(pid1) < str(pid2) else (pid2, pid1)

        cached = await self._compatibility_port.get(lo, hi, year)
        if cached:
            return cached.result

        profile1 = await self._profile_port.get(pid1)
        profile2 = await self._profile_port.get(pid2)
        if profile1 is None:
            raise ValueError(f"Profile {pid1} not found")
        if profile2 is None:
            raise ValueError(f"Profile {pid2} not found")

        user1 = User(name=profile1.name, gender=profile1.gender, birth_dt=profile1.birth_dt, city=profile1.city)
        user2 = User(name=profile2.name, gender=profile2.gender, birth_dt=profile2.birth_dt, city=profile2.city)

        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)

        result = asdict(self._compute(natal1, natal2, postnatal1, postnatal2))
        await self._compatibility_port.save(lo, hi, year, result)
        return result

    def _compute(
        self,
        natal1: NatalInfo, natal2: NatalInfo,
        postnatal1: PostnatalInfo, postnatal2: PostnatalInfo,
    ) -> CompatibilityResult:
        stem1 = natal1.saju.stem_of_day_pillar
        stem2 = natal2.saju.stem_of_day_pillar
        branch1 = natal1.saju[Pillar.日柱].branch
        branch2 = natal2.saju[Pillar.日柱].branch

        stem_combine = stem1.combines == stem2
        branch_combine = branch1.combines == branch2
        branch_clash = branch1.clashes == branch2

        raw = 50
        if stem_combine:
            raw += 15
        if branch_combine:
            raw += 20
        if branch_clash:
            raw -= 15

        el1, el2 = stem1.element, stem2.element
        if el1 == el2:
            raw += 5
        elif el1.generates == el2 or el2.generates == el1:
            raw += 8
        elif el1.overcomes == el2 or el2.overcomes == el1:
            raw -= 5

        strongest2 = max(natal2.element_stats, key=lambda o: natal2.element_stats.get(o, 0))
        if strongest2.generates == natal1.yongshin:
            raw += 12
        strongest1 = max(natal1.element_stats, key=lambda o: natal1.element_stats.get(o, 0))
        if strongest1.generates == natal2.yongshin:
            raw += 12

        for oheng in natal1.element_stats:
            c1 = natal1.element_stats.get(oheng, 0)
            c2 = natal2.element_stats.get(oheng, 0)
            if c1 == 0 and c2 > 0:
                raw += 5
            if c2 == 0 and c1 > 0:
                raw += 5
            if c1 >= 3 and c2 >= 3:
                raw -= 5

        total_score = max(0, min(100, raw))

        return CompatibilityResult(
            total_score=total_score,
            domain_scores=_compute_domain_scores(natal1, natal2, postnatal1, postnatal2, branch_combine, branch_clash),
            description=_make_description(natal1, natal2, stem_combine, branch_combine, branch_clash),
            stem_combine=stem_combine,
            branch_combine=branch_combine,
            branch_clash=branch_clash,
        )
