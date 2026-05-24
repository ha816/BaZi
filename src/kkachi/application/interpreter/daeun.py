from kkachi.domain.interpretation import InterpretBlock
from kkachi.domain.natal import PostnatalInfo


class DaeunInterpreter:
    def __call__(self, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        current = postnatal.current_daeun
        if not current:
            return []

        yong_tag = " 용신 기운이 함께 들어와 있어 추진력이 자연스럽게 살아나는 시기예요." if current.has_yongshin else ""
        text = (
            f"현재 대운(大運)은 {current.ganji}({current.start_age}세 ~ {current.end_age}세)예요. "
            f"10년 단위로 흐르는 큰 분위기가 이 기간 동안 당신의 무대를 만들어줍니다."
            f"{yong_tag}"
        )
        return [InterpretBlock(description=text)]
