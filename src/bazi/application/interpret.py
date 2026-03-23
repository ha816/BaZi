"""종합 해석: NatalInfo + FortuneInfo를 조합하여 규칙 기반 해석을 생성한다."""

from dataclasses import dataclass, field

from bazi.application.natal import NatalInfo
from bazi.application.fortune import DaeunPeriod, FortuneInfo
from bazi.domain.fortune import Pillar
from bazi.domain.ganji import Branch, Stem, lookup
from bazi.domain.sipsin import Sipsin


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
    natal: NatalInfo,
    fortune: FortuneInfo,
    age: int,
) -> Interpretation:
    """선천 + 후천 데이터를 종합하여 규칙 기반 해석을 생성한다."""
    yongshin = natal.yongshin

    # 1. 용신 충족
    yongshin_in_seun = _check_yongshin(yongshin, fortune.seun_ganji)
    current_daeun = _get_current_daeun(fortune.daeun, age)
    yongshin_in_daeun = _check_yongshin(yongshin, current_daeun.ganji) if current_daeun else False

    # 2. 십신 해석
    seun_sipsin = _build_sipsin_domains(fortune.seun)
    daeun_sipsin = _calc_sipsin_domains(natal.saju.day_stem, current_daeun.ganji) if current_daeun else []

    # 3. 충·합
    seun_clashes = _find_clashes(natal, fortune.seun_ganji)
    seun_combines = _find_combines(natal, fortune.seun_ganji)
    daeun_clashes = _find_clashes(natal, current_daeun.ganji) if current_daeun else []
    daeun_combines = _find_combines(natal, current_daeun.ganji) if current_daeun else []

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


# ── 해석 유틸 ──


def _get_current_daeun(daeun: list[DaeunPeriod], age: int) -> DaeunPeriod | None:
    """현재 나이에 해당하는 대운을 찾는다."""
    for d in daeun:
        if d.start_age <= age <= d.end_age:
            return d
    return None


def _check_yongshin(yongshin: str, ganji: str) -> bool:
    """간지에 용신 오행이 포함되어 있는지 확인한다."""
    return any(lookup(ch).element.name == yongshin for ch in ganji)


def _build_sipsin_domains(seun: list[tuple[str, str]]) -> list[dict]:
    """십신 튜플 리스트를 영역 해석 dict로 변환한다."""
    return [
        {"char": char, "sipsin": sipsin, "domain": Sipsin[sipsin].domain}
        for char, sipsin in seun
    ]


def _calc_sipsin_domains(day_stem: str, ganji: str) -> list[dict]:
    """간지의 십신 영역 해석을 계산한다."""
    return [
        {
            "char": ch,
            "sipsin": (s := Sipsin.of(day_stem, ch)).name,
            "domain": s.domain,
        }
        for ch in ganji
    ]


def _find_clashes(natal: NatalInfo, ganji: str) -> list[dict]:
    """간지와 사주 네 기둥 사이의 지지충(衝)을 찾는다."""
    incoming = Branch[ganji[1]]
    results = []

    for i, pillar in enumerate(natal.saju.pillars):
        if incoming.clashes.name == pillar[1]:
            results.append({
                "incoming": incoming.name,
                "target": pillar[1],
                "pillar": Pillar.by_order(i).korean,
            })

    return results


def _find_combines(natal: NatalInfo, ganji: str) -> list[dict]:
    """간지와 사주 네 기둥 사이의 합(天干合·地支六合)을 찾는다."""
    incoming_stem = Stem[ganji[0]]
    incoming_branch = Branch[ganji[1]]
    results = []

    for i, pillar in enumerate(natal.saju.pillars):
        if incoming_stem.combines.name == pillar[0]:
            results.append({
                "incoming": incoming_stem.name,
                "target": pillar[0],
                "pillar": Pillar.by_order(i).korean,
                "type": "천간합",
            })
        if incoming_branch.combines.name == pillar[1]:
            results.append({
                "incoming": incoming_branch.name,
                "target": pillar[1],
                "pillar": Pillar.by_order(i).korean,
                "type": "지지합",
            })

    return results


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