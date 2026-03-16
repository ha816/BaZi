"""종합 해석: NatalChart + FortuneChart를 조합하여 규칙 기반 해석을 생성한다."""

from dataclasses import dataclass, field

from bazi.model import NatalChart
from bazi.fortune import DaeunPeriod, FortuneChart


@dataclass
class Interpretation:
    """종합 해석 결과"""
    # 용신 충족
    yongshin: str
    yongshin_in_seun: bool
    yongshin_in_daeun: bool

    # 세운 해석
    seun_sipsin: list[dict]

    # 현재 대운 해석
    current_daeun: DaeunPeriod | None
    daeun_sipsin: list[dict]

    # 충·합
    seun_clashes: list[dict]
    seun_combines: list[dict]
    daeun_clashes: list[dict]
    daeun_combines: list[dict]

    # 종합 문장
    summary: list[str] = field(default_factory=list)


def full_interpretation(
    natal: NatalChart,
    fortune: FortuneChart,
    age: int,
) -> Interpretation:
    """
    선천 + 후천 데이터를 종합하여 규칙 기반 해석을 생성한다.
    """
    yongshin = natal.yongshin

    # 1. 용신 충족
    yongshin_in_seun = fortune.check_yongshin_in_seun()
    current_daeun = fortune.get_current_daeun(age)
    yongshin_in_daeun = fortune.check_yongshin_in_daeun(current_daeun) if current_daeun else False

    # 2. 십신 해석
    seun_sipsin = fortune.get_seun_sipsin_domains()
    daeun_sipsin = fortune.get_daeun_sipsin_domains(current_daeun) if current_daeun else []

    # 3. 충·합
    seun_clashes = fortune.find_clashes(fortune.seun_ganji)
    seun_combines = fortune.find_combines(fortune.seun_ganji)
    daeun_clashes = fortune.find_clashes(current_daeun.ganji) if current_daeun else []
    daeun_combines = fortune.find_combines(current_daeun.ganji) if current_daeun else []

    # 종합 문장 생성
    summary = _build_summary(
        yongshin, yongshin_in_seun, yongshin_in_daeun,
        seun_sipsin, daeun_sipsin,
        seun_clashes, seun_combines,
        daeun_clashes, daeun_combines,
        fortune.year,
        current_daeun,
    )

    return Interpretation(
        yongshin=yongshin,
        yongshin_in_seun=yongshin_in_seun,
        yongshin_in_daeun=yongshin_in_daeun,
        seun_sipsin=seun_sipsin,
        current_daeun=current_daeun,
        daeun_sipsin=daeun_sipsin,
        seun_clashes=seun_clashes,
        seun_combines=seun_combines,
        daeun_clashes=daeun_clashes,
        daeun_combines=daeun_combines,
        summary=summary,
    )


def _build_summary(
    yongshin: str,
    yongshin_in_seun: bool,
    yongshin_in_daeun: bool,
    seun_sipsin: list[dict],
    daeun_sipsin: list[dict],
    seun_clashes: list[dict],
    seun_combines: list[dict],
    daeun_clashes: list[dict],
    daeun_combines: list[dict],
    seun_year: int,
    current_daeun: DaeunPeriod | None,
) -> list[str]:
    """규칙 기반으로 종합 해석 문장을 생성한다."""
    lines = []

    # 용신 충족
    if yongshin_in_seun and yongshin_in_daeun:
        lines.append(f"{seun_year}년은 세운과 대운 모두 용신({yongshin})이 작용하여 매우 유리한 해입니다.")
    elif yongshin_in_seun:
        lines.append(f"{seun_year}년 세운에 용신({yongshin})이 있어 올해의 기회를 잘 살릴 수 있습니다.")
    elif yongshin_in_daeun:
        lines.append(f"대운에 용신({yongshin})이 있어 큰 흐름은 좋으나, {seun_year}년 세운에는 용신이 부재합니다.")
    else:
        lines.append(f"{seun_year}년은 세운과 대운 모두 용신({yongshin})이 없어 신중한 판단이 필요합니다.")

    # 세운 십신 해석
    for item in seun_sipsin:
        lines.append(f"세운 {item['char']}({item['sipsin']}): {item['domain']} 방면에 변화가 예상됩니다.")

    # 대운 십신 해석
    if current_daeun and daeun_sipsin:
        lines.append(f"현재 대운 {current_daeun.ganji}({current_daeun.start_age}~{current_daeun.end_age}세):")
        for item in daeun_sipsin:
            lines.append(f"  대운 {item['char']}({item['sipsin']}): {item['domain']} 방면의 큰 흐름이 작용합니다.")

    # 충
    for clash in seun_clashes:
        lines.append(f"주의: 세운 {clash['incoming']}이(가) {clash['pillar']} {clash['target']}과(와) 충(衝)합니다. 변동·갈등에 유의하세요.")
    for clash in daeun_clashes:
        lines.append(f"주의: 대운 {clash['incoming']}이(가) {clash['pillar']} {clash['target']}과(와) 충(衝)합니다. 이 시기 큰 변화가 있을 수 있습니다.")

    # 합
    for combine in seun_combines:
        lines.append(f"세운 {combine['incoming']}이(가) {combine['pillar']} {combine['target']}과(와) {combine['type']}합니다. 새로운 인연·협력이 기대됩니다.")
    for combine in daeun_combines:
        lines.append(f"대운 {combine['incoming']}이(가) {combine['pillar']} {combine['target']}과(와) {combine['type']}합니다. 장기적 관계·변화가 예상됩니다.")

    return lines
