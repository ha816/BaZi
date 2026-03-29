from bazi.domain.natal import NatalInfo, PostnatalInfo


class SeunInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[str]:
        lines = []
        year = postnatal.year

        stem_char, stem_sipsin = postnatal.seun_stem
        branch_char, branch_sipsin = postnatal.seun_branch

        lines.append(
            f"{year}년 천간 {stem_char}({stem_sipsin.name})은 "
            f"{stem_sipsin.domain} 방면에 변화를 가져옵니다."
        )
        lines.append(
            f"{year}년 지지 {branch_char}({branch_sipsin.name})은 "
            f"{branch_sipsin.domain} 방면의 환경을 만듭니다."
        )

        return lines
