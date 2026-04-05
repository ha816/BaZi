from bazi.domain.ganji import Oheng
from bazi.domain.interpretation import InterpretBlock
from bazi.domain.natal import NatalInfo


class PersonalityInterpreter:
    def __call__(self, natal: NatalInfo) -> list[InterpretBlock]:
        my_element = natal.my_main_element
        metaphor = OHENG_METAPHOR[my_element]
        lines = [
            f"당신은 {metaphor}를 가진 사람입니다. {my_element.personality}"
        ]

        if natal.sibi_unseong:
            _, day_unseong = natal.sibi_unseong[2]
            lines.append(
                f"여기에 '{day_unseong.meaning}'의 에너지가 더해져, "
                f"삶의 기본 리듬을 형성합니다."
            )

        seen = set()
        for branch, sinsal in natal.sinsal:
            if sinsal.korean not in seen:
                seen.add(sinsal.korean)
                lines.append(f"특히 {sinsal.korean}이 있어 {sinsal.meaning} 성향이 두드러집니다.")

        return [InterpretBlock(description=l) for l in lines]


class ElementBalanceInterpreter:
    def __call__(self, natal: NatalInfo) -> list[InterpretBlock]:
        stats = natal.element_stats
        my_element = natal.my_main_element
        lines = []

        dist = ", ".join(f"{oheng.meaning} {count}개" for oheng, count in stats.items())
        lines.append(f"다섯 가지 기운의 분포는 [{dist}]입니다.")

        excess = [oheng for oheng, count in stats.items() if count >= 3]
        lacking = [oheng for oheng, count in stats.items() if count == 0]

        if excess:
            for oheng in excess:
                lines.append(f"{oheng.meaning}의 기운이 {stats[oheng]}개로 과다합니다. {OHENG_EXCESS[oheng]}")
        if lacking:
            for oheng in lacking:
                lines.append(f"{oheng.meaning}의 기운이 없습니다. {OHENG_LACK[oheng]}")

        if not excess and not lacking:
            lines.append("다섯 가지 기운이 비교적 고르게 분포되어 있어 안정적인 구성입니다.")

        strength = natal.strength
        if strength > 0:
            lines.append(
                f"기운이 강한 편(+{strength})이에요. {OHENG_METAPHOR[my_element]}가 넘치는 상태입니다. "
                f"이 에너지를 바깥으로 발산하는 활동(운동·사업 확장·봉사)이 균형을 맞춰줍니다."
            )
        elif strength < 0:
            lines.append(
                f"기운이 약한 편({strength})이에요. {my_element.meaning}의 기운이 주변에 눌려 있는 상태입니다. "
                f"든든한 지원군(멘토·팀·가족)과 함께할 때 본래의 역량이 발휘됩니다."
            )
        else:
            lines.append(
                "다섯 기운이 균형을 이루고 있어 어떤 환경에서든 안정적으로 적응할 수 있습니다."
            )

        return [InterpretBlock(description=l) for l in lines]


OHENG_METAPHOR: dict[Oheng, str] = {
    Oheng.木: "봄날의 큰 나무처럼 위로 뻗어가는 에너지",
    Oheng.火: "한여름의 태양처럼 강렬하게 타오르는 에너지",
    Oheng.土: "너른 대지처럼 모든 것을 품어내는 에너지",
    Oheng.金: "가을 서리처럼 맑고 날카로운 에너지",
    Oheng.水: "깊은 바다처럼 유연하고 끝없이 흐르는 에너지",
}

OHENG_EXCESS: dict[Oheng, str] = {
    Oheng.木: "나무가 너무 빽빽하면 서로 햇빛을 가리듯, 추진력이 과해 무리하기 쉽습니다. 간·담 건강에도 유의하세요.",
    Oheng.火: "불길이 너무 세면 주변까지 태우듯, 감정 기복이 크고 성급해질 수 있습니다. 심장·혈압에 유의하세요.",
    Oheng.土: "흙이 너무 단단하면 새싹이 뚫지 못하듯, 고집이 세고 변화를 꺼리게 됩니다. 소화기 건강에 유의하세요.",
    Oheng.金: "쇠가 너무 차가우면 사람이 다가가기 어렵듯, 대인관계가 경직될 수 있습니다. 폐·호흡기에 유의하세요.",
    Oheng.水: "물이 넘치면 방향을 잃듯, 우유부단해지고 불안감이 커질 수 있습니다. 신장·방광에 유의하세요.",
}

OHENG_LACK: dict[Oheng, str] = {
    Oheng.木: "나무가 없는 벌판처럼, 추진력과 결단력이 부족하여 시작이 어려울 수 있습니다.",
    Oheng.火: "불꽃 없는 겨울밤처럼, 열정과 적극성이 부족하여 동기 부여가 필요합니다.",
    Oheng.土: "뿌리 내릴 땅이 없는 것처럼, 안정감과 신뢰 기반이 흔들릴 수 있습니다.",
    Oheng.金: "칼날 없는 칼처럼, 결단력과 실행력이 부족하여 마무리가 약할 수 있습니다.",
    Oheng.水: "샘이 마른 우물처럼, 지혜와 유연성이 부족하여 융통성이 필요합니다.",
}
