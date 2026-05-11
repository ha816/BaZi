from kkachi.domain.ganji import Oheng
from kkachi.domain.interpretation import InterpretBlock, InterpretTip
from kkachi.domain.natal import NatalInfo, PostnatalInfo


class AdviceInterpreter:
    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> list[InterpretBlock]:
        blocks: list[InterpretBlock] = []
        yongshin = natal.yongshin
        year = postnatal.year
        in_seun = postnatal.yongshin_in_seun
        in_daeun = postnatal.yongshin_in_daeun
        has_clash = bool(postnatal.seun_clashes or postnatal.daeun_clashes)
        has_combine = bool(postnatal.seun_combines or postnatal.daeun_combines)

        # 1. 올해 운세 서사
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
        blocks.append(InterpretBlock(description=desc))

        # 2. 특수신살
        if natal.sinsal:
            _SINSAL_ADVICE = {
                "역마살": "이동·변동의 기운이 있어요. 해외·여행·이직 기회가 왔을 때 열린 마음으로 받아들이세요.",
                "도화살": "매력과 인기의 기운이에요. 대인관계·예술·창작 분야에서 빛을 발해요.",
                "화개살": "학문·예술·종교적 깊이가 있어요. 혼자만의 시간을 통해 역량이 꽃피어요.",
                "천을귀인": "위기 때 귀인이 나타나는 복이에요. 사람과의 인연을 소중히 하세요.",
                "문창귀인": "학업·시험·문서운이 강해요. 자격증·시험 도전을 미루지 마세요.",
                "백호살": "강한 기운이라 날카롭게 쓰면 추진력, 무디게 두면 사고로 돌아와요. 건강·안전에 주의하세요.",
                "장성살": "리더십과 통솔력이 있어요. 조직·팀에서 앞에 서는 역할이 잘 맞아요.",
                "천덕귀인": "하늘의 보호가 있는 길신이에요. 재앙을 피하고 복이 오래 머물어요.",
                "월덕귀인": "조용한 평안과 조율 능력이 있어요. 갈등을 중재하고 화합을 이끄는 역할에서 빛나요.",
            }
            tips = [
                InterpretTip(
                    label=sinsal.korean,
                    text=_SINSAL_ADVICE.get(sinsal.korean, sinsal.meaning),
                )
                for _, sinsal in natal.sinsal
            ]
            blocks.append(InterpretBlock(
                category="특수신살",
                description="타고난 특수한 기운이에요. 살(殺)이라는 이름이 붙었어도 잘 활용하면 큰 무기가 돼요.",
                tips=tips,
            ))

        # 4. 개운법 (강약·삼재 반영)
        fortune = YONGSHIN_FORTUNE[yongshin]
        is_strong = natal.strength_label.startswith("신강")
        is_weak = natal.strength_label.startswith("신약")

        if is_strong:
            gaeun_desc = f"신강 사주라 기운이 넘쳐요. {yongshin.meaning}의 기운으로 넘치는 에너지를 자연스럽게 흘려보내세요."
        elif is_weak:
            gaeun_desc = f"신약 사주라 기운을 채워야 해요. {yongshin.meaning}의 기운을 집중적으로 보강하는 게 핵심이에요."
        else:
            gaeun_desc = f"{yongshin.meaning}의 기운을 일상에서 꾸준히 보강하는 방법이에요."

        tips = [
            InterpretTip(label="추천 활동", text=fortune["활동"]),
            InterpretTip(label="행운의 색상", text=fortune["색상"]),
            InterpretTip(label="좋은 방향", text=fortune["방향"]),
            InterpretTip(label="보충 음식", text=fortune["음식"]),
            InterpretTip(label="투자 방향", text=fortune["투자"]),
        ]

        if postnatal.samjae:
            samjae_type = postnatal.samjae.get("type", "삼재")
            tips.append(InterpretTip(
                label=f"삼재({samjae_type}) 주의",
                text="삼재 기간에는 큰 투자·이사·수술을 피하는 게 좋아요. 검은색 계열 소품과 북쪽 방향을 활용해 액운을 줄여보세요.",
            ))

        blocks.append(InterpretBlock(
            category="개운법",
            description=gaeun_desc,
            tips=tips,
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
