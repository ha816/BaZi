from kkachi.domain.ganji import Branch, Stem
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
        seun_branch = Branch.from_char(branch_char)
        yongshin = natal.yongshin

        stem_keyword = STEM_KEYWORD.get(stem_char, "변화")

        lines.append(
            f"{year}년 하늘 기운({stem_char})은 {stem_sipsin.domain} 방면에 변화를 가져옵니다. "
            f"{stem_keyword}의 기운이 강하게 작용하는 해입니다."
        )
        lines.append(
            f"{year}년 땅 기운({branch_char})은 {branch_sipsin.domain} 방면의 환경을 만듭니다."
        )

        seun_elem = seun_stem.element
        yongshin_label = f"{yongshin.name}({yongshin.meaning})"
        seun_elem_label = f"{seun_elem.name}({seun_elem.meaning})"
        if seun_elem == yongshin:
            lines.append(
                f"올해 들어오는 {seun_elem_label} 기운이 당신에게 가장 필요한 용신(用神)과 정확히 일치합니다. "
                f"에너지 흐름이 당신 편인 해로, 계획했던 일을 밀고 나갈 최적의 타이밍입니다."
            )
        elif seun_elem.generates == yongshin:
            lines.append(
                f"올해 {seun_elem_label} 기운이 용신인 {yongshin_label} 기운을 생해줍니다. "
                f"직접적인 힘은 아니지만 좋은 에너지가 쌓이는 흐름이어서, 꾸준히 노력하면 하반기로 갈수록 성과가 드러납니다."
            )
        elif seun_elem.overcomes == yongshin:
            lines.append(
                f"올해 {seun_elem_label} 기운이 용신인 {yongshin_label} 기운을 억제합니다. "
                f"에너지 흐름이 다소 거스르는 해이므로, 큰 결정보다는 내실을 다지고 방어적으로 운영하는 것이 유리합니다."
            )

        if postnatal.seun_clashes:
            for clash in postnatal.seun_clashes:
                pillar = clash.get('pillar', '')
                meaning = PILLAR_MEANING.get(pillar, pillar)
                lines.append(
                    f"올해 세운이 {meaning} 영역과 충(衝)을 이룹니다. "
                    f"이 영역에서 예상치 못한 변동이나 이별, 갈등이 발생할 수 있으니 미리 대비하세요."
                )

        if postnatal.seun_combines:
            for combine in postnatal.seun_combines:
                pillar = combine.get('pillar', '')
                meaning = PILLAR_MEANING.get(pillar, pillar)
                lines.append(
                    f"올해 세운이 {meaning} 영역과 합(合)을 이룹니다. "
                    f"이 영역에서 좋은 인연이 맺어지거나 뜻밖의 기회가 열릴 수 있습니다."
                )

        if postnatal.current_daeun:
            daeun_ganji = postnatal.current_daeun.ganji
            daeun_stem_char = daeun_ganji[0]
            daeun_stem = Stem.from_char(daeun_stem_char)
            daeun_elem = daeun_stem.element

            if seun_elem.generates == daeun_elem or seun_elem == daeun_elem:
                lines.append(
                    f"대운({daeun_ganji})과 세운({stem_char}{branch_char})이 서로 에너지를 보완하고 있습니다. "
                    f"큰 흐름과 올해 운이 같은 방향을 가리키니, 장기 계획을 실행하기에 좋은 해입니다."
                )
            elif seun_elem.overcomes == daeun_elem or daeun_elem.overcomes == seun_elem:
                lines.append(
                    f"대운({daeun_ganji})과 세운({stem_char}{branch_char})의 기운이 서로 맞서고 있습니다. "
                    f"큰 흐름과 올해 기운이 다른 방향을 가리킬 수 있어 내면의 혼란이나 결정 지연이 생길 수 있습니다. "
                    f"한 가지에 집중하는 전략이 필요합니다."
                )

        return [InterpretBlock(description=l) for l in lines]


PILLAR_MEANING: dict[str, str] = {
    "년주": "조상·사회적 환경",
    "월주": "부모·직장·사회활동",
    "일주": "본인·배우자",
    "시주": "자녀·말년·미래",
}
