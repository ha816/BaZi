from kkachi.domain.interpretation import InterpretBlock
from kkachi.domain.natal import NatalInfo, PostnatalInfo


class SeunInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        lines = []
        year = postnatal.year

        stem_char, stem_sipsin = postnatal.seun_stem
        branch_char, branch_sipsin = postnatal.seun_branch

        lines.append(
            f"{year}년 하늘 기운은 {stem_sipsin.domain} 방면에 변화를 가져옵니다."
        )
        lines.append(
            f"{year}년 땅 기운은 {branch_sipsin.domain} 방면의 환경을 만듭니다."
        )

        return [InterpretBlock(description=l) for l in lines]
