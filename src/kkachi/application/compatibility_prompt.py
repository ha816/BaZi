from kkachi.application.util.compatibility_meta import (
    DOMAIN_LABEL_BY_REL,
    RELATION_LABEL,
    RelationType,
)
from kkachi.domain.compatibility import CompatibilityResult
from kkachi.domain.ganji import Pillar
from kkachi.domain.natal import NatalInfo
from kkachi.domain.user import User

# 궁합 결과 → LLM 입력 텍스트. 챗 시스템 프롬프트의 [데이터] 블록(format_chat_context)과
# 종합해석 스트리밍 프롬프트(format_narrative_prompt). 호출은 CompatibilityService.build_chat_context/build_narrative_prompt.


def format_chat_context(
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


def format_narrative_prompt(
    result: CompatibilityResult, natal1: NatalInfo, natal2: NatalInfo,
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
    domain_keys = " · ".join(label_map.values())
    relation_tone = {
        "lover":  "연인·부부 톤 — 끌림·정서·결혼·동반자 어휘 사용 가능",
        "friend": "친구·동료 톤 — 끌림·연애 어휘 금지. 신뢰·협업·우정 중심",
        "family": "가족 톤 — 끌림·연애 어휘 금지. 유대·정서 교감·가운(家運) 중심",
    }[relation_type]
    return (
        "# 궁합 분석 레포트\n"
        "\n"
        f"두 분의 사주 궁합 데이터입니다. 관계 유형은 **{RELATION_LABEL[relation_type]}**이에요. "
        "이 데이터를 바탕으로 자연스러운 한국어 통합 해석을 작성해주세요.\n"
        "\n"
        "## 해석 가이드\n"
        "\n"
        "### 문체 규칙 (반드시 따를 것)\n"
        "\n"
        "- **각 섹션은 핵심 한 줄로 시작**: `👉 \"...\"` 형식의 굵은 결론 먼저, 근거는 뒤에\n"
        "- **짧은 블록 유지**: 연속 3줄 넘는 문단 금지. 짧은 문장 + 불릿 조합 사용\n"
        "- **근거 병기**: 핵심 주장 뒤에 `(일지 육합)`, `(삼합 완성)`, `(원진살)` 같은 근거 괄호 추가\n"
        "- **전문용어 금지**: 명리 용어는 우리말 풀이 + `(한자)` 괄호 병기\n"
        "- **구어체 존댓말**: '~입니다', '~해요' 혼용. 친근하게.\n"
        f"- **관계 톤 엄수**: {relation_tone}\n"
        "- **마크다운 표(`|...|`) 금지**: 나열은 한 줄에 하나씩 불릿으로\n"
        "\n"
        "### 다뤄야 할 4개 섹션 (각 섹션은 `### 섹션명` 헤딩으로 시작)\n"
        "\n"
        "1. **### 두 분의 결** — 일간·주오행·강약·용신 조합으로 '어떤 인연인지' 한 단락\n"
        "2. **### 핵심 코드** — 충·합·삼합·공유 신살 중 임팩트 큰 것만. 없으면 솔직히\n"
        f"3. **### 영역별 흐름** — {domain_keys} 네 축의 점수 의미를 묶어서 정리\n"
        "4. **### 실천 조언** — 관계 톤에 맞는 구체적 행동 1~2가지\n"
        "\n"
        "마지막에 **메타포 한 줄 총평**: 두 분 관계를 비유로 압축 + 오늘 할 수 있는 행동 하나.\n"
        "막연한 격려 금지. 데이터에 근거한 구체적 지침으로.\n"
        "\n"
        "## 데이터\n"
        "\n"
        f"- 첫 번째 분: 일간 {natal1.saju.stem_of_day_pillar.name}, 주오행 {natal1.my_main_element.name}, "
        f"{natal1.strength_label}, 용신 {natal1.yongshin.name}\n"
        f"- 두 번째 분: 일간 {natal2.saju.stem_of_day_pillar.name}, 주오행 {natal2.my_main_element.name}, "
        f"{natal2.strength_label}, 용신 {natal2.yongshin.name}\n"
        f"- 핵심 관계: {', '.join(key_rels) if key_rels else '특별한 합·충 없음'}\n"
        f"- 삼합 완성: {samhap_line}\n"
        f"- 공유 신살: {', '.join(result.shared_sinsal) if result.shared_sinsal else '없음'}\n"
        f"- 종합 점수: {result.total_score}점 ({result.label})\n"
        f"- 영역별: {scores_line}\n"
        f"- 키 트레이트: {', '.join(result.key_traits)}"
    )
