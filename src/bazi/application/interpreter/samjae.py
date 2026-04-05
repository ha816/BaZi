from bazi.application.util.util import year_to_ganji
from bazi.domain.ganji import Branch, Pillar
from bazi.domain.interpretation import InterpretBlock
from bazi.domain.natal import NatalInfo, PostnatalInfo, Samjae


class SamjaeInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        text = self._get_samjae_text(natal, postnatal.year)
        return [InterpretBlock(description=text)] if text else []

    def _get_samjae_text(self, natal: NatalInfo, year: int) -> str | None:
        """삼재 해당 시 해석 문장을 반환한다. 비해당이면 None."""
        year_branch = natal.saju[Pillar.年柱].branch
        seun_branch = Branch.from_char(year_to_ganji(year)[1])

        for group, (entering, sitting, leaving) in Samjae.samjae_map().items():
            if year_branch in group:
                samjae_branches = (entering, sitting, leaving)
                if seun_branch in samjae_branches:
                    idx = samjae_branches.index(seun_branch)
                    label = Samjae.by_order(idx).value
                    if idx == 0:
                        return (
                            f"{year}년은 삼재(三災)에 진입하는 '{label}'입니다. "
                            f"새로운 일을 시작하기보다 기존 일을 정리하고 조심하는 자세가 필요합니다."
                        )
                    elif idx == 1:
                        return (
                            f"{year}년은 삼재 중 가장 강한 '{label}'입니다. "
                            f"건강·사고·재물 손실에 특히 유의하고, 큰 변화를 삼가세요."
                        )
                    else:
                        return (
                            f"{year}년은 삼재가 물러가는 '{label}'입니다. "
                            f"어려운 시기가 마무리되고 있으니 조금만 더 신중하면 좋은 흐름이 시작됩니다."
                        )
                break

        return None
