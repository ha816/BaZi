from bazi.domain.interpretation import InterpretBlock
from bazi.domain.natal import NatalInfo, PostnatalInfo


class YongshinInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        yongshin = natal.yongshin
        my_element = natal.my_main_element
        strength = natal.strength
        lines = []

        if strength > 0:
            lines.append(
                f"넘치는 {my_element.meaning}의 기운을 적절히 빼주는 {yongshin.meaning}의 기운이 "
                f"당신에게 가장 도움이 됩니다. 마치 뜨거운 여름에 시원한 {yongshin.meaning}을 만난 것과 같아, "
                f"{yongshin.meaning}의 기운이 올 때 삶의 균형이 맞춰집니다."
            )
        else:
            lines.append(
                f"부족한 {my_element.meaning}의 기운을 채워주는 {yongshin.meaning}의 기운이 "
                f"당신에게 가장 도움이 됩니다. {yongshin.meaning}의 기운이 들어오는 해에는 "
                f"마치 가뭄 끝에 단비가 내리듯, 일이 풀리기 시작합니다."
            )

        in_seun = postnatal.yongshin_in_seun
        in_daeun = postnatal.yongshin_in_daeun
        year = postnatal.year

        if in_seun and in_daeun:
            lines.append(
                f"반가운 소식입니다! {year}년은 올해 운과 10년 큰 흐름 모두에서 "
                f"나에게 좋은 기운({yongshin.meaning})이 작용하여 매우 유리한 해입니다. "
                f"새로운 도전에 적극적으로 나설 때입니다."
            )
        elif in_seun:
            lines.append(
                f"{year}년 올해 운에 나에게 좋은 기운({yongshin.meaning})이 있습니다. "
                f"올해 찾아오는 기회를 놓치지 마세요. 단, 10년 큰 흐름에는 "
                f"나에게 좋은 기운이 없으니 단기 승부에 집중하는 것이 현명합니다."
            )
        elif in_daeun:
            lines.append(
                f"10년 큰 흐름에 나에게 좋은 기운({yongshin.meaning})이 흐르고 있어 "
                f"장기적으로는 좋은 시기입니다. 다만 {year}년 올해 운에는 없으니, "
                f"올해는 씨앗을 뿌리되 수확은 조급해하지 마세요."
            )
        else:
            lines.append(
                f"{year}년은 올해 운과 10년 큰 흐름 모두에 나에게 좋은 기운({yongshin.meaning})이 없습니다. "
                f"새 사업·큰 투자·이직 같은 중대한 결정은 한 박자 늦추고, "
                f"내실을 다지는 데 집중하는 것이 지혜로운 선택입니다."
            )

        return [InterpretBlock(description=l) for l in lines]
