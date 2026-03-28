from bazi.application.constant import YONGSHIN_FORTUNE
from bazi.domain.natal import NatalInfo, PostnatalInfo


def get_advice(natal: NatalInfo, postnatal: PostnatalInfo) -> list[str]:
    lines = []
    yongshin = natal.yongshin
    year = postnatal.year
    in_seun = postnatal.yongshin_in_seun
    in_daeun = postnatal.yongshin_in_daeun
    has_clash = bool(postnatal.seun_clashes or postnatal.daeun_clashes)
    has_combine = bool(postnatal.seun_combines or postnatal.daeun_combines)

    if in_seun and in_daeun and not has_clash:
        lines.append(
            f"{year}년은 바람이 돛을 가득 채운 배와 같습니다. "
            f"용신이 세운·대운 모두에 작용하고 충이 없어, "
            f"새로운 사업 시작·이직·투자 등 적극적으로 추진하기 좋은 해입니다."
        )
    elif in_seun and has_clash:
        lines.append(
            f"{year}년은 폭풍 속에 보물이 숨어있는 해입니다. "
            f"용신이 있어 기회는 분명히 오지만, 충의 에너지도 함께하므로 "
            f"갈등 한가운데서 냉정하게 기회를 잡는 지혜가 필요합니다."
        )
    elif in_daeun and not in_seun and has_combine:
        lines.append(
            f"{year}년은 강의 흐름은 좋으나 잔물결이 이는 해입니다. "
            f"대운의 큰 흐름이 좋고 합의 에너지가 귀인을 데려오지만, "
            f"세운에 용신이 없으니 내실을 다지며 다음 해를 준비하세요."
        )
    elif not in_seun and not in_daeun and has_clash:
        lines.append(
            f"{year}년은 거센 역풍을 맞는 시기입니다. "
            f"용신이 부재하고 충까지 있으므로, 새로운 시도보다는 "
            f"현재 가진 것을 지키는 데 집중하세요. 큰 결정은 반드시 한 박자 늦추세요."
        )
    elif not in_seun and not in_daeun:
        lines.append(
            f"{year}년은 겨울처럼 에너지를 안으로 모으는 시기입니다. "
            f"무리한 확장보다는 자기 계발·건강 관리·인간관계 정리 등 "
            f"내면을 가꾸는 데 집중하면, 다가올 봄에 크게 도약할 수 있습니다."
        )

    fortune = YONGSHIN_FORTUNE[yongshin]
    lines.append(
        f"용신 {yongshin.name}({yongshin.meaning})을 보강하는 개운법:"
    )
    lines.append(f"  🎯 추천 활동: {fortune['활동']}")
    lines.append(f"  🎨 행운의 색상: {fortune['색상']}")
    lines.append(f"  🧭 길한 방향: {fortune['방향']}")
    lines.append(f"  🍽️ 보충 음식: {fortune['음식']}")
    lines.append(f"  💰 투자 방향: {fortune['투자']}")

    return lines
