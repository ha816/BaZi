from bazi.application.constant import SIPSIN_DETAIL
from bazi.domain.natal import PostnatalInfo


def get_major_fortune(postnatal: PostnatalInfo) -> list[str]:
    lines = []
    current_daeun = postnatal.current_daeun
    if not current_daeun:
        return lines

    lines.append(f"현재 대운 {current_daeun.ganji}({current_daeun.start_age}~{current_daeun.end_age}세):")

    for char, sipsin in postnatal.daeun_sipsin:
        lines.append(f"  {char}({sipsin.name}): {SIPSIN_DETAIL[sipsin]}")

    daeun_list = postnatal.daeun
    current_idx = next(
        (i for i, dp in enumerate(daeun_list) if dp.ganji == current_daeun.ganji), None
    )
    if current_idx is not None:
        if current_idx > 0:
            prev = daeun_list[current_idx - 1]
            lines.append(f"  이전 대운 {prev.ganji}({prev.start_age}~{prev.end_age}세)에서 전환된 흐름입니다.")
        if current_idx < len(daeun_list) - 1:
            nxt = daeun_list[current_idx + 1]
            lines.append(f"  다음 대운 {nxt.ganji}({nxt.start_age}~{nxt.end_age}세)로의 전환을 준비하세요.")

    return lines
