from kkachi.domain.ganji import Branch, Pillar, Sipsin
from kkachi.domain.interpretation import InterpretBlock
from kkachi.domain.natal import NatalInfo, PostnatalInfo


class RelationshipInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        lines = []

        for clash in postnatal.seun_clashes:
            pillar = clash['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 기운이 {meaning} 영역과 부딪힙니다. "
                f"이 영역에서 변동이나 갈등이 생길 수 있어요. "
                f"미리 대비하면 오히려 전화위복의 계기가 됩니다."
            )
        for clash in postnatal.daeun_clashes:
            pillar = clash['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"10년 큰 흐름의 기운이 {meaning} 영역과 부딪힙니다. "
                f"이 구간 동안 이 영역에서 구조적 변화가 일어날 수 있습니다."
            )
        for combine in postnatal.seun_combines:
            pillar = combine['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 기운이 {meaning} 영역과 좋은 조합을 이룹니다. "
                f"이 영역에서 뜻밖의 귀인이 나타나거나 좋은 인연이 맺어질 수 있습니다."
            )
        for combine in postnatal.daeun_combines:
            pillar = combine['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"10년 큰 흐름의 기운이 {meaning} 영역과 좋은 조합을 이룹니다. "
                f"장기적으로 이 영역에서 긍정적인 변화와 협력 관계가 형성됩니다."
            )

        if not lines:
            month_branch = natal.saju[Pillar.月柱].branch
            month_elem = month_branch.element
            lines.append(
                f"올해는 특별한 충(衝)이나 합(合) 없이 관계 에너지가 균형을 유지하는 해입니다. "
                f"월지({month_branch.name})가 {month_elem.meaning}의 기운을 품고 있어, "
                f"사회활동에서 {month_elem.personality} 특성이 대인관계에 영향을 줍니다."
            )

        seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]

        if Sipsin.正官 in seun_sipsins or Sipsin.正財 in seun_sipsins:
            matched = next(s for s in seun_sipsins if s in (Sipsin.正官, Sipsin.正財))
            lines.append(
                f"올해 세운에 {matched.name}({matched.domain}) 기운이 흐르고 있습니다. "
                f"귀인과의 인연이 형성될 가능성이 높으며, 신뢰할 수 있는 사람과의 만남이 "
                f"삶의 전환점이 될 수 있습니다. 새로운 인연을 열린 마음으로 받아들이세요."
            )

        if Sipsin.劫財 in seun_sipsins or Sipsin.偏官 in seun_sipsins:
            matched = next(s for s in seun_sipsins if s in (Sipsin.劫財, Sipsin.偏官))
            lines.append(
                f"올해 세운에 {matched.name}({matched.domain}) 기운이 작용하고 있습니다. "
                f"경쟁자나 갈등 상황이 나타날 수 있으니 불필요한 마찰을 피하고, "
                f"중요한 계약·보증·동업은 신중하게 검토한 뒤 결정하세요."
            )

        return [InterpretBlock(description=l) for l in lines]


PILLAR_MEANING: dict[str, str] = {
    "년주": "조상·사회적 환경",
    "월주": "부모·직장·사회활동",
    "일주": "본인·배우자",
    "시주": "자녀·말년·미래",
}
