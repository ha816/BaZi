from dataclasses import asdict
from typing import Literal
from uuid import UUID

from kkachi.application.kkachi_service import KkachiService
from kkachi.application.port.compatibility_port import CompatibilityPort
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.domain.compatibility import CompatibilityResult, PillarRelation, PillarSnapshot
from kkachi.domain.ganji import (
    SAMHAP_GROUPS, BranchHae, BranchHyung, BranchPa, BranchWonjin,
    Oheng, Pillar, Sipsin, StemClash,
)
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User


RelationType = Literal["lover", "friend", "family"]

RELATION_LABEL: dict[RelationType, str] = {
    "lover":  "연인·부부",
    "friend": "친구·동료",
    "family": "가족",
}


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

DOMAIN_LABEL_BY_REL: dict[RelationType, dict[str, str]] = {
    "lover":  {"연애": "연애",       "결혼": "결혼",        "재물": "재물",       "직업": "직업"},
    "friend": {"연애": "친밀감",     "결혼": "신뢰·약속",   "재물": "재물 협력",  "직업": "협업"},
    "family": {"연애": "정서 교감",  "결혼": "유대",        "재물": "가운(家運)", "직업": "함께 이루는 일"},
}

DOMAIN_INTROS_BY_REL: dict[RelationType, dict[str, list[tuple[int, str]]]] = {
    "lover": {
        "연애": [
            (70, "감정선이 가장 자연스럽게 통하는 흐름이에요."),
            (55, "감정 교감이 부드럽게 이어지는 사이예요."),
            (40, "끌림은 있지만 호흡을 맞춰갈 여지가 있어요."),
            (0,  "감정선이 엇갈리기 쉬워 천천히 다가가는 게 좋아요."),
        ],
        "결혼": [
            (70, "장기 동반자로 안정적으로 어우러지는 결합이에요."),
            (55, "함께 살아가는 호흡이 무난하게 맞춰지는 사이예요."),
            (40, "결혼이라는 결정 앞에 노력이 더해져야 하는 흐름이에요."),
            (0,  "결혼 영역에선 충돌 요소가 많아 거리감 관리가 필요해요."),
        ],
        "재물": [
            (70, "재물 흐름이 활발하게 도는 시기예요."),
            (55, "재물 관리가 큰 무리 없이 안정적인 흐름이에요."),
            (40, "재물 흐름이 평이해 작은 결정도 신중함이 필요해요."),
            (0,  "재물 영역에선 보수적 운용이 권장되는 흐름이에요."),
        ],
        "직업": [
            (70, "사회적 호흡이 잘 맞아 함께 성취를 끌어내는 흐름이에요."),
            (55, "직업·역할 면에서 무난하게 어우러지는 사이예요."),
            (40, "사회적 방향에서 의견을 자주 맞춰야 하는 흐름이에요."),
            (0,  "직업 영역에선 각자 영역을 분리하는 게 안전한 흐름이에요."),
        ],
    },
    "friend": {
        "연애": [
            (70, "마음이 가장 편하게 닿는 사이예요."),
            (55, "친밀한 교감이 자연스럽게 이어지는 사이예요."),
            (40, "친해질 여지는 있지만 호흡을 맞춰갈 시간이 필요해요."),
            (0,  "처음엔 거리가 느껴질 수 있어 천천히 다가가는 게 좋아요."),
        ],
        "결혼": [
            (70, "오래 함께 갈 수 있는 신뢰가 단단한 사이예요."),
            (55, "약속을 무난하게 지키며 관계가 길게 이어지는 사이예요."),
            (40, "신뢰를 쌓으려면 작은 약속부터 챙겨가야 하는 흐름이에요."),
            (0,  "약속·역할이 어긋나기 쉬워 명확히 정리해두면 좋아요."),
        ],
        "재물": [
            (70, "함께 도모하는 일에서 재물 흐름이 활발하게 도는 시기예요."),
            (55, "공동 지출·협업이 큰 무리 없이 흘러가는 사이예요."),
            (40, "돈 얘기는 신중하게, 경계를 분명히 정해두면 좋아요."),
            (0,  "공동 자금·투자는 보류하고 분리해 운영하는 게 안전해요."),
        ],
        "직업": [
            (70, "팀워크가 잘 맞아 함께 성취를 끌어내는 흐름이에요."),
            (55, "역할 분담이 무난하게 이뤄지는 사이예요."),
            (40, "협업 시 의견 차이를 자주 조율해야 하는 흐름이에요."),
            (0,  "업무 영역은 분리하고 각자 영역에 집중하는 게 안전해요."),
        ],
    },
    "family": {
        "연애": [
            (70, "정서적 유대가 가장 깊게 닿는 사이예요."),
            (55, "감정의 흐름이 부드럽게 이어지는 가족이에요."),
            (40, "정서적 거리감이 있어 작은 표현을 더해가면 좋아요."),
            (0,  "감정이 엇갈리기 쉬워 서로의 페이스를 존중해주세요."),
        ],
        "결혼": [
            (70, "가족 유대가 단단하게 자리잡은 흐름이에요."),
            (55, "함께 살아가는 호흡이 무난하게 맞춰지는 가족이에요."),
            (40, "유대를 쌓으려면 함께 보내는 시간이 더 필요한 흐름이에요."),
            (0,  "거리감 관리가 필요한 흐름, 개인 영역을 존중해주세요."),
        ],
        "재물": [
            (70, "가운(家運)이 활발하게 도는 시기예요."),
            (55, "가운이 큰 무리 없이 안정적으로 흘러가는 흐름이에요."),
            (40, "가운 흐름이 평이해 함께 점검할 시점이에요."),
            (0,  "가운 영역에선 보수적 운용이 권장되는 흐름이에요."),
        ],
        "직업": [
            (70, "함께 도모하는 일에서 호흡이 잘 맞는 흐름이에요."),
            (55, "함께 이루는 일이 무난하게 진행되는 흐름이에요."),
            (40, "함께 일할 땐 방향을 자주 맞춰야 하는 흐름이에요."),
            (0,  "각자 영역을 분리해 운영하는 게 안전한 흐름이에요."),
        ],
    },
}

