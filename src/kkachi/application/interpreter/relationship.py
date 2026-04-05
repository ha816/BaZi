from kkachi.domain.interpretation import InterpretBlock
from kkachi.domain.natal import PostnatalInfo


class RelationshipInterpreter:
    def __call__(self, postnatal: PostnatalInfo) -> list[InterpretBlock]:
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

        return [InterpretBlock(description=l) for l in lines]


PILLAR_MEANING: dict[str, str] = {
    "년주": "조상·사회적 환경",
    "월주": "부모·직장·사회활동",
    "일주": "본인·배우자",
    "시주": "자녀·말년·미래",
}
