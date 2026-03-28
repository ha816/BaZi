from bazi.application.constant import SAMJAE_LABELS, SAMJAE_MAP
from bazi.domain.ganji import Branch
from bazi.domain.natal import NatalInfo, PostnatalInfo
from bazi.domain.util import year_to_ganji


def get_annual_fortune(natal: NatalInfo, postnatal: PostnatalInfo) -> list[str]:
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

    samjae_text = get_samjae_text(natal, year)
    if samjae_text:
        lines.append(samjae_text)

    return lines


def get_samjae_text(natal: NatalInfo, year: int) -> str | None:
    """삼재 해당 시 해석 문장을 반환한다. 비해당이면 None."""
    year_branch = Branch.from_char(natal.saju.year_pillar[1])
    seun_branch = Branch.from_char(year_to_ganji(year)[1])

    for group, (entering, sitting, leaving) in SAMJAE_MAP.items():
        if year_branch in group:
            samjae_branches = (entering, sitting, leaving)
            if seun_branch in samjae_branches:
                idx = samjae_branches.index(seun_branch)
                label = SAMJAE_LABELS[idx]
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
