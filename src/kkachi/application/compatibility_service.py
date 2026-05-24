from dataclasses import asdict
from uuid import UUID

from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.compatibility_port import CompatibilityPort
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.domain.compatibility import CompatibilityResult, PillarRelation, PillarSnapshot
from kkachi.domain.ganji import BranchHae, BranchHyung, BranchPa, BranchWonjin, Oheng, Pillar, Sipsin
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User


PILLAR_WEIGHT = {
    Pillar.年柱: 0.3,
    Pillar.月柱: 0.6,
    Pillar.日柱: 1.0,
    Pillar.時柱: 0.5,
}

RELATION_DELTA = {
    "stem_combine": 10,
    "branch_combine": 12,
    "branch_clash": -10,
    "wonjin": -6,
    "hyung": -8,
    "hae": -5,
    "pa": -4,
}


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


def _label(score: int) -> str:
    if score >= 80:
        return "천생연분"
    if score >= 65:
        return "잘 맞는 인연"
    if score >= 45:
        return "무난한 인연"
    return "노력이 필요한 인연"


class CompatibilityService:
    def __init__(
        self,
        profile_port: ProfilePort,
        compatibility_port: CompatibilityPort,
        saju_service: KkachiService,
        llm_port: LlmPort | None = None,
    ):
        self._profile_port = profile_port
        self._compatibility_port = compatibility_port
        self._saju_service = saju_service
        self._llm_port = llm_port

    async def compute_direct(self, user1: User, user2: User, year: int) -> dict:
        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)
        result = self._compute(natal1, natal2, postnatal1, postnatal2)
        await self._inject_narrative(result, natal1, natal2)
        return asdict(result)

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

        result = self._compute(natal1, natal2, postnatal1, postnatal2)
        await self._inject_narrative(result, natal1, natal2)
        result_dict = asdict(result)
        await self._compatibility_port.save(lo, hi, year, result_dict)
        return result_dict

    def _compute(
        self,
        natal1: NatalInfo, natal2: NatalInfo,
        postnatal1: PostnatalInfo, postnatal2: PostnatalInfo,
    ) -> CompatibilityResult:
        pillar_relations = self._compute_pillar_relations(natal1, natal2)
        element_complement = self._compute_element_complement(natal1, natal2)
        shared_sinsal, unique_s1, unique_s2 = self._compute_shared_sinsal(natal1, natal2)

        day_pillar = Pillar.日柱.korean
        day_rels = [r for r in pillar_relations if r.pillar1 == day_pillar and r.pillar2 == day_pillar]
        stem_combine = any(r.kind == "stem_combine" for r in day_rels)
        branch_combine = any(r.kind == "branch_combine" for r in day_rels)
        branch_clash = any(r.kind == "branch_clash" for r in day_rels)

        total_score = self._compute_total_score(pillar_relations, element_complement, len(shared_sinsal))
        domain_scores = self._compute_domain_scores(
            natal1, natal2, postnatal1, postnatal2,
            pillar_relations, shared_sinsal, element_complement,
        )
        key_traits = self._compute_key_traits(pillar_relations, element_complement, shared_sinsal)
        description = self._make_description(natal1, natal2, pillar_relations)

        return CompatibilityResult(
            total_score=total_score,
            label=_label(total_score),
            domain_scores=domain_scores,
            description=description,
            stem_combine=stem_combine,
            branch_combine=branch_combine,
            branch_clash=branch_clash,
            pillar1_snapshot=self._snapshot(natal1),
            pillar2_snapshot=self._snapshot(natal2),
            pillar_relations=pillar_relations,
            element_complement=element_complement,
            shared_sinsal=shared_sinsal,
            unique_sinsal_1=unique_s1,
            unique_sinsal_2=unique_s2,
            key_traits=key_traits,
            narrative=None,
        )

    def _snapshot(self, natal: NatalInfo) -> PillarSnapshot:
        return PillarSnapshot(
            pillars=[str(sb) for sb in natal.saju.pillars.values()],
            day_stem=natal.saju.stem_of_day_pillar.name,
            element_stats={o.name: c for o, c in natal.element_stats.items()},
            my_main_element=natal.my_main_element.name,
            strength_label=natal.strength_label,
            yongshin=natal.yongshin.name,
        )

    def _compute_pillar_relations(
        self, natal1: NatalInfo, natal2: NatalInfo
    ) -> list[PillarRelation]:
        relations: list[PillarRelation] = []
        for p1 in Pillar:
            sb1 = natal1.saju[p1]
            for p2 in Pillar:
                sb2 = natal2.saju[p2]
                k1, k2 = p1.korean, p2.korean

                if sb1.stem.combines == sb2.stem:
                    relations.append(PillarRelation(
                        pillar1=k1, pillar2=k2, kind="stem_combine",
                        label=f"{sb1.stem.name}{sb2.stem.name} 천간합", polarity=1,
                    ))
                if sb1.branch != sb2.branch and sb1.branch.combines == sb2.branch:
                    relations.append(PillarRelation(
                        pillar1=k1, pillar2=k2, kind="branch_combine",
                        label=f"{sb1.branch.name}{sb2.branch.name} 육합", polarity=1,
                    ))
                if sb1.branch.clashes == sb2.branch:
                    relations.append(PillarRelation(
                        pillar1=k1, pillar2=k2, kind="branch_clash",
                        label=f"{sb1.branch.name}{sb2.branch.name} 충", polarity=-1,
                    ))
                for w in BranchWonjin:
                    if {w.first, w.second} == {sb1.branch, sb2.branch}:
                        relations.append(PillarRelation(
                            pillar1=k1, pillar2=k2, kind="wonjin",
                            label=f"{w.first.name}{w.second.name} 원진", polarity=-1,
                        ))
                        break
                if (h := BranchHyung.find(sb1.branch, sb2.branch)):
                    relations.append(PillarRelation(
                        pillar1=k1, pillar2=k2, kind="hyung",
                        label=f"{h.first.name}{h.second.name} 형", polarity=-1,
                    ))
                if (hae := BranchHae.find(sb1.branch, sb2.branch)):
                    relations.append(PillarRelation(
                        pillar1=k1, pillar2=k2, kind="hae",
                        label=f"{hae.first.name}{hae.second.name} 해", polarity=-1,
                    ))
                if (pa := BranchPa.find(sb1.branch, sb2.branch)):
                    relations.append(PillarRelation(
                        pillar1=k1, pillar2=k2, kind="pa",
                        label=f"{pa.first.name}{pa.second.name} 파", polarity=-1,
                    ))
        return relations

    def _compute_element_complement(self, natal1: NatalInfo, natal2: NatalInfo) -> dict:
        p1_lacks: list[str] = []
        p2_lacks: list[str] = []
        p1_provides: list[str] = []
        p2_provides: list[str] = []
        overlap_strong: list[str] = []

        for o in Oheng:
            c1 = natal1.element_stats.get(o, 0)
            c2 = natal2.element_stats.get(o, 0)
            if c1 == 0 and c2 > 0:
                p1_lacks.append(o.name)
                p2_provides.append(o.name)
            if c2 == 0 and c1 > 0:
                p2_lacks.append(o.name)
                p1_provides.append(o.name)
            if c1 >= 3 and c2 >= 3:
                overlap_strong.append(o.name)

        score = (len(p1_lacks) + len(p2_lacks)) * 3 - len(overlap_strong) * 4
        return {
            "p1_lacks": p1_lacks,
            "p1_provides": p1_provides,
            "p2_lacks": p2_lacks,
            "p2_provides": p2_provides,
            "overlap_strong": overlap_strong,
            "score": score,
        }

    def _compute_shared_sinsal(
        self, natal1: NatalInfo, natal2: NatalInfo
    ) -> tuple[list[str], list[str], list[str]]:
        s1 = {s.korean for _, s in natal1.sinsal}
        s2 = {s.korean for _, s in natal2.sinsal}
        return sorted(s1 & s2), sorted(s1 - s2), sorted(s2 - s1)

    def _compute_total_score(
        self,
        pillar_relations: list[PillarRelation],
        element_complement: dict,
        shared_sinsal_count: int,
    ) -> int:
        raw = 50.0
        pillar_by_kor = {p.korean: p for p in Pillar}
        for rel in pillar_relations:
            base = RELATION_DELTA.get(rel.kind, 0)
            w_p1 = PILLAR_WEIGHT.get(pillar_by_kor.get(rel.pillar1), 0.5)
            w_p2 = PILLAR_WEIGHT.get(pillar_by_kor.get(rel.pillar2), 0.5)
            raw += base * (w_p1 + w_p2) / 2
        raw += element_complement.get("score", 0)
        raw += shared_sinsal_count * 2
        return max(0, min(100, int(round(raw))))

    def _compute_domain_scores(
        self,
        natal1: NatalInfo, natal2: NatalInfo,
        postnatal1: PostnatalInfo, postnatal2: PostnatalInfo,
        pillar_relations: list[PillarRelation],
        shared_sinsal: list[str],
        element_complement: dict,
    ) -> dict[str, dict]:
        def avg_postnatal(key: str) -> float:
            s1 = postnatal1.domain_scores.get(key, {}).get("score", 50)
            s2 = postnatal2.domain_scores.get(key, {}).get("score", 50)
            return (s1 + s2) / 2

        day = Pillar.日柱.korean
        wol = Pillar.月柱.korean
        all_branch_rels = [r for r in pillar_relations if r.kind in ("branch_combine", "branch_clash", "wonjin")]
        day_rels = [r for r in pillar_relations if r.pillar1 == day and r.pillar2 == day]
        wol_rels = [r for r in pillar_relations if r.pillar1 == wol and r.pillar2 == wol]

        has_jae1 = any(s in (Sipsin.正財, Sipsin.偏財) for _, s in natal1.sipsin)
        has_jae2 = any(s in (Sipsin.正財, Sipsin.偏財) for _, s in natal2.sipsin)
        has_gwan1 = any(s in (Sipsin.正官, Sipsin.偏官) for _, s in natal1.sipsin)
        has_gwan2 = any(s in (Sipsin.正官, Sipsin.偏官) for _, s in natal2.sipsin)

        # 연애
        love = 50
        love_reasons = []
        for r in all_branch_rels:
            if r.kind == "branch_combine":
                love += 7
                love_reasons.append(f"{r.pillar1}·{r.pillar2} 육합")
            elif r.kind == "branch_clash":
                love -= 7
                love_reasons.append(f"{r.pillar1}·{r.pillar2} 충")
            elif r.kind == "wonjin":
                love -= 4
        if "도화살" in shared_sinsal:
            love += 12
            love_reasons.append("도화살 공유 — 이성적 끌림")
        love += int((avg_postnatal("재능운") - 50) * 0.2)
        love = max(0, min(100, love))
        love_reason = ", ".join(love_reasons[:3]) if love_reasons else "기본 관계로 산출"

        # 결혼
        marriage = 45
        marriage_reasons = []
        for r in day_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                marriage += 12
                marriage_reasons.append("일주 합 — 부부 합")
            elif r.kind == "branch_clash":
                marriage -= 10
                marriage_reasons.append("일주 충 — 갈등 주의")
        if "천을귀인" in shared_sinsal:
            marriage += 10
            marriage_reasons.append("천을귀인 공유 — 위기에 서로 보호")
        strongest1 = max(natal1.element_stats, key=lambda o: natal1.element_stats.get(o, 0))
        strongest2 = max(natal2.element_stats, key=lambda o: natal2.element_stats.get(o, 0))
        if strongest2.generates == natal1.yongshin:
            marriage += 8
            marriage_reasons.append(f"상대 {strongest2.name} 기운이 내 용신({natal1.yongshin.name})을 도움")
        if strongest1.generates == natal2.yongshin:
            marriage += 8
        marriage += int((avg_postnatal("인연운") - 50) * 0.2)
        marriage = max(0, min(100, marriage))
        marriage_reason = ", ".join(marriage_reasons[:3]) if marriage_reasons else "기본 관계로 산출"

        # 재물
        wealth = 45
        wealth_reasons = []
        if has_jae1 and has_jae2:
            wealth += 15
            wealth_reasons.append("두 분 모두 재성(財星) 보유")
        elif has_jae1 or has_jae2:
            wealth += 8
            wealth_reasons.append("한 분이 재성 보유 — 재물 흐름 주도")
        for r in day_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                wealth += 5
        if element_complement.get("score", 0) >= 5:
            wealth += 5
            wealth_reasons.append("오행 보완으로 재물 시너지")
        wealth += int((avg_postnatal("재물운") - 50) * 0.2)
        wealth = max(0, min(100, wealth))
        wealth_reason = ", ".join(wealth_reasons[:3]) if wealth_reasons else "기본 관계로 산출"

        # 직업
        career = 45
        career_reasons = []
        if has_gwan1 and has_gwan2:
            career += 15
            career_reasons.append("두 분 모두 관성(官星) 보유")
        elif has_gwan1 or has_gwan2:
            career += 8
            career_reasons.append("한 분이 관성 보유 — 방향 제시")
        for r in wol_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                career += 6
                career_reasons.append("월주 합 — 사회 환경 조화")
            elif r.kind == "branch_clash":
                career -= 6
        career += int((avg_postnatal("관록운") - 50) * 0.2)
        career = max(0, min(100, career))
        career_reason = ", ".join(career_reasons[:3]) if career_reasons else "기본 관계로 산출"

        return {
            "연애": {"score": love, "level": _level(love), "reason": love_reason},
            "결혼": {"score": marriage, "level": _level(marriage), "reason": marriage_reason},
            "재물": {"score": wealth, "level": _level(wealth), "reason": wealth_reason},
            "직업": {"score": career, "level": _level(career), "reason": career_reason},
        }

    def _compute_key_traits(
        self,
        pillar_relations: list[PillarRelation],
        element_complement: dict,
        shared_sinsal: list[str],
    ) -> list[str]:
        traits: list[str] = []
        day = Pillar.日柱.korean
        pos = sum(1 for r in pillar_relations if r.polarity > 0)
        neg = sum(1 for r in pillar_relations if r.polarity < 0)

        if any(r.kind == "stem_combine" and r.pillar1 == day and r.pillar2 == day for r in pillar_relations):
            traits.append("일주 천간합 — 부부 합")
        if any(r.kind == "branch_combine" and r.pillar1 == day and r.pillar2 == day for r in pillar_relations):
            traits.append("일지 육합 — 감정 교감")
        if pos >= 3:
            traits.append("기운이 잘 맞음")
        if element_complement.get("score", 0) >= 6:
            traits.append("오행 보완 우수")
        elif element_complement.get("overlap_strong"):
            traits.append("오행 과잉 중복 주의")
        if "도화살" in shared_sinsal:
            traits.append("이성적 매력 공유")
        if "천을귀인" in shared_sinsal:
            traits.append("귀인 공조")
        if neg >= 3:
            traits.append("갈등 요소 다수 — 배려 필요")
        if not traits:
            traits.append("평이한 인연")
        return traits[:5]

    def _make_description(
        self, natal1: NatalInfo, natal2: NatalInfo,
        pillar_relations: list[PillarRelation],
    ) -> str:
        el1, el2 = natal1.my_main_element, natal2.my_main_element
        parts: list[str] = []
        if el1 == el2:
            parts.append(f"두 분은 같은 {el1.name} 기운을 가졌습니다. 공감대가 넓지만 경쟁심이 생길 수 있습니다.")
        elif el1.generates == el2:
            parts.append(f"{el1.name}이 {el2.name}를 키워주는 상생 관계로, 한 분이 자연스럽게 다른 분을 이끌어줍니다.")
        elif el2.generates == el1:
            parts.append(f"{el2.name}이 {el1.name}를 키워주는 상생 관계로, 서로를 성장시키는 든든한 파트너입니다.")
        elif el1.overcomes == el2:
            parts.append(f"{el1.name}이 {el2.name}를 억제하는 상극 관계로, 주도권 갈등이 있을 수 있지만 강한 자극이 됩니다.")
        else:
            parts.append(f"{el2.name}이 {el1.name}를 억제하는 상극 관계로, 긴장감이 있지만 강한 끌림이 있습니다.")

        day = Pillar.日柱.korean
        for r in pillar_relations:
            if r.pillar1 != day or r.pillar2 != day:
                continue
            if r.kind == "stem_combine":
                parts.append("일간이 천간합(天干合)을 이루어 기질이 잘 맞습니다.")
            elif r.kind == "branch_combine":
                parts.append("일지가 육합(六合)을 이루어 감정 교감이 깊습니다.")
            elif r.kind == "branch_clash":
                parts.append("일지가 충(衝)을 이루어 서로 배려가 필요합니다.")
        return " ".join(parts)

    async def _inject_narrative(
        self, result: CompatibilityResult, natal1: NatalInfo, natal2: NatalInfo,
    ) -> None:
        if not self._llm_port or not self._llm_port.available:
            return
        try:
            prompt = self._build_narrative_prompt(result, natal1, natal2)
            result.narrative = await self._llm_port.interpret(prompt)
        except Exception:
            result.narrative = None

    def _build_narrative_prompt(
        self, result: CompatibilityResult, natal1: NatalInfo, natal2: NatalInfo,
    ) -> str:
        day = Pillar.日柱.korean
        day_rels = [r.label for r in result.pillar_relations if r.pillar1 == day and r.pillar2 == day]
        other_rels = [r.label for r in result.pillar_relations if r.pillar1 != day or r.pillar2 != day][:3]
        key_rels = day_rels + other_rels
        scores_line = " / ".join(f"{k} {v['score']}" for k, v in result.domain_scores.items())
        return (
            "두 분의 사주 궁합 데이터입니다. 친근한 존댓말로 400자 이내로 풀어주세요.\n"
            f"- 첫 번째 분: 일간 {natal1.saju.stem_of_day_pillar.name}, 주오행 {natal1.my_main_element.name}, "
            f"{natal1.strength_label}, 용신 {natal1.yongshin.name}\n"
            f"- 두 번째 분: 일간 {natal2.saju.stem_of_day_pillar.name}, 주오행 {natal2.my_main_element.name}, "
            f"{natal2.strength_label}, 용신 {natal2.yongshin.name}\n"
            f"- 핵심 관계: {', '.join(key_rels) if key_rels else '특별한 합·충 없음'}\n"
            f"- 공유 신살: {', '.join(result.shared_sinsal) if result.shared_sinsal else '없음'}\n"
            f"- 종합 점수: {result.total_score}점 ({result.label})\n"
            f"- 영역별: {scores_line}\n"
            f"- 키 트레이트: {', '.join(result.key_traits)}\n"
            "두 분 관계의 강점과 약점, 실천 조언을 차분히 정리해주세요."
        )
