from kkachi.domain.ganji import Branch, BranchCombine, Stem, StemCombine


_PILLAR_AREA: dict[str, str] = {
    "년주": "조상·사회 영역",
    "월주": "부모·직장 영역",
    "일주": "나·배우자 영역",
    "시주": "자녀·미래 영역",
}

_BRANCH_COMBINE_OHENG: dict[frozenset[Branch], str] = {
    frozenset({Branch.子, Branch.丑}): "土",
    frozenset({Branch.寅, Branch.亥}): "木",
    frozenset({Branch.卯, Branch.戌}): "火",
    frozenset({Branch.辰, Branch.酉}): "金",
    frozenset({Branch.巳, Branch.申}): "水",
    frozenset({Branch.午, Branch.未}): "土",
}

_STEM_COMBINE_OHENG: dict[frozenset[Stem], str] = {
    frozenset({Stem.甲, Stem.己}): "土",
    frozenset({Stem.乙, Stem.庚}): "金",
    frozenset({Stem.丙, Stem.辛}): "水",
    frozenset({Stem.丁, Stem.壬}): "木",
    frozenset({Stem.戊, Stem.癸}): "火",
}

_OHENG_KOREAN: dict[str, str] = {
    "木": "나무", "火": "불", "土": "흙", "金": "쇠", "水": "물",
}


def pillar_area(pillar: str) -> str:
    return _PILLAR_AREA.get(pillar, pillar)


def enrich_clash(target: Branch, incoming: Branch, pillar: str) -> dict:
    area = pillar_area(pillar)
    target_label = f"{target.korean}({target.name})"
    incoming_label = f"{incoming.korean}({incoming.name})"
    narrative = (
        f"{target_label}·{incoming_label}은 십이지지 원형에서 정반대의 짝인 지지충이에요. "
        f"{pillar}의 {target_label}과 충이기에 {area}에서 갑작스런 변화나 갈등이 생길 수 있으니 "
        "유연하게 대처하세요."
    )
    return {
        "incoming": incoming.name,
        "incoming_korean": incoming.korean,
        "target": target.name,
        "target_korean": target.korean,
        "pillar": pillar,
        "area_label": area,
        "narrative": narrative,
    }


def enrich_stem_combine(target: Stem, incoming: Stem, pillar: str) -> dict:
    area = pillar_area(pillar)
    target_label = f"{target.korean}({target.name})"
    incoming_label = f"{incoming.korean}({incoming.name})"
    harmony = _STEM_COMBINE_OHENG.get(frozenset({target, incoming}))
    harmony_korean = _OHENG_KOREAN.get(harmony, "") if harmony else ""
    harmony_text = f" (합화 {harmony_korean}({harmony}))" if harmony else ""
    narrative = (
        f"{target_label}·{incoming_label}은 천간합 5쌍 중 하나로 결이 맞아요{harmony_text}. "
        f"{pillar}의 {target_label}과 합이기에 {area}에서 좋은 인연이나 기회가 자연스럽게 열릴 수 있어요."
    )
    return {
        "incoming": incoming.name,
        "incoming_korean": incoming.korean,
        "target": target.name,
        "target_korean": target.korean,
        "pillar": pillar,
        "area_label": area,
        "type": "천간합",
        "harmony_element": harmony or "",
        "harmony_element_korean": harmony_korean,
        "narrative": narrative,
    }


def enrich_branch_combine(target: Branch, incoming: Branch, pillar: str) -> dict:
    area = pillar_area(pillar)
    target_label = f"{target.korean}({target.name})"
    incoming_label = f"{incoming.korean}({incoming.name})"
    harmony = _BRANCH_COMBINE_OHENG.get(frozenset({target, incoming}))
    harmony_korean = _OHENG_KOREAN.get(harmony, "") if harmony else ""
    harmony_text = f" (합화 {harmony_korean}({harmony}))" if harmony else ""
    narrative = (
        f"{target_label}·{incoming_label}은 지지육합 6쌍 중 하나로 결이 맞아요{harmony_text}. "
        f"{pillar}의 {target_label}과 합이기에 {area}에서 좋은 인연이나 기회가 자연스럽게 열릴 수 있어요."
    )
    return {
        "incoming": incoming.name,
        "incoming_korean": incoming.korean,
        "target": target.name,
        "target_korean": target.korean,
        "pillar": pillar,
        "area_label": area,
        "type": "지지합",
        "harmony_element": harmony or "",
        "harmony_element_korean": harmony_korean,
        "narrative": narrative,
    }
