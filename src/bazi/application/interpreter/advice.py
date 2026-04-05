from bazi.domain.ganji import Oheng
from bazi.domain.interpretation import InterpretBlock, InterpretTip
from bazi.domain.natal import NatalInfo, PostnatalInfo


class AdviceInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        blocks = []
        yongshin = natal.yongshin
        year = postnatal.year
        in_seun = postnatal.yongshin_in_seun
        in_daeun = postnatal.yongshin_in_daeun
        has_clash = bool(postnatal.seun_clashes or postnatal.daeun_clashes)
        has_combine = bool(postnatal.seun_combines or postnatal.daeun_combines)

        if in_seun and in_daeun and not has_clash:
            desc = (
                f"{year}년은 바람이 돛을 가득 채운 배와 같습니다. "
                f"나에게 좋은 기운이 올해 운과 큰 흐름 모두에 작용하고 부딪히는 기운도 없어서, "
                f"새로운 사업 시작·이직·투자 등 적극적으로 추진하기 좋은 해입니다."
            )
        elif in_seun and has_clash:
            desc = (
                f"{year}년은 폭풍 속에 보물이 숨어있는 해입니다. "
                f"나에게 좋은 기운이 있어 기회는 분명히 오지만, 부딪히는 기운도 함께하므로 "
                f"갈등 한가운데서 냉정하게 기회를 잡는 지혜가 필요합니다."
            )
        elif in_daeun and not in_seun and has_combine:
            desc = (
                f"{year}년은 강의 흐름은 좋으나 잔물결이 이는 해입니다. "
                f"10년 큰 흐름이 좋고 어울리는 기운이 귀인을 데려오지만, "
                f"올해 운에 나에게 좋은 기운이 없으니 내실을 다지며 다음 해를 준비하세요."
            )
        elif not in_seun and not in_daeun and has_clash:
            desc = (
                f"{year}년은 거센 역풍을 맞는 시기입니다. "
                f"나에게 좋은 기운이 없고 부딪히는 기운까지 있으므로, 새로운 시도보다는 "
                f"현재 가진 것을 지키는 데 집중하세요. 큰 결정은 반드시 한 박자 늦추세요."
            )
        else:
            desc = (
                f"{year}년은 겨울처럼 에너지를 안으로 모으는 시기입니다. "
                f"무리한 확장보다는 자기 계발·건강 관리·인간관계 정리 등 "
                f"내면을 가꾸는 데 집중하면, 다가올 봄에 크게 도약할 수 있습니다."
            )

        if desc:
            blocks.append(InterpretBlock(description=desc))

        fortune = YONGSHIN_FORTUNE[yongshin]
        blocks.append(InterpretBlock(
            category="개운법",
            description=f"{yongshin.meaning}의 기운을 보강하는 방법",
            tips=[
                InterpretTip(label="추천 활동", text=fortune["활동"]),
                InterpretTip(label="행운의 색상", text=fortune["색상"]),
                InterpretTip(label="좋은 방향", text=fortune["방향"]),
                InterpretTip(label="보충 음식", text=fortune["음식"]),
                InterpretTip(label="투자 방향", text=fortune["투자"]),
            ],
        ))

        return blocks


YONGSHIN_FORTUNE: dict[Oheng, dict[str, str]] = {
    Oheng.木: {
        "활동": "등산·산책·원예 등 자연과 가까운 활동",
        "색상": "초록색·연두색 계열의 옷이나 소품",
        "방향": "동쪽 방향으로의 이동이나 동향 배치",
        "음식": "신맛 나는 음식(레몬·식초·매실)",
        "투자": "성장주·신사업·교육 관련 투자",
    },
    Oheng.火: {
        "활동": "운동·발표·네트워킹 등 열정적인 활동",
        "색상": "붉은색·주황색 계열의 포인트 아이템",
        "방향": "남쪽 방향이 길하며, 밝은 조명의 공간",
        "음식": "쓴맛 나는 음식(커피·다크초콜릿·녹차)",
        "투자": "IT·미디어·에너지 관련 분야",
    },
    Oheng.土: {
        "활동": "명상·요가·부동산 탐방 등 안정감을 주는 활동",
        "색상": "노란색·베이지·브라운 계열의 따뜻한 톤",
        "방향": "중앙이 좋으며, 안정된 공간에 머무르기",
        "음식": "단맛 나는 음식(고구마·단호박·꿀)",
        "투자": "부동산·리츠·인프라 등 실물 자산",
    },
    Oheng.金: {
        "활동": "재정 정리·미니멀 라이프·정리 정돈",
        "색상": "흰색·은색·골드 계열의 깔끔한 톤",
        "방향": "서쪽 방향이 길하며, 정돈된 환경",
        "음식": "매운맛 나는 음식(고추·생강·마늘)",
        "투자": "배당주·금·안정적 채권",
    },
    Oheng.水: {
        "활동": "여행·수영·독서 등 유연하고 흐르는 활동",
        "색상": "검은색·남색·파란색 계열",
        "방향": "북쪽 방향이 길하며, 물 가까운 환경",
        "음식": "짠맛 나는 음식(해산물·미역·김)",
        "투자": "유동성 높은 자산, 해외 투자, 물류·유통",
    },
}
