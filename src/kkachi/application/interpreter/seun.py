from kkachi.domain.ganji import Stem
from kkachi.domain.interpretation import InterpretBlock
from kkachi.domain.natal import NatalInfo, PostnatalInfo


STEM_KEYWORD: dict[str, str] = {
    "甲": "성장·도전·새로운 시작",
    "乙": "유연함·적응·세심한 노력",
    "丙": "열정·확장·드러남",
    "丁": "집중·정교함·내면 성찰",
    "戊": "안정·포용·묵직한 전진",
    "己": "실용·꼼꼼함·조용한 결실",
    "庚": "결단·정리·혁신적 전환",
    "辛": "세련됨·냉정한 판단·마무리",
    "壬": "지혜·확산·큰 흐름",
    "癸": "침잠·준비·내면의 깊이",
}


class SeunInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        lines = []
        year = postnatal.year

        stem_char, stem_sipsin = postnatal.seun_stem
        branch_char, branch_sipsin = postnatal.seun_branch

        seun_stem = Stem.from_char(stem_char)
        yongshin = natal.yongshin
        stem_keyword = STEM_KEYWORD.get(stem_char, "변화")

        # ① 올해 기운 요약
        lines.append(
            f"올해({year}년)는 {stem_char}·{branch_char}의 해예요. "
            f"{stem_keyword}의 에너지가 {stem_sipsin.domain}과 {branch_sipsin.domain} 방면을 감싸고 있어요."
        )

        # ② 올해 기운과 용신의 관계
        seun_elem = seun_stem.element
        yongshin_label = f"{yongshin.name}({yongshin.meaning})"
        seun_elem_label = f"{seun_elem.name}({seun_elem.meaning})"
        if seun_elem == yongshin:
            lines.append(
                f"올해 들어오는 {seun_elem_label} 기운이 당신에게 가장 필요한 용신과 딱 맞아떨어져요. "
                f"흐름이 완전히 내 편인 해예요. 미뤄뒀던 계획을 밀어붙이기에 지금이 최적의 타이밍입니다."
            )
        elif seun_elem.generates == yongshin:
            lines.append(
                f"올해 {seun_elem_label} 기운이 당신의 용신인 {yongshin_label}을 슬며시 밀어주고 있어요. "
                f"드라마틱하진 않지만, 꾸준히 쌓으면 하반기로 갈수록 그 성과가 서서히 드러날 거예요."
            )
        elif seun_elem.overcomes == yongshin:
            lines.append(
                f"올해 {seun_elem_label} 기운이 당신에게 필요한 {yongshin_label}을 억누르고 있어요. "
                f"흐름이 다소 거스르는 해이니, 무리한 확장보다는 내실을 다지는 쪽이 훨씬 현명합니다."
            )

        # ③ 대운·세운 방향 일치 여부
        if postnatal.current_daeun:
            daeun_ganji = postnatal.current_daeun.ganji
            daeun_stem = Stem.from_char(daeun_ganji[0])
            daeun_elem = daeun_stem.element

            if seun_elem.generates == daeun_elem or seun_elem == daeun_elem:
                lines.append(
                    f"대운({daeun_ganji})과 올해 기운({stem_char}{branch_char})이 같은 방향을 가리키고 있어요. "
                    f"큰 흐름과 당장의 현실이 잘 맞아 돌아가니, 오래 생각해왔던 계획을 실행에 옮기기에 좋은 때입니다."
                )
            elif seun_elem.overcomes == daeun_elem or daeun_elem.overcomes == seun_elem:
                lines.append(
                    f"대운({daeun_ganji})과 올해 기운({stem_char}{branch_char})이 서로 다른 방향을 가리키고 있어요. "
                    f"큰 흐름과 당장의 현실이 엇갈릴 수 있는 시기예요. "
                    f"이럴 때일수록 여러 곳에 힘을 분산하기보다 한 가지에 집중하는 것이 훨씬 힘이 됩니다."
                )

        return [InterpretBlock(description=l) for l in lines]