DOMAIN_KIND_PHRASE_BY_REL: dict[RelationType, dict[str, dict[str, str]]] = {
    "lover": {
        "연애": {
            "harmony": "감정선이 부드럽게 맞물리는 자리",
            "clash":   "감정 기복이 끼어들기 쉬운 자리",
            "sinsal":  "끌림의 코드가 살아 있는 자리",
            "sipsin":  "타고난 매력·표현이 통하는 자리",
            "element": "오행 흐름이 받쳐주는 자리",
            "fortune": "올해 흐름이 영향을 더하는 자리",
        },
        "결혼": {
            "harmony": "부부 호흡이 자연스럽게 맞는 자리",
            "clash":   "갈등이 쌓이기 쉬운 자리",
            "sinsal":  "위기 때 서로를 지켜주는 코드",
            "sipsin":  "정서적 안정이 받쳐지는 자리",
            "element": "오행이 서로의 부족을 채워주는 자리",
            "fortune": "올해 인연 흐름이 결혼 결정을 받쳐주는 자리",
        },
        "재물": {
            "harmony": "재물 호흡이 맞아 들어가는 자리",
            "clash":   "재물 갈등이 끼어들 수 있는 자리",
            "sinsal":  "재물 코드를 더해주는 자리",
            "sipsin":  "재물 창출의 기질이 살아 있는 자리",
            "element": "오행 흐름이 재물에 영향을 주는 자리",
            "fortune": "올해 재물 흐름이 더해지는 자리",
        },
        "직업": {
            "harmony": "사회적 호흡이 맞아 들어가는 자리",
            "clash":   "역할 충돌이 끼어들 수 있는 자리",
            "sinsal":  "전문성·신뢰의 코드가 살아 있는 자리",
            "sipsin":  "사회적 기질이 받쳐지는 자리",
            "element": "오행 흐름이 사회운에 영향을 주는 자리",
            "fortune": "올해 사회 흐름이 더해지는 자리",
        },
    },
    "friend": {
        "연애": {
            "harmony": "마음이 부드럽게 통하는 자리",
            "clash":   "감정 거리감이 생길 수 있는 자리",
            "sinsal":  "친밀한 코드가 살아 있는 자리",
            "sipsin":  "타고난 매력·표현이 통하는 자리",
            "element": "오행 흐름이 받쳐주는 자리",
            "fortune": "올해 흐름이 영향을 더하는 자리",
        },
        "결혼": {
            "harmony": "신뢰·약속 호흡이 자연스럽게 맞는 자리",
            "clash":   "약속이 어긋나기 쉬운 자리",
            "sinsal":  "위기 때 서로를 지켜주는 코드",
            "sipsin":  "신뢰가 받쳐지는 자리",
            "element": "오행이 서로의 부족을 채워주는 자리",
            "fortune": "올해 흐름이 신뢰를 받쳐주는 자리",
        },
        "재물": {
            "harmony": "재물 호흡이 맞아 들어가는 자리",
            "clash":   "재물 갈등이 끼어들 수 있는 자리",
            "sinsal":  "재물 코드를 더해주는 자리",
            "sipsin":  "재물 창출의 기질이 살아 있는 자리",
            "element": "오행 흐름이 재물에 영향을 주는 자리",
            "fortune": "올해 재물 흐름이 더해지는 자리",
        },
        "직업": {
            "harmony": "협업 호흡이 맞아 들어가는 자리",
            "clash":   "역할 충돌이 끼어들 수 있는 자리",
            "sinsal":  "전문성·신뢰의 코드가 살아 있는 자리",
            "sipsin":  "사회적 기질이 받쳐지는 자리",
            "element": "오행 흐름이 사회운에 영향을 주는 자리",
            "fortune": "올해 사회 흐름이 더해지는 자리",
        },
    },
    "family": {
        "연애": {
            "harmony": "정서가 부드럽게 통하는 자리",
            "clash":   "감정 기복이 끼어들기 쉬운 자리",
            "sinsal":  "정서 교감의 코드가 살아 있는 자리",
            "sipsin":  "정서 표현이 통하는 자리",
            "element": "오행 흐름이 받쳐주는 자리",
            "fortune": "올해 흐름이 영향을 더하는 자리",
        },
        "결혼": {
            "harmony": "가족 유대가 자연스럽게 맞는 자리",
            "clash":   "갈등이 쌓이기 쉬운 자리",
            "sinsal":  "위기 때 서로를 지켜주는 코드",
            "sipsin":  "정서적 안정이 받쳐지는 자리",
            "element": "오행이 서로의 부족을 채워주는 자리",
            "fortune": "올해 가족 흐름이 유대를 받쳐주는 자리",
        },
        "재물": {
            "harmony": "가운 호흡이 맞아 들어가는 자리",
            "clash":   "재물 갈등이 끼어들 수 있는 자리",
            "sinsal":  "가운 코드를 더해주는 자리",
            "sipsin":  "재물 창출의 기질이 살아 있는 자리",
            "element": "오행 흐름이 가운에 영향을 주는 자리",
            "fortune": "올해 가운 흐름이 더해지는 자리",
        },
        "직업": {
            "harmony": "함께 도모하는 호흡이 맞는 자리",
            "clash":   "역할 충돌이 끼어들 수 있는 자리",
            "sinsal":  "공동의 코드가 살아 있는 자리",
            "sipsin":  "사회적 기질이 받쳐지는 자리",
            "element": "오행 흐름이 사회운에 영향을 주는 자리",
            "fortune": "올해 사회 흐름이 더해지는 자리",
        },
    },
}

