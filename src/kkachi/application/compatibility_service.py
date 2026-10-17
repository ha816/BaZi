from collections import Counter
from dataclasses import asdict
from uuid import UUID

from kkachi.application.compatibility_character import build_compat_character
from kkachi.application.compatibility_prompt import format_chat_context, format_narrative_prompt
from kkachi.application.compatibility_prose import (
    advice_for,
    compute_key_traits,
    make_description,
    narrate_domain,
)
from kkachi.application.compatibility_summary import build_compat_summary
from kkachi.application.compatibility_zodiac import build_compat_zodiac
from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.compatibility_port import CompatibilityPort
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.self_quiz import score_sipsin
from kkachi.application.util.compatibility_meta import (
    DOMAIN_LABEL_BY_REL,
    RELATION_SHORT_LABEL,
    RelationType,
    label_for,
    level_for,
)
from kkachi.domain.compatibility import CompatibilityResult, PillarRelation, PillarSnapshot
from kkachi.domain.ganji import (
    SAMHAP_GROUPS,
    BranchHae,
    BranchHyung,
    BranchPa,
    BranchWonjin,
    Oheng,
    Pillar,
    Sipsin,
    Stem,
    StemClash,
)
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
    "stem_clash": -8,
    "branch_combine": 12,
    "branch_clash": -10,
    "wonjin": -6,
    "hyung": -8,
    "hae": -5,
    "pa": -4,
    "samhap": 8,
}

SAMHAP_COMPLETION_BONUS = 12   # 삼합 완성(3-of-3) per group
SAMHAP_COMPLETION_MARRIAGE = 15  # 결혼 도메인 가산

def build_compat_share_card(name1: str, name2: str, relation_type: str, result: dict) -> dict:
    """궁합 공유 카드(/s/{id}, kind="compat") 스냅샷 — 점수·라벨·영역 점수·특징·캐릭터 칭호만. 생년월일 없음."""
    def day(snapshot: dict | None) -> dict:
        ds = (snapshot or {}).get("day_stem", "")
        stem = Stem.from_char(ds) if ds else None
        # 색은 일간 글자 자체의 오행(주오행 my_main_element가 아님 — 캐릭터 역할 오행과 같은 기준)
        return {"stem": ds, "korean": stem.korean if stem else "", "element": stem.element.name if stem else "",
                "hour_unknown": bool((snapshot or {}).get("hour_unknown"))}  # 세 기둥 고지(R2) — 카드도 정직하게
    n1, n2 = name1 or "첫 번째 분", name2 or "두 번째 분"
    ch = result.get("character")
    character = {
        "title": ch["title"],
        "key": ch["key"],
        "roles": [{"name": r["name"], "element": r["element"], "emoji": r["emoji"]} for r in ch["roles"]],
        "desc": ch["desc"].replace("{p1}", n1).replace("{p2}", n2),
    } if ch else None
    return {
        "kind": "compat",
        "name1": name1,
        "name2": name2,
        "relation_type": relation_type,
        "relation_label": RELATION_SHORT_LABEL.get(relation_type, "연인"),
        "total_score": result["total_score"],
        "label": result.get("label", ""),
        "description": result.get("description", ""),
        "domain_scores": {k: {"score": v.get("score", 0), "level": v.get("level", "")} for k, v in (result.get("domain_scores") or {}).items()},
        "key_traits": (result.get("key_traits") or [])[:3],
        "shared_sinsal": (result.get("shared_sinsal") or [])[:3],
        "p1": day(result.get("pillar1_snapshot")),
        "p2": day(result.get("pillar2_snapshot")),
        "character": character,  # 칭호·역할·설명(이름 채움) — specs/compatibility/character.md §7
    }


def _signal(kind: str, text: str) -> dict:
    """영역 점수의 근거 한 조각 — kind는 harmony·clash·sinsal·sipsin·element·fortune(DOMAIN_KIND_PHRASE_BY_REL 키)."""
    return {"kind": kind, "text": text}


