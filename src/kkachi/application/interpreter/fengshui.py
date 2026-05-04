from kkachi.application.interpreter.advice import YONGSHIN_FORTUNE
from kkachi.domain.ganji import Oheng
from kkachi.domain.interpretation import (
    FengShuiResult,
    InterpretTip,
    LuckyDirection,
    TrigramInfo,
)
from kkachi.domain.natal import NatalInfo


class FengShuiInterpreter:
    """팔택풍수(八宅風水) 기반 풍수지리 해석기.

    생년·성별 → 쿠아 넘버(1~9) → 동/서사택 그룹 → 행운·흉한 방위 + 인테리어 개운법.
    """

    def __call__(self, natal: NatalInfo, birth_year: int, is_male: bool) -> FengShuiResult | None:
        if not birth_year:
            return None

        kua = _calc_kua(birth_year, is_male)
        info = _KUA_DATA[kua]
        trigram_char = info["trigram_char"]
        trigram_meta = _TRIGRAM_DATA[trigram_char]
        element_oheng = Oheng[info["element"]]

        trigram = TrigramInfo(
            char=trigram_char,
            reading=trigram_meta["reading"],
            element=info["element"],
            element_korean=element_oheng.meaning,
            description=trigram_meta["description"],
        )

        lucky_directions = [
            LuckyDirection(
                direction=direction,
                kind_korean=kind["kind_korean"],
                kind_han=kind["kind_han"],
                meaning=kind["meaning"],
            )
            for direction, kind in zip(info["lucky"], _LUCKY_KINDS)
        ]

        yongshin = natal.yongshin
        fortune = YONGSHIN_FORTUNE.get(yongshin, {})
        missing = [o for o, c in natal.element_stats.items() if c == 0]

        interior_tips: list[InterpretTip] = []
        if fortune.get("색상"):
            interior_tips.append(InterpretTip(label="행운 색상", text=fortune["색상"]))
        if fortune.get("방향"):
            interior_tips.append(InterpretTip(label="용신 방향", text=fortune["방향"]))
        for o in missing:
            item = _ELEMENT_ITEM.get(o)
            if item:
                interior_tips.append(InterpretTip(label=f"{o.meaning}({o.name}) 보완", text=item))

        return FengShuiResult(
            kua_number=kua,
            trigram=trigram,
            group=info["group"],
            is_eastern=info["group"].startswith("동사택"),
            lucky_directions=lucky_directions,
            unlucky_directions=info["unlucky"],
            avoid_advice="출입문·침대·책상이 흉방을 향하지 않도록 두는 것이 좋아요.",
            interior_intro=f"용신 {yongshin.meaning}({yongshin.name})의 기운을 공간에 들이는 배치예요.",
            interior_tips=interior_tips,
        )


def _calc_kua(birth_year: int, is_male: bool) -> int:
    y = birth_year % 100
    s = (y // 10) + (y % 10)
    while s >= 10:
        s = (s // 10) + (s % 10)

    if birth_year >= 2000:
        kua = (9 - s) if is_male else (s + 6)
    else:
        kua = (10 - s) if is_male else (s + 5)

    kua = kua % 9 or 9
    if kua == 5:
        kua = 2 if is_male else 8
    return kua


_ELEMENT_ITEM: dict[Oheng, str] = {
    Oheng.木: "나무·식물 소품, 초록 계열 쿠션이나 커튼",
    Oheng.火: "캔들·조명, 붉은·주황 계열 포인트 소품",
    Oheng.土: "도자기·석재 소품, 황토·베이지 계열 러그",
    Oheng.金: "금속 액자·은색 인테리어, 흰색 계열 소품",
    Oheng.水: "어항·분수·수반, 파란색·남색 계열 커튼",
}

_LUCKY_KINDS: list[dict[str, str]] = [
    {"kind_korean": "생기", "kind_han": "生氣", "meaning": "최고 길방, 재물·성취"},
    {"kind_korean": "연년", "kind_han": "延年", "meaning": "건강·장수·인연"},
    {"kind_korean": "천의", "kind_han": "天醫", "meaning": "귀인·치유·회복"},
    {"kind_korean": "복위", "kind_han": "伏位", "meaning": "안정·꾸준한 발전"},
]

_TRIGRAM_DATA: dict[str, dict[str, str]] = {
    "坎": {"reading": "감", "description": "흐르는 물처럼 어떤 형태에도 적응하며 깊은 지혜를 품어요."},
    "坤": {"reading": "곤", "description": "대지가 만물을 기르듯 포용력과 인내가 가장 큰 힘이에요."},
    "震": {"reading": "진", "description": "천둥이 대지를 깨우듯 강한 추진력과 행동력이 특징이에요."},
    "巽": {"reading": "손", "description": "바람이 어디든 스며들듯 유연함과 침투력이 뛰어나요."},
    "乾": {"reading": "건", "description": "하늘이 모든 것을 아우르듯 리더십과 강한 의지가 돋보여요."},
    "兌": {"reading": "태", "description": "잔잔한 물이 빛을 담듯 기쁨과 소통으로 사람을 끌어당겨요."},
    "艮": {"reading": "간", "description": "산처럼 묵직하고 변하지 않는 신뢰와 안정감이 강점이에요."},
    "離": {"reading": "리", "description": "불꽃이 사방을 밝히듯 열정과 존재감으로 주변을 이끌어요."},
}

_KUA_DATA: dict[int, dict] = {
    1: {"group": "동사택(東四宅)", "trigram_char": "坎", "element": "水",
        "lucky": ["북", "남", "동", "동남"], "unlucky": ["서", "동북", "서북", "서남"]},
    2: {"group": "서사택(西四宅)", "trigram_char": "坤", "element": "土",
        "lucky": ["서남", "서북", "서", "동북"], "unlucky": ["동", "동남", "남", "북"]},
    3: {"group": "동사택(東四宅)", "trigram_char": "震", "element": "木",
        "lucky": ["동남", "북", "남", "동"], "unlucky": ["서남", "서", "동북", "서북"]},
    4: {"group": "동사택(東四宅)", "trigram_char": "巽", "element": "木",
        "lucky": ["남", "동", "북", "동남"], "unlucky": ["서북", "서남", "서", "동북"]},
    6: {"group": "서사택(西四宅)", "trigram_char": "乾", "element": "金",
        "lucky": ["서북", "서남", "동북", "서"], "unlucky": ["동남", "남", "동", "북"]},
    7: {"group": "서사택(西四宅)", "trigram_char": "兌", "element": "金",
        "lucky": ["서", "동북", "서남", "서북"], "unlucky": ["동", "동남", "북", "남"]},
    8: {"group": "서사택(西四宅)", "trigram_char": "艮", "element": "土",
        "lucky": ["동북", "서", "서북", "서남"], "unlucky": ["남", "북", "동남", "동"]},
    9: {"group": "동사택(東四宅)", "trigram_char": "離", "element": "火",
        "lucky": ["동", "동남", "남", "북"], "unlucky": ["서", "서북", "서남", "동북"]},
}