TOTAL_LABEL_BY_REL: dict[RelationType, list[tuple[int, str]]] = {
    "lover":  [(80, "천생연분"),       (65, "잘 맞는 인연"),   (45, "무난한 인연"), (0, "노력이 필요한 인연")],
    "friend": [(80, "절친한 인연"),    (65, "잘 통하는 사이"), (45, "무난한 사이"), (0, "노력이 필요한 사이")],
    "family": [(80, "깊은 가족 인연"), (65, "따뜻한 인연"),    (45, "무난한 인연"), (0, "거리감 관리가 필요한 인연")],
}

GENERIC_ADVICE_BY_REL: dict[RelationType, dict[str, str]] = {
    "friend": {
        "high": "흐름이 잘 맞는 시기, 함께 작은 프로젝트나 취미를 시도해보세요.",
        "mid":  "서로의 페이스를 존중하며 가볍게 자주 만나는 게 좋아요.",
        "low":  "각자 영역을 존중하고 호흡을 천천히 맞춰가는 시기예요.",
    },
    "family": {
        "high": "정서적 유대가 든든한 시기, 작은 일상도 함께 나눠보세요.",
        "mid":  "서로의 영역을 존중하며 따뜻한 관심을 자주 표현해보세요.",
        "low":  "감정이 격해질 땐 한 호흡 두고, 거리감을 조절하는 게 좋아요.",
    },
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


def _label_for(score: int, rel: RelationType) -> str:
    for threshold, text in TOTAL_LABEL_BY_REL[rel]:
        if score >= threshold:
            return text
    return TOTAL_LABEL_BY_REL[rel][-1][1]


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
        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        return asdict(result)

    def build_chat_context(
        self,
        user1: User, user2: User, year: int,
        name1: str = "", name2: str = "",
        relation_type: RelationType = "lover",
    ) -> str:
        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)
        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        return self._format_chat_context(
            result, natal1, natal2, user1, user2, year, name1, name2, relation_type,
        )

    def build_narrative_prompt(
        self, user1: User, user2: User, year: int,
        relation_type: RelationType = "lover",
    ) -> str:
        natal1, postnatal1 = self._saju_service.analyze(user1, year)
        natal2, postnatal2 = self._saju_service.analyze(user2, year)
        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        return self._build_narrative_prompt(result, natal1, natal2, relation_type)

    def _format_chat_context(
        self,
        result: CompatibilityResult,
        natal1: NatalInfo, natal2: NatalInfo,
        user1: User, user2: User, year: int,
        name1: str, name2: str,
        relation_type: RelationType = "lover",
    ) -> str:
        label_map = DOMAIN_LABEL_BY_REL[relation_type]
        def _person_block(label: str, user: User, natal: NatalInfo) -> str:
            gender = "남" if user.gender.is_male else "여"
            birth = user.birth_dt.strftime("%Y-%m-%d %H:%M")
            pillars = " ".join(str(sb) for sb in natal.saju.pillars.values())
            elem = " ".join(f"{o.name}{c}" for o, c in natal.element_stats.items())
            sinsal = ", ".join(s.korean for _, s in natal.sinsal) or "없음"
            return (
                f"[{label}] {gender} | {birth}\n"
                f"- 사주: {pillars} (일간 {natal.saju.stem_of_day_pillar.name})\n"
                f"- 오행: {elem} | 주오행 {natal.my_main_element.name} | {natal.strength_label} | 용신 {natal.yongshin.name}\n"
                f"- 신살: {sinsal}"
            )

        day = Pillar.日柱.korean
        key_rels = [r.label for r in result.pillar_relations if r.pillar1 == day]
        other_rels = [r.label for r in result.pillar_relations if r.pillar1 != day][:4]
        relations_line = ", ".join(key_rels + other_rels) if (key_rels or other_rels) else "특별한 합·충 없음"

        samhap_line = (
            ", ".join(f"{c['element']}국({''.join(c['branches'])})" for c in result.samhap_completions)
            if result.samhap_completions else "없음"
        )
        scores_line = " / ".join(
            f"{label_map.get(k, k)} {v.get('score', 0)}({v.get('level', '')})"
            for k, v in result.domain_scores.items()
        )
        ec = result.element_complement or {}
        complement_parts: list[str] = []
        if ec.get("p1_provides"):
            complement_parts.append(f"{name1 or '첫 번째 분'}이 {','.join(ec['p1_provides'])} 보완")
        if ec.get("p2_provides"):
            complement_parts.append(f"{name2 or '두 번째 분'}이 {','.join(ec['p2_provides'])} 보완")
        if ec.get("overlap_strong"):
            complement_parts.append(f"공통 과잉: {','.join(ec['overlap_strong'])}")
        complement_line = " / ".join(complement_parts) if complement_parts else "특이사항 없음"

        return "\n".join([
            f"[궁합 분석 {year}년 · 관계 유형: {RELATION_LABEL[relation_type]}]",
            _person_block(name1 or "첫 번째 분", user1, natal1),
            "",
            _person_block(name2 or "두 번째 분", user2, natal2),
            "",
            f"[종합] {result.total_score}점 — {result.label}",
            f"- 한줄평: {result.description}",
            f"- 핵심 관계: {relations_line}",
            f"- 삼합 완성: {samhap_line}",
            f"- 오행 보완: {complement_line}",
            f"- 함께 가진 신살: {', '.join(result.shared_sinsal) if result.shared_sinsal else '없음'}",
            f"- 영역별: {scores_line}",
            f"- 키 트레이트: {', '.join(result.key_traits)}",
        ])

    async def analyze_compatibility(
        self, pid1: UUID, pid2: UUID, year: int,
        relation_type: RelationType = "lover",
    ) -> dict:
        lo, hi = (pid1, pid2) if str(pid1) < str(pid2) else (pid2, pid1)

        cached = await self._compatibility_port.get(lo, hi, year)
        if cached:
            return self._apply_relation_prose(cached.result, relation_type)

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

        result = self._compute(natal1, natal2, postnatal1, postnatal2, relation_type)
        result_dict = asdict(result)
        await self._compatibility_port.save(lo, hi, year, result_dict)
        return result_dict

    def _apply_relation_prose(self, result_dict: dict, rel: RelationType) -> dict:
        """캐시 hit 시: 점수·pros·cons는 그대로, 관계 유형 기반 prose만 재생성."""
        result_dict["label"] = _label_for(result_dict.get("total_score", 0), rel)
        label_map = DOMAIN_LABEL_BY_REL[rel]
        for domain, info in result_dict.get("domain_scores", {}).items():
            info["display_name"] = label_map.get(domain, domain)
            score = info.get("score", 0)
            pros = info.get("pros") or []
            cons = info.get("cons") or []
            advice = self._advice_for(domain, score, pros, cons, rel)
            info["narrative"] = self._narrate_domain(domain, score, pros, cons, rel, advice)
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
        key_traits = self._compute_key_traits(
            pillar_relations, element_complement, shared_sinsal, samhap_completions,
        )
        description = self._make_description(natal1, natal2, pillar_relations)

        return CompatibilityResult(
            total_score=total_score,
            label=_label_for(total_score, relation_type),
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
        )

    def _compute_pillar_relations(
        self, natal1: NatalInfo, natal2: NatalInfo
    ) -> list[PillarRelation]:
        """같은 기둥(年-年, 月-月, 日-日, 時-時) 4쌍에 대해 7관계 + 반합 검출."""
        relations: list[PillarRelation] = []
        for p in Pillar:
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
        b1 = {natal1.saju[p].branch.name for p in Pillar}
        b2 = {natal2.saju[p].branch.name for p in Pillar}
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
        has_sik1 = any(s in (Sipsin.食神, Sipsin.傷官) for _, s in natal1.sipsin)
        has_sik2 = any(s in (Sipsin.食神, Sipsin.傷官) for _, s in natal2.sipsin)
        has_in1 = any(s in (Sipsin.偏印, Sipsin.正印) for _, s in natal1.sipsin)
        has_in2 = any(s in (Sipsin.偏印, Sipsin.正印) for _, s in natal2.sipsin)

        def _signal(kind: str, text: str) -> dict:
            return {"kind": kind, "text": text}

        # 연애
        love = 50
        love_pros: list[dict] = []
        love_cons: list[dict] = []
        for r in all_branch_rels:
            if r.kind == "branch_combine":
                love += 7
                love_pros.append(_signal("harmony", f"{r.pillar1} 육합"))
            elif r.kind == "branch_clash":
                love -= 7
                love_cons.append(_signal("clash", f"{r.pillar1} 충"))
            elif r.kind == "wonjin":
                love -= 4
                love_cons.append(_signal("clash", f"{r.pillar1} 원진"))
        if any(r.kind == "samhap" for r in pillar_relations):
            love += 8
            love_pros.append(_signal("harmony", "삼합 반합"))
        if "도화살" in shared_sinsal:
            love += 12
            love_pros.append(_signal("sinsal", "도화살 공유 — 이성적 끌림"))
        if has_sik1 and has_sik2:
            love += 5
            love_pros.append(_signal("sipsin", "두 분 모두 식상 — 표현력·매력 풍부"))
        talent_avg = avg_postnatal("재능운")
        if talent_avg >= 65:
            love_pros.append(_signal("fortune", f"올해 재능운 양호({talent_avg:.0f})"))
        elif talent_avg <= 35:
            love_cons.append(_signal("fortune", f"올해 재능운 부진({talent_avg:.0f})"))
        love += int((talent_avg - 50) * 0.2)
        love = max(0, min(100, love))

        # 결혼
        marriage = 45
        marriage_pros: list[dict] = []
        marriage_cons: list[dict] = []
        for r in day_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                marriage += 12
                marriage_pros.append(_signal("harmony", "일주 합 — 부부 합"))
            elif r.kind == "branch_clash":
                marriage -= 10
                marriage_cons.append(_signal("clash", "일주 충 — 갈등 주의"))
            elif r.kind == "stem_clash":
                marriage -= 8
                marriage_cons.append(_signal("clash", "일주 천간충"))
        if "천을귀인" in shared_sinsal:
            marriage += 10
            marriage_pros.append(_signal("sinsal", "천을귀인 공유 — 위기에 서로 보호"))
        if "월덕귀인" in shared_sinsal:
            marriage += 6
            marriage_pros.append(_signal("sinsal", "월덕귀인 공유 — 평화로운 흐름"))
        if samhap_completions:
            marriage += SAMHAP_COMPLETION_MARRIAGE
            marriage_pros.append(_signal("harmony", f"삼합({samhap_completions[0]['element']}국) 완성"))
        strongest1 = max(natal1.element_stats, key=lambda o: natal1.element_stats.get(o, 0))
        strongest2 = max(natal2.element_stats, key=lambda o: natal2.element_stats.get(o, 0))
        if strongest2.generates == natal1.yongshin:
            marriage += 8
            marriage_pros.append(_signal("element", f"상대 {strongest2.name}이 내 용신({natal1.yongshin.name}) 도움"))
        if strongest1.generates == natal2.yongshin:
            marriage += 8
            marriage_pros.append(_signal("element", f"내 {strongest1.name}이 상대 용신({natal2.yongshin.name}) 도움"))
        if has_in1 and has_in2:
            marriage += 4
            marriage_pros.append(_signal("sipsin", "두 분 모두 인성 — 정서적 안정"))
        yeon_avg = avg_postnatal("인연운")
        if yeon_avg >= 65:
            marriage_pros.append(_signal("fortune", f"올해 인연운 양호({yeon_avg:.0f})"))
        elif yeon_avg <= 35:
            marriage_cons.append(_signal("fortune", f"올해 인연운 부진({yeon_avg:.0f})"))
        marriage += int((yeon_avg - 50) * 0.2)
        marriage = max(0, min(100, marriage))

        # 재물
        wealth = 45
        wealth_pros: list[dict] = []
        wealth_cons: list[dict] = []
        if has_jae1 and has_jae2:
            wealth += 15
            wealth_pros.append(_signal("sipsin", "두 분 모두 재성(財星) 보유"))
        elif has_jae1 or has_jae2:
            wealth += 8
            wealth_pros.append(_signal("sipsin", "한 분 재성 보유 — 재물 주도"))
        else:
            wealth_cons.append(_signal("sipsin", "양쪽 재성 부재 — 재물 흐름 약함"))
        if has_sik1 and has_sik2 and (has_jae1 or has_jae2):
            wealth += 5
            wealth_pros.append(_signal("sipsin", "식상생재(食傷生財) — 재물 창출력"))
        for r in day_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                wealth += 5
                wealth_pros.append(_signal("harmony", "일주 합"))
        if element_complement.get("score", 0) >= 5:
            wealth += 5
            wealth_pros.append(_signal("element", "오행 보완 시너지"))
        elif element_complement.get("overlap_strong"):
            wealth_cons.append(_signal("element", "오행 과잉 중복"))
        jae_avg = avg_postnatal("재물운")
        if jae_avg >= 65:
            wealth_pros.append(_signal("fortune", f"올해 재물운 양호({jae_avg:.0f})"))
        elif jae_avg <= 35:
            wealth_cons.append(_signal("fortune", f"올해 재물운 부진({jae_avg:.0f})"))
        wealth += int((jae_avg - 50) * 0.2)
        wealth = max(0, min(100, wealth))

        # 직업
        career = 45
        career_pros: list[dict] = []
        career_cons: list[dict] = []
        if has_gwan1 and has_gwan2:
            career += 15
            career_pros.append(_signal("sipsin", "두 분 모두 관성(官星) 보유"))
        elif has_gwan1 or has_gwan2:
            career += 8
            career_pros.append(_signal("sipsin", "한 분 관성 보유 — 방향 제시"))
        else:
            career_cons.append(_signal("sipsin", "양쪽 관성 부재 — 사회적 방향성 약함"))
        if has_in1 and has_in2 and (has_gwan1 or has_gwan2):
            career += 5
            career_pros.append(_signal("sipsin", "관인상생(官印相生) — 직장 안정"))
        for r in wol_rels:
            if r.kind in ("stem_combine", "branch_combine"):
                career += 6
                career_pros.append(_signal("harmony", "월주 합 — 사회 환경 조화"))
            elif r.kind == "branch_clash":
                career -= 6
                career_cons.append(_signal("clash", "월주 충"))
        if "문창귀인" in shared_sinsal:
            career += 5
            career_pros.append(_signal("sinsal", "문창귀인 공유 — 전문성 코드"))
        gwan_avg = avg_postnatal("관록운")
        if gwan_avg >= 65:
            career_pros.append(_signal("fortune", f"올해 관록운 양호({gwan_avg:.0f})"))
        elif gwan_avg <= 35:
            career_cons.append(_signal("fortune", f"올해 관록운 부진({gwan_avg:.0f})"))
        career += int((gwan_avg - 50) * 0.2)
        career = max(0, min(100, career))

        def _reason(pros: list[dict], cons: list[dict]) -> str:
            parts = [p["text"] for p in (pros + cons)[:3]]
            return ", ".join(parts) if parts else "기본 관계로 산출"

        label_map = DOMAIN_LABEL_BY_REL[relation_type]

        def _entry(domain: str, score: int, pros: list[dict], cons: list[dict]) -> dict:
            advice = self._advice_for(domain, score, pros, cons, relation_type)
            return {
                "score": score,
                "level": _level(score),
                "reason": _reason(pros, cons),
                "display_name": label_map.get(domain, domain),
                "pros": pros,
                "cons": cons,
                "narrative": self._narrate_domain(domain, score, pros, cons, relation_type, advice),
            }

        return {
            "연애": _entry("연애", love, love_pros, love_cons),
            "결혼": _entry("결혼", marriage, marriage_pros, marriage_cons),
            "재물": _entry("재물", wealth, wealth_pros, wealth_cons),
            "직업": _entry("직업", career, career_pros, career_cons),
        }

    @staticmethod
    def _narrate_domain(
        domain: str, score: int,
        pros: list[dict], cons: list[dict],
        relation_type: RelationType = "lover",
        advice: str = "",
    ) -> str:
        intros = DOMAIN_INTROS_BY_REL[relation_type].get(domain, [(0, "")])
        intro = next(text for threshold, text in intros if score >= threshold)
        kind_map = DOMAIN_KIND_PHRASE_BY_REL[relation_type].get(domain, {})
        parts: list[str] = [intro]

        if pros:
            top = pros[:3]
            head = ", ".join(p["text"] for p in top)
            kind_note = next(
                (kind_map[p["kind"]] for p in top if p["kind"] in kind_map),
                None,
            )
            if kind_note:
                parts.append(f"{head}이 {kind_note}로 흐름을 받쳐주고 있어요.")
            else:
                parts.append(f"{head}이 흐름을 받쳐주고 있어요.")

        if cons:
            top = cons[:2]
            head = ", ".join(c["text"] for c in top)
            kind_note = next(
                (kind_map[c["kind"]] for c in top if c["kind"] in kind_map),
                None,
            )
            if kind_note:
                parts.append(f"다만 {head}은(는) {kind_note}이라 한 번씩 챙겨보면 좋아요.")
            else:
                parts.append(f"다만 {head}은(는) 한 번씩 챙겨보면 좋아요.")

        if advice:
            parts.append(advice)

        return " ".join(parts)

    @staticmethod
    def _has_text(items: list[dict], keyword: str) -> bool:
        return any(keyword in it.get("text", "") for it in items if isinstance(it, dict))

    def _advice_for(
        self, domain: str, score: int,
        pros: list[dict], cons: list[dict],
        relation_type: RelationType,
    ) -> str:
        if relation_type == "lover":
            if domain == "연애": return self._advice_love(score, pros, cons)
            if domain == "결혼": return self._advice_marriage(score, pros, cons)
            if domain == "재물": return self._advice_wealth(score, pros, cons)
            if domain == "직업": return self._advice_career(score, pros, cons)
            return ""
        tiers = GENERIC_ADVICE_BY_REL[relation_type]
        if score >= 70: return tiers["high"]
        if score <= 40: return tiers["low"]
        return tiers["mid"]

    def _advice_love(self, score: int, pros: list[dict], cons: list[dict]) -> str:
        if self._has_text(pros, "도화살"):
            return "끌림이 강한 만큼 즉흥적 결정은 잠시 미루고, 약속은 글로 남겨두면 좋아요."
        if self._has_text(cons, "충") or self._has_text(cons, "원진"):
            return "감정이 격해질 땐 한 발 물러서서 호흡을 정리한 뒤 대화를 이어가세요."
        if self._has_text(pros, "식상"):
            return "표현이 풍부한 두 분이라 말보다 경청을 한 박자 늘리면 깊이가 더해져요."
        if score >= 70:
            return "흐름이 좋은 시기, 함께 새로운 경험을 쌓으며 추억의 결을 더하세요."
        if score <= 40:
            return "거리감을 두며 천천히 다가가고, 작은 친절로 신뢰를 쌓는 시기예요."
        return "서로의 페이스를 존중하며 가볍게 즐기는 만남부터 시작해보세요."

    def _advice_marriage(self, score: int, pros: list[dict], cons: list[dict]) -> str:
        if self._has_text(pros, "일주 합"):
            return "결이 잘 맞는 사이일수록 한쪽이 양보하는 균형이 오래가는 비결이에요."
        if self._has_text(cons, "일주 충") or self._has_text(cons, "천간충"):
            return "의견이 갈릴 땐 즉답을 피하고, 하루 묵힌 뒤 다시 이야기하는 룰을 정해보세요."
        if self._has_text(pros, "천을귀인") or self._has_text(pros, "삼합"):
            return "위기 때 서로를 지켜주는 사이예요. 평소에도 작은 위로의 표현을 아끼지 마세요."
        if self._has_text(pros, "인성"):
            return "정서적 안정이 강점이니 작은 일에도 감사 표현을 자주 나눠보세요."
        if score >= 70:
            return "장기 동반자로 잘 어울리는 흐름, 미래 계획을 함께 적어두면 더 견고해져요."
        if score <= 40:
            return "역할과 경계를 분명히 정해두면 충돌이 줄고 호흡이 잡혀요."
        return "공동의 작은 규칙을 만들며 차근차근 신뢰를 쌓는 시기예요."

    def _advice_wealth(self, score: int, pros: list[dict], cons: list[dict]) -> str:
        if self._has_text(pros, "식상생재"):
            return "둘이 함께 만드는 부수입·사업 흐름이 좋은 사주예요. 작게 시작해보세요."
        if self._has_text(pros, "두 분 모두 재성"):
            return "재물 코드가 같으니 공동 계좌·예산을 함께 운영하면 시너지가 커져요."
        if self._has_text(cons, "재성 부재"):
            return "큰 투자나 즉흥 지출은 보류하고, 둘이 함께 자산 흐름을 점검하는 게 우선이에요."
        if self._has_text(cons, "오행 과잉"):
            return "비슷한 기운이 강한 사주라 한쪽 분야 몰빵보단 분산이 안전해요."
        if score >= 70:
            return "재물 흐름이 양호한 시기, 장기 목표를 둘이 함께 설정해보세요."
        if score <= 40:
            return "지출 가시화부터 시작하고, 보수적 운용을 유지하는 시기예요."
        return "공동 지출 원칙을 가볍게 정해두면 마찰을 줄일 수 있어요."

    def _advice_career(self, score: int, pros: list[dict], cons: list[dict]) -> str:
        if self._has_text(pros, "관인상생"):
            return "함께 자기계발하면 효과가 배가되는 조합, 학습·자격증 도전을 같이 잡아보세요."
        if self._has_text(pros, "두 분 모두 관성"):
            return "역할과 책임을 명확히 나누면 두 분 모두의 사회적 성취가 커져요."
        if self._has_text(cons, "관성 부재"):
            return "방향성이 흐려질 수 있으니 멘토·외부 조언자에게 정기적으로 의견을 구해보세요."
        if self._has_text(pros, "문창귀인"):
            return "지식·전문성 코드가 통해요. 함께 책·세미나를 챙기는 루틴이 잘 맞아요."
        if self._has_text(cons, "월주 충"):
            return "주변 환경 변화가 잦을 수 있어요. 서로의 일정·우선순위를 자주 공유하세요."
        if score >= 70:
            return "사회적 호흡이 좋은 시기, 함께 새로운 도전을 잡아도 좋아요."
        if score <= 40:
            return "각자 영역을 존중하며 분업 위주로 운영하는 게 안정적이에요."
        return "역할 분담을 점검하고, 정기적으로 진행 상황을 공유하는 루틴을 만들어보세요."

    def _compute_key_traits(
        self,
        pillar_relations: list[PillarRelation],
        element_complement: dict,
        shared_sinsal: list[str],
        samhap_completions: list[dict],
    ) -> list[str]:
        traits: list[str] = []
        day = Pillar.日柱.korean
        pos = sum(1 for r in pillar_relations if r.polarity > 0)
        neg = sum(1 for r in pillar_relations if r.polarity < 0)

        if samhap_completions:
            traits.append(f"삼합({samhap_completions[0]['element']}국) 완성")
        if any(r.kind == "stem_combine" and r.pillar1 == day and r.pillar2 == day for r in pillar_relations):
            traits.append("일주 천간합 — 부부 합")
        if any(r.kind == "branch_combine" and r.pillar1 == day and r.pillar2 == day for r in pillar_relations):
            traits.append("일지 육합 — 감정 교감")
        if any(r.kind == "stem_clash" and r.pillar1 == day and r.pillar2 == day for r in pillar_relations):
            traits.append("일주 천간충 — 의견 충돌")
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
        relation_type: RelationType = "lover",
    ) -> None:
        if not self._llm_port or not self._llm_port.available:
            return
        try:
            prompt = self._build_narrative_prompt(result, natal1, natal2, relation_type)
            result.narrative = await self._llm_port.interpret(prompt)
        except Exception:
            result.narrative = None

    def _build_narrative_prompt(
        self, result: CompatibilityResult, natal1: NatalInfo, natal2: NatalInfo,
        relation_type: RelationType = "lover",
    ) -> str:
        day = Pillar.日柱.korean
        day_rels = [r.label for r in result.pillar_relations if r.pillar1 == day]
        other_rels = [r.label for r in result.pillar_relations if r.pillar1 != day][:3]
        key_rels = day_rels + other_rels
        label_map = DOMAIN_LABEL_BY_REL[relation_type]
        scores_line = " / ".join(
            f"{label_map.get(k, k)} {v['score']}" for k, v in result.domain_scores.items()
        )
        samhap_line = (
            ", ".join(f"{c['element']}국({''.join(c['branches'])})" for c in result.samhap_completions)
            if result.samhap_completions else "없음"
        )
        return (
            f"두 분의 사주 궁합 데이터입니다. 관계 유형은 '{RELATION_LABEL[relation_type]}'이에요. "
            "그 톤에 맞게 친근한 존댓말로 300자 이내로 풀어주세요. "
            "연인·부부 전용 어휘(연애·결혼·끌림 등)는 다른 관계 유형엔 쓰지 말아주세요.\n"
            f"- 첫 번째 분: 일간 {natal1.saju.stem_of_day_pillar.name}, 주오행 {natal1.my_main_element.name}, "
            f"{natal1.strength_label}, 용신 {natal1.yongshin.name}\n"
            f"- 두 번째 분: 일간 {natal2.saju.stem_of_day_pillar.name}, 주오행 {natal2.my_main_element.name}, "
            f"{natal2.strength_label}, 용신 {natal2.yongshin.name}\n"
            f"- 핵심 관계: {', '.join(key_rels) if key_rels else '특별한 합·충 없음'}\n"
            f"- 삼합 완성: {samhap_line}\n"
            f"- 공유 신살: {', '.join(result.shared_sinsal) if result.shared_sinsal else '없음'}\n"
            f"- 종합 점수: {result.total_score}점 ({result.label})\n"
            f"- 영역별: {scores_line}\n"
            f"- 키 트레이트: {', '.join(result.key_traits)}\n"
            "두 분 관계의 강점과 약점, 실천 조언을 차분히 정리해주세요."
        )
