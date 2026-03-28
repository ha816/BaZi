from bazi.application.constant import PILLAR_MEANING
from bazi.domain.natal import PostnatalInfo


class RelationshipInterpreter:
    def __call__(self, postnatal: PostnatalInfo) -> list[str]:
        lines = []

        for clash in postnatal.seun_clashes:
            pillar = clash['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 세운 {clash['incoming']}이(가) {pillar} {clash['target']}과(와) "
                f"충(衝)합니다. {pillar}은 {meaning}을 상징하므로, "
                f"이 영역에서 변동·갈등이 예상됩니다. 미리 대비하면 오히려 전화위복의 계기가 됩니다."
            )
        for clash in postnatal.daeun_clashes:
            pillar = clash['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"대운 {clash['incoming']}이(가) {pillar} {clash['target']}과(와) "
                f"충(衝)합니다. {meaning} 영역에서 이 대운 기간 동안 "
                f"구조적 변화가 일어날 수 있습니다."
            )
        for combine in postnatal.seun_combines:
            pillar = combine['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 세운 {combine['incoming']}이(가) {pillar} {combine['target']}과(와) "
                f"{combine['type']}합니다. {meaning} 영역에서 "
                f"뜻밖의 귀인이 나타나거나 좋은 인연이 맺어질 수 있습니다."
            )
        for combine in postnatal.daeun_combines:
            pillar = combine['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"대운 {combine['incoming']}이(가) {pillar} {combine['target']}과(와) "
                f"{combine['type']}합니다. {meaning} 영역에서 "
                f"장기적으로 긍정적인 변화와 협력 관계가 형성됩니다."
            )

        return lines