def _apply_year_fortune(score: int, pros: list[dict], cons: list[dict], key: str, avg: float) -> int:
    """두 사람 올해 영역운 평균(50 기준)을 ±로 더하고 0~100으로 자른다 — 모든 영역 점수의 마지막 단계."""
    if avg >= 65:
        pros.append(_signal("fortune", f"올해 {key} 양호({avg:.0f})"))
    elif avg <= 35:
        cons.append(_signal("fortune", f"올해 {key} 부진({avg:.0f})"))
    return max(0, min(100, score + int((avg - 50) * 0.2)))


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

    async def compute_direct(
        self, user1: User, user2: User, year: int,
        relation_type: RelationType = "lover",
    ) -> dict:
        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)
        result = asdict(self._compute(natal1, natal2, postnatal1, postnatal2, relation_type))
        result["summary"] = build_compat_summary(result)
        result["zodiac"] = build_compat_zodiac(result, year)
        result["character"] = build_compat_character(result, relation_type)
        return result

    def build_chat_context(
        self,
        user1: User, user2: User, year: int,
        name1: str = "", name2: str = "",
        relation_type: RelationType = "lover",
    ) -> str:
        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)
        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        return format_chat_context(
            result, natal1, natal2, user1, user2, year, name1, name2, relation_type,
        )

    def build_narrative_prompt(
        self, user1: User, user2: User, year: int,
        relation_type: RelationType = "lover",
    ) -> str:
        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)
        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        return format_narrative_prompt(result, natal1, natal2, relation_type)

    async def analyze_compatibility(
        self, pid1: UUID, pid2: UUID, year: int,
        relation_type: RelationType = "lover",
    ) -> dict:
        lo, hi = (pid1, pid2) if str(pid1) < str(pid2) else (pid2, pid1)

        cached = await self._compatibility_port.get(lo, hi, year)
        if cached:
            result_dict = self._apply_relation_prose(cached.result, relation_type)
            result_dict["summary"] = build_compat_summary(result_dict)  # 옛 캐시에도 붙도록 매번 계산
            result_dict["zodiac"] = build_compat_zodiac(result_dict, year)
            result_dict["character"] = build_compat_character(result_dict, relation_type)
            return result_dict

        profile1 = await self._profile_port.get(pid1)
        profile2 = await self._profile_port.get(pid2)
        if profile1 is None:
            raise ValueError(f"Profile {pid1} not found")
        if profile2 is None:
            raise ValueError(f"Profile {pid2} not found")

        user1 = User(name=profile1.name, gender=profile1.gender, birth_dt=profile1.birth_dt, city=profile1.city, hour_unknown=profile1.birth_hour_unknown)
        user2 = User(name=profile2.name, gender=profile2.gender, birth_dt=profile2.birth_dt, city=profile2.city, hour_unknown=profile2.birth_hour_unknown)

        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)

        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        result_dict = asdict(result)
        await self._compatibility_port.save(lo, hi, year, result_dict)
        result_dict["summary"] = build_compat_summary(result_dict)
        result_dict["zodiac"] = build_compat_zodiac(result_dict, year)
        result_dict["character"] = build_compat_character(result_dict, relation_type)
        return result_dict

    def _apply_relation_prose(self, result_dict: dict, rel: RelationType) -> dict:
        """캐시 hit 시: 점수·pros·cons는 그대로, 관계 유형 기반 prose만 재생성."""
        result_dict["label"] = label_for(result_dict.get("total_score", 0), rel)
        label_map = DOMAIN_LABEL_BY_REL[rel]
        for domain, info in result_dict.get("domain_scores", {}).items():
            info["display_name"] = label_map.get(domain, domain)
            score = info.get("score", 0)
            pros = info.get("pros") or []
            cons = info.get("cons") or []
            advice = advice_for(domain, score, pros, cons, rel)
            info["narrative"] = narrate_domain(domain, score, pros, cons, rel, advice)
        return result_dict

    def _compute(
        self,
        natal1: NatalInfo, natal2: NatalInfo,
        postnatal1: PostnatalInfo, postnatal2: PostnatalInfo,
        relation_type: RelationType = "lover",
    ) -> CompatibilityResult:
        pillar_relations = self._compute_pillar_relations(natal1, natal2)
        samhap_completions = self._compute_samhap_completions(natal1, natal2)
        element_complement = self._compute_element_complement(natal1, natal2)
        shared_sinsal, unique_s1, unique_s2 = self._compute_shared_sinsal(natal1, natal2)

        day_pillar = Pillar.日柱.korean
        day_rels = [r for r in pillar_relations if r.pillar1 == day_pillar and r.pillar2 == day_pillar]
        stem_combine = any(r.kind == "stem_combine" for r in day_rels)
        branch_combine = any(r.kind == "branch_combine" for r in day_rels)
        branch_clash = any(r.kind == "branch_clash" for r in day_rels)

        total_score = self._compute_total_score(
            pillar_relations, element_complement, len(shared_sinsal), len(samhap_completions),
        )
        domain_scores = self._compute_domain_scores(
            natal1, natal2, postnatal1, postnatal2,
            pillar_relations, shared_sinsal, element_complement, samhap_completions,
            relation_type,
        )
        key_traits = compute_key_traits(
            pillar_relations, element_complement, shared_sinsal, samhap_completions,
        )
        description = make_description(natal1, natal2, pillar_relations)

        return CompatibilityResult(
            total_score=total_score,
            label=label_for(total_score, relation_type),
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
            samhap_completions=samhap_completions,
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
            hour_unknown=natal.saju.hour_unknown,
            sibi_sinsal=list(natal.sibi_sinsal),
            strength_pct=natal.strength_pct,
            sipsin=dict(Counter(s.name for _, s in natal.sipsin)),
            sipsin_score={name: round(v["score"], 1) for name, v in score_sipsin({
                "pillars": [str(sb) for sb in natal.saju.pillars.values()],
                "sipsin": [{"char": ch, "sipsin_name": s.name} for ch, s in natal.sipsin],
                "jizan_gan": [[{"stem": ch, "sipsin_name": s.name, "weight": w} for ch, s, w, _ in pjg] for pjg in natal.jizan_gan],
            }).items()},
        )

    def _compute_pillar_relations(
        self, natal1: NatalInfo, natal2: NatalInfo
    ) -> list[PillarRelation]:
        """같은 기둥(年-年, 月-月, 日-日, 時-時) 4쌍에 대해 7관계 + 반합 검출.
        한쪽이라도 출생시간 미상이면 時-時 쌍은 건너뛴다 (근거 없는 점수를 만들지 않음)."""
        relations: list[PillarRelation] = []
        for p in Pillar:
            if p not in natal1.saju.pillars or p not in natal2.saju.pillars:
                continue
            sb1 = natal1.saju[p]
            sb2 = natal2.saju[p]
            k = p.korean

            if sb1.stem.combines == sb2.stem:
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="stem_combine",
                    label=f"{sb1.stem.name}{sb2.stem.name} 천간합", polarity=1,
                ))
            if (sc := StemClash.find(sb1.stem, sb2.stem)):
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="stem_clash",
                    label=f"{sc.first.name}{sc.second.name} 천간충", polarity=-1,
                ))
            if sb1.branch != sb2.branch and sb1.branch.combines == sb2.branch:
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="branch_combine",
                    label=f"{sb1.branch.name}{sb2.branch.name} 육합", polarity=1,
                ))
            if sb1.branch.clashes == sb2.branch:
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="branch_clash",
                    label=f"{sb1.branch.name}{sb2.branch.name} 충", polarity=-1,
                ))
            for w in BranchWonjin:
                if {w.first, w.second} == {sb1.branch, sb2.branch}:
                    relations.append(PillarRelation(
                        pillar1=k, pillar2=k, kind="wonjin",
                        label=f"{w.first.name}{w.second.name} 원진", polarity=-1,
                    ))
                    break
            if (h := BranchHyung.find(sb1.branch, sb2.branch)):
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="hyung",
                    label=f"{h.first.name}{h.second.name} 형", polarity=-1,
                ))
            if (hae := BranchHae.find(sb1.branch, sb2.branch)):
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="hae",
                    label=f"{hae.first.name}{hae.second.name} 해", polarity=-1,
                ))
            if (pa := BranchPa.find(sb1.branch, sb2.branch)):
                relations.append(PillarRelation(
                    pillar1=k, pillar2=k, kind="pa",
                    label=f"{pa.first.name}{pa.second.name} 파", polarity=-1,
                ))
            for group, result_el in SAMHAP_GROUPS:
                if (
                    sb1.branch.name in group
                    and sb2.branch.name in group
                    and sb1.branch != sb2.branch
                ):
                    relations.append(PillarRelation(
                        pillar1=k, pillar2=k, kind="samhap",
                        label=f"{sb1.branch.name}{sb2.branch.name} 반합({result_el})",
                        polarity=1,
                    ))
                    break
        return relations

    def _compute_samhap_completions(
        self, natal1: NatalInfo, natal2: NatalInfo,
    ) -> list[dict]:
        """두 사람의 8지지를 합쳐 삼합국이 완성되는 경우만 반환 (한쪽 단독 완성 제외)."""
        b1 = {sb.branch.name for sb in natal1.saju.pillars.values()}
        b2 = {sb.branch.name for sb in natal2.saju.pillars.values()}
        completions: list[dict] = []
        for group, result_el in SAMHAP_GROUPS:
            in_p1 = group & b1
            in_p2 = group & b2
            if (in_p1 | in_p2) != group:
                continue
            # 양쪽이 각자 상대가 갖지 않은 멤버를 가져야 진정한 cross-completion
            if not (in_p1 - in_p2) or not (in_p2 - in_p1):
                continue
            completions.append({
                "element": result_el,
                "branches": sorted(group),
                "p1_branches": sorted(in_p1),
                "p2_branches": sorted(in_p2),
            })
        return completions

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
        samhap_completion_count: int,
    ) -> int:
        raw = 50.0
        pillar_by_kor = {p.korean: p for p in Pillar}
        for rel in pillar_relations:
            base = RELATION_DELTA.get(rel.kind, 0)
            w = PILLAR_WEIGHT.get(pillar_by_kor.get(rel.pillar1), 0.5)
            raw += base * w
        raw += element_complement.get("score", 0)
        raw += shared_sinsal_count * 2
        raw += samhap_completion_count * SAMHAP_COMPLETION_BONUS
        return max(0, min(100, int(round(raw))))

    def _compute_domain_scores(
        self,
        natal1: NatalInfo, natal2: NatalInfo,
        postnatal1: PostnatalInfo, postnatal2: PostnatalInfo,
        pillar_relations: list[PillarRelation],
        shared_sinsal: list[str],
        element_complement: dict,
        samhap_completions: list[dict],
        relation_type: RelationType = "lover",
    ) -> dict[str, dict]:
        """영역 4개(연애·결혼·재물·직업) 점수 — 공통 재료(일주·월주 관계, 십신 보유, 올해 영역운 평균)를 만들어 영역별 _score_*에 넘긴다."""
        day, wol = Pillar.日柱.korean, Pillar.月柱.korean
        day_rels = [r for r in pillar_relations if r.pillar1 == day and r.pillar2 == day]
        wol_rels = [r for r in pillar_relations if r.pillar1 == wol and r.pillar2 == wol]

        def has(natal: NatalInfo, *kinds: Sipsin) -> bool:
            return any(s in kinds for _, s in natal.sipsin)

        def avg(key: str) -> float:
            s1 = postnatal1.domain_scores.get(key, {}).get("score", 50)
            s2 = postnatal2.domain_scores.get(key, {}).get("score", 50)
            return (s1 + s2) / 2

        has_jae1, has_jae2 = has(natal1, Sipsin.正財, Sipsin.偏財), has(natal2, Sipsin.正財, Sipsin.偏財)
        has_gwan1, has_gwan2 = has(natal1, Sipsin.正官, Sipsin.偏官), has(natal2, Sipsin.正官, Sipsin.偏官)
        both_sik = has(natal1, Sipsin.食神, Sipsin.傷官) and has(natal2, Sipsin.食神, Sipsin.傷官)
        both_in = has(natal1, Sipsin.偏印, Sipsin.正印) and has(natal2, Sipsin.偏印, Sipsin.正印)

        scored = {
            "연애": self._score_love(pillar_relations, shared_sinsal, both_sik, avg("재능운")),
            "결혼": self._score_marriage(natal1, natal2, day_rels, shared_sinsal, samhap_completions, both_in, avg("인연운")),
            "재물": self._score_wealth(has_jae1, has_jae2, both_sik, day_rels, element_complement, avg("재물운")),
            "직업": self._score_career(has_gwan1, has_gwan2, both_in, wol_rels, shared_sinsal, avg("관록운")),
        }
        label_map = DOMAIN_LABEL_BY_REL[relation_type]
        out: dict[str, dict] = {}
        for domain, (score, pros, cons) in scored.items():
            advice = advice_for(domain, score, pros, cons, relation_type)
            parts = [p["text"] for p in (pros + cons)[:3]]
            out[domain] = {
                "score": score,
                "level": level_for(score),
                "reason": ", ".join(parts) if parts else "기본 관계로 산출",
                "display_name": label_map.get(domain, domain),
                "pros": pros,
                "cons": cons,
                "narrative": narrate_domain(domain, score, pros, cons, relation_type, advice),
            }
        return out

    def _score_love(
        self, pillar_relations: list[PillarRelation], shared_sinsal: list[str], both_sik: bool, talent_avg: float,
    ) -> tuple[int, list[dict], list[dict]]:
        """연애 — 지지 육합·충·원진(모든 기둥) · 삼합 반합 · 도화살 공유 · 양쪽 식상 · 올해 재능운"""
        score = 50
        pros: list[dict] = []
        cons: list[dict] = []
        for r in pillar_relations:
            if r.kind == "branch_combine":
                score += 7
                pros.append(_signal("harmony", f"{r.pillar1} 육합"))
            elif r.kind == "branch_clash":
                score -= 7
                cons.append(_signal("clash", f"{r.pillar1} 충"))
            elif r.kind == "wonjin":
                score -= 4
                cons.append(_signal("clash", f"{r.pillar1} 원진"))
        if any(r.kind == "samhap" for r in pillar_relations):
            score += 8
            pros.append(_signal("harmony", "삼합 반합"))
        if "도화살" in shared_sinsal:
            score += 12
            pros.append(_signal("sinsal", "도화살 공유 — 이성적 끌림"))
        if both_sik:
            score += 5
            pros.append(_signal("sipsin", "두 분 모두 식상 — 표현력·매력 풍부"))
        return _apply_year_fortune(score, pros, cons, "재능운", talent_avg), pros, cons

    def _score_marriage(
        self, natal1: NatalInfo, natal2: NatalInfo, day_rels: list[PillarRelation], shared_sinsal: list[str],
        samhap_completions: list[dict], both_in: bool, yeon_avg: float,
    ) -> tuple[int, list[dict], list[dict]]:
        """결혼 — 일주 합·충 · 천을/월덕귀인 공유 · 삼합 완성 · 상대 최다 오행이 내 용신을 생 · 양쪽 인성 · 올해 인연운"""
        score = 45
        pros: list[dict] = []
        cons: list[dict] = []
        for r in day_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                score += 12
                pros.append(_signal("harmony", "일주 합 — 부부 합"))
            elif r.kind == "branch_clash":
                score -= 10
                cons.append(_signal("clash", "일주 충 — 갈등 주의"))
            elif r.kind == "stem_clash":
                score -= 8
                cons.append(_signal("clash", "일주 천간충"))
        if "천을귀인" in shared_sinsal:
            score += 10
            pros.append(_signal("sinsal", "천을귀인 공유 — 위기에 서로 보호"))
        if "월덕귀인" in shared_sinsal:
            score += 6
            pros.append(_signal("sinsal", "월덕귀인 공유 — 평화로운 흐름"))
        if samhap_completions:
            score += SAMHAP_COMPLETION_MARRIAGE
            pros.append(_signal("harmony", f"삼합({samhap_completions[0]['element']}국) 완성"))
        strongest1 = max(natal1.element_stats, key=lambda o: natal1.element_stats.get(o, 0))
        strongest2 = max(natal2.element_stats, key=lambda o: natal2.element_stats.get(o, 0))
        if strongest2.generates == natal1.yongshin:
            score += 8
            pros.append(_signal("element", f"상대 {strongest2.name}이 내 용신({natal1.yongshin.name}) 도움"))
        if strongest1.generates == natal2.yongshin:
            score += 8
            pros.append(_signal("element", f"내 {strongest1.name}이 상대 용신({natal2.yongshin.name}) 도움"))
        if both_in:
            score += 4
            pros.append(_signal("sipsin", "두 분 모두 인성 — 정서적 안정"))
        return _apply_year_fortune(score, pros, cons, "인연운", yeon_avg), pros, cons

    def _score_wealth(
        self, has_jae1: bool, has_jae2: bool, both_sik: bool, day_rels: list[PillarRelation],
        element_complement: dict, jae_avg: float,
    ) -> tuple[int, list[dict], list[dict]]:
        """재물 — 재성 보유(양쪽·한쪽·없음) · 식상생재 · 일주 합 · 오행 보완 · 올해 재물운"""
        score = 45
        pros: list[dict] = []
        cons: list[dict] = []
        if has_jae1 and has_jae2:
            score += 15
            pros.append(_signal("sipsin", "두 분 모두 재성(財星) 보유"))
        elif has_jae1 or has_jae2:
            score += 8
            pros.append(_signal("sipsin", "한 분 재성 보유 — 재물 주도"))
        else:
            cons.append(_signal("sipsin", "양쪽 재성 부재 — 재물 흐름 약함"))
        if both_sik and (has_jae1 or has_jae2):
            score += 5
            pros.append(_signal("sipsin", "식상생재(食傷生財) — 재물 창출력"))
        for r in day_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                score += 5
                pros.append(_signal("harmony", "일주 합"))
        if element_complement.get("score", 0) >= 5:
            score += 5
            pros.append(_signal("element", "오행 보완 시너지"))
        elif element_complement.get("overlap_strong"):
            cons.append(_signal("element", "오행 과잉 중복"))
        return _apply_year_fortune(score, pros, cons, "재물운", jae_avg), pros, cons

    def _score_career(
        self, has_gwan1: bool, has_gwan2: bool, both_in: bool, wol_rels: list[PillarRelation],
        shared_sinsal: list[str], gwan_avg: float,
    ) -> tuple[int, list[dict], list[dict]]:
        """직업 — 관성 보유(양쪽·한쪽·없음) · 관인상생 · 월주 합·충 · 문창귀인 공유 · 올해 관록운"""
        score = 45
        pros: list[dict] = []
        cons: list[dict] = []
        if has_gwan1 and has_gwan2:
            score += 15
            pros.append(_signal("sipsin", "두 분 모두 관성(官星) 보유"))
        elif has_gwan1 or has_gwan2:
            score += 8
            pros.append(_signal("sipsin", "한 분 관성 보유 — 방향 제시"))
        else:
            cons.append(_signal("sipsin", "양쪽 관성 부재 — 사회적 방향성 약함"))
        if both_in and (has_gwan1 or has_gwan2):
            score += 5
            pros.append(_signal("sipsin", "관인상생(官印相生) — 직장 안정"))
        for r in wol_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                score += 6
                pros.append(_signal("harmony", "월주 합 — 사회 환경 조화"))
            elif r.kind == "branch_clash":
                score -= 6
                cons.append(_signal("clash", "월주 충"))
        if "문창귀인" in shared_sinsal:
            score += 5
            pros.append(_signal("sinsal", "문창귀인 공유 — 전문성 코드"))
        return _apply_year_fortune(score, pros, cons, "관록운", gwan_avg), pros, cons
