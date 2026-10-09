from kkachi.application.util.compatibility_meta import (
    DOMAIN_INTROS_BY_REL,
    DOMAIN_KIND_PHRASE_BY_REL,
    GENERIC_ADVICE_BY_REL,
    RelationType,
)
from kkachi.application.util.util import josa
from kkachi.domain.compatibility import PillarRelation
from kkachi.domain.ganji import Pillar
from kkachi.domain.natal import NatalInfo

# 궁합 점수·신호(pros/cons)를 문장으로 — 영역 narrative·조언, 한줄평(description), 특징(key_traits).
# 점수 계산은 compatibility_service, 관계 유형별 문장 표는 util/compatibility_meta. 연인은 신호별 조언, 친구·가족은 점수대별 공통 조언.


def narrate_domain(
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


def advice_for(
    domain: str, score: int,
    pros: list[dict], cons: list[dict],
    relation_type: RelationType,
) -> str:
    if relation_type == "lover":
        advice = {
            "연애": _advice_love,
            "결혼": _advice_marriage,
            "재물": _advice_wealth,
            "직업": _advice_career,
        }.get(domain)
        return advice(score, pros, cons) if advice else ""
    tiers = GENERIC_ADVICE_BY_REL[relation_type]
    if score >= 70:
        return tiers["high"]
    if score <= 40:
        return tiers["low"]
    return tiers["mid"]


def compute_key_traits(
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


def make_description(
    natal1: NatalInfo, natal2: NatalInfo,
    pillar_relations: list[PillarRelation],
) -> str:
    el1, el2 = natal1.my_main_element, natal2.my_main_element
    # 조사는 한자가 아니라 한글 읽기(흙·쇠…)로 고른다 — "土이 金를" 방지
    k1 = f"{el1.meaning}({el1.name})"
    k2 = f"{el2.meaning}({el2.name})"
    k1_ga, k2_ga = k1 + josa(el1.meaning, "이", "가"), k2 + josa(el2.meaning, "이", "가")
    k1_eul, k2_eul = k1 + josa(el1.meaning, "을", "를"), k2 + josa(el2.meaning, "을", "를")
    parts: list[str] = []
    if el1 == el2:
        parts.append(f"두 분은 같은 {k1} 기운을 가졌습니다. 공감대가 넓지만 경쟁심이 생길 수 있습니다.")
    elif el1.generates == el2:
        parts.append(f"{k1_ga} {k2_eul} 키워주는 상생 관계로, 한 분이 자연스럽게 다른 분을 이끌어줍니다.")
    elif el2.generates == el1:
        parts.append(f"{k2_ga} {k1_eul} 키워주는 상생 관계로, 서로를 성장시키는 든든한 파트너입니다.")
    elif el1.overcomes == el2:
        parts.append(f"{k1_ga} {k2_eul} 억제하는 상극 관계로, 주도권 갈등이 있을 수 있지만 강한 자극이 됩니다.")
    else:
        parts.append(f"{k2_ga} {k1_eul} 억제하는 상극 관계로, 긴장감이 있지만 강한 끌림이 있습니다.")

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


def _has_text(items: list[dict], keyword: str) -> bool:
    return any(keyword in it.get("text", "") for it in items if isinstance(it, dict))


def _advice_love(score: int, pros: list[dict], cons: list[dict]) -> str:
    if _has_text(pros, "도화살"):
        return "끌림이 강한 만큼 즉흥적 결정은 잠시 미루고, 약속은 글로 남겨두면 좋아요."
    if _has_text(cons, "충") or _has_text(cons, "원진"):
        return "감정이 격해질 땐 한 발 물러서서 호흡을 정리한 뒤 대화를 이어가세요."
    if _has_text(pros, "식상"):
        return "표현이 풍부한 두 분이라 말보다 경청을 한 박자 늘리면 깊이가 더해져요."
    if score >= 70:
        return "흐름이 좋은 시기, 함께 새로운 경험을 쌓으며 추억의 결을 더하세요."
    if score <= 40:
        return "거리감을 두며 천천히 다가가고, 작은 친절로 신뢰를 쌓는 시기예요."
    return "서로의 페이스를 존중하며 가볍게 즐기는 만남부터 시작해보세요."

def _advice_marriage(score: int, pros: list[dict], cons: list[dict]) -> str:
    if _has_text(pros, "일주 합"):
        return "결이 잘 맞는 사이일수록 한쪽이 양보하는 균형이 오래가는 비결이에요."
    if _has_text(cons, "일주 충") or _has_text(cons, "천간충"):
        return "의견이 갈릴 땐 즉답을 피하고, 하루 묵힌 뒤 다시 이야기하는 룰을 정해보세요."
    if _has_text(pros, "천을귀인") or _has_text(pros, "삼합"):
        return "위기 때 서로를 지켜주는 사이예요. 평소에도 작은 위로의 표현을 아끼지 마세요."
    if _has_text(pros, "인성"):
        return "정서적 안정이 강점이니 작은 일에도 감사 표현을 자주 나눠보세요."
    if score >= 70:
        return "장기 동반자로 잘 어울리는 흐름, 미래 계획을 함께 적어두면 더 견고해져요."
    if score <= 40:
        return "역할과 경계를 분명히 정해두면 충돌이 줄고 호흡이 잡혀요."
    return "공동의 작은 규칙을 만들며 차근차근 신뢰를 쌓는 시기예요."

def _advice_wealth(score: int, pros: list[dict], cons: list[dict]) -> str:
    if _has_text(pros, "식상생재"):
        return "둘이 함께 만드는 부수입·사업 흐름이 좋은 사주예요. 작게 시작해보세요."
    if _has_text(pros, "두 분 모두 재성"):
        return "재물 코드가 같으니 공동 계좌·예산을 함께 운영하면 시너지가 커져요."
    if _has_text(cons, "재성 부재"):
        return "큰 투자나 즉흥 지출은 보류하고, 둘이 함께 자산 흐름을 점검하는 게 우선이에요."
    if _has_text(cons, "오행 과잉"):
        return "비슷한 기운이 강한 사주라 한쪽 분야 몰빵보단 분산이 안전해요."
    if score >= 70:
        return "재물 흐름이 양호한 시기, 장기 목표를 둘이 함께 설정해보세요."
    if score <= 40:
        return "지출 가시화부터 시작하고, 보수적 운용을 유지하는 시기예요."
    return "공동 지출 원칙을 가볍게 정해두면 마찰을 줄일 수 있어요."

def _advice_career(score: int, pros: list[dict], cons: list[dict]) -> str:
    if _has_text(pros, "관인상생"):
        return "함께 자기계발하면 효과가 배가되는 조합, 학습·자격증 도전을 같이 잡아보세요."
    if _has_text(pros, "두 분 모두 관성"):
        return "역할과 책임을 명확히 나누면 두 분 모두의 사회적 성취가 커져요."
    if _has_text(cons, "관성 부재"):
        return "방향성이 흐려질 수 있으니 멘토·외부 조언자에게 정기적으로 의견을 구해보세요."
    if _has_text(pros, "문창귀인"):
        return "지식·전문성 코드가 통해요. 함께 책·세미나를 챙기는 루틴이 잘 맞아요."
    if _has_text(cons, "월주 충"):
        return "주변 환경 변화가 잦을 수 있어요. 서로의 일정·우선순위를 자주 공유하세요."
    if score >= 70:
        return "사회적 호흡이 좋은 시기, 함께 새로운 도전을 잡아도 좋아요."
    if score <= 40:
        return "각자 영역을 존중하며 분업 위주로 운영하는 게 안정적이에요."
    return "역할 분담을 점검하고, 정기적으로 진행 상황을 공유하는 루틴을 만들어보세요."
