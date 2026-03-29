from bazi.domain.ganji import Sipsin
from bazi.domain.natal import PostnatalInfo


class DaeunInterpreter:
    def __call__(self, postnatal: PostnatalInfo) -> list[str]:
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


SIPSIN_DETAIL: dict[Sipsin, str] = {
    Sipsin.比肩: "동료·경쟁자가 많아지며 독립심이 강해집니다.",
    Sipsin.劫財: "경쟁이 치열해지고 재물 관리에 주의가 필요합니다.",
    Sipsin.食神: "재능 발휘와 표현력이 좋아지며 식복이 따릅니다.",
    Sipsin.傷官: "창의력이 높아지나 대인관계에서 마찰이 생길 수 있습니다.",
    Sipsin.偏財: "투자·사업 기회가 오며 유동적 재물 운이 활발합니다.",
    Sipsin.正財: "안정적 수입이 기대되며 저축·근면한 재물 운입니다.",
    Sipsin.偏官: "변화와 도전이 찾아오며 권력·승진 기회가 있습니다.",
    Sipsin.正官: "직장에서 인정받고 명예가 올라가는 시기입니다.",
    Sipsin.偏印: "영감과 아이디어가 풍부하나 안정감은 떨어질 수 있습니다.",
    Sipsin.正印: "학업·자격 취득에 유리하고 윗사람의 도움이 있습니다.",
}
