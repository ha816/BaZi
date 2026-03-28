from bazi.application.constant import OHENG_EXCESS, OHENG_LACK, OHENG_METAPHOR
from bazi.domain.natal import NatalInfo


class PersonalityInterpreter:
    def __call__(self, natal: NatalInfo) -> list[str]:
        my_element = natal.my_main_element
        metaphor = OHENG_METAPHOR[my_element]
        lines = [
            f"당신은 {metaphor}를 가진 사람입니다. {my_element.personality}"
        ]

        if natal.sibi_unseong:
            _, day_unseong = natal.sibi_unseong[2]
            lines.append(
                f"여기에 일주 십이운성 {day_unseong.name}({day_unseong.meaning})의 "
                f"기운이 더해져, 삶의 기본 리듬을 형성합니다."
            )

        for branch, sinsal in natal.sinsal:
            lines.append(f"특히 {sinsal.korean}이 있어 {sinsal.meaning} 성향이 두드러집니다.")

        return lines


class ElementBalanceInterpreter:
    def __call__(self, natal: NatalInfo) -> list[str]:
        stats = natal.element_stats
        my_element = natal.my_main_element
        lines = []

        dist = ", ".join(f"{oheng.name} {count}개" for oheng, count in stats.items())
        lines.append(f"팔자 속 오행 분포는 [{dist}]입니다.")

        excess = [oheng for oheng, count in stats.items() if count >= 3]
        lacking = [oheng for oheng, count in stats.items() if count == 0]

        if excess:
            for oheng in excess:
                lines.append(f"{oheng.name}({oheng.meaning})이 {stats[oheng]}개로 과다합니다. {OHENG_EXCESS[oheng]}")
        if lacking:
            for oheng in lacking:
                lines.append(f"{oheng.name}({oheng.meaning})이 없습니다. {OHENG_LACK[oheng]}")

        if not excess and not lacking:
            lines.append("다섯 가지 기운이 비교적 고르게 분포되어 있어 안정적인 구성입니다.")

        strength = natal.strength
        if strength > 0:
            lines.append(
                f"신강(+{strength}) — {OHENG_METAPHOR[my_element]}가 넘치는 상태입니다. "
                f"이 에너지를 바깥으로 발산하는 활동(운동·사업 확장·봉사)이 균형을 맞춰줍니다."
            )
        elif strength < 0:
            lines.append(
                f"신약({strength}) — {my_element.name}의 기운이 주변에 눌려 있는 상태입니다. "
                f"든든한 지원군(멘토·팀·가족)과 함께할 때 본래의 역량이 발휘됩니다."
            )
        else:
            lines.append(
                "중화(0) — 오행이 균형을 이루고 있어 어떤 환경에서든 안정적으로 적응할 수 있습니다."
            )

        return lines
