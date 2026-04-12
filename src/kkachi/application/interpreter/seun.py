from kkachi.domain.ganji import Stem
from kkachi.domain.interpretation import InterpretBlock
from kkachi.domain.natal import NatalInfo, PostnatalInfo


class SeunInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        if not postnatal.current_daeun:
            return []

        stem_char, _ = postnatal.seun_stem
        branch_char, _ = postnatal.seun_branch
        seun_elem = Stem.from_char(stem_char).element

        daeun_ganji = postnatal.current_daeun.ganji
        daeun_elem = Stem.from_char(daeun_ganji[0]).element

        if seun_elem.generates == daeun_elem or seun_elem == daeun_elem:
            text = (
                f"대운({daeun_ganji})과 올해 기운({stem_char}{branch_char})이 같은 방향을 가리키고 있어요. "
                f"큰 흐름과 당장의 현실이 잘 맞아 돌아가니, 오래 생각해왔던 계획을 실행에 옮기기에 좋은 때입니다."
            )
        elif seun_elem.overcomes == daeun_elem or daeun_elem.overcomes == seun_elem:
            text = (
                f"대운({daeun_ganji})과 올해 기운({stem_char}{branch_char})이 서로 다른 방향을 가리키고 있어요. "
                f"큰 흐름과 당장의 현실이 엇갈릴 수 있는 시기예요. "
                f"이럴 때일수록 여러 곳에 힘을 분산하기보다 한 가지에 집중하는 것이 훨씬 힘이 됩니다."
            )
        else:
            return []

        return [InterpretBlock(description=text)]
