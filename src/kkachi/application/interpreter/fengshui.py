from kkachi.application.interpreter.advice import YONGSHIN_FORTUNE
from kkachi.domain.ganji import Oheng
from kkachi.domain.interpretation import (
    FengShuiResult,
    InterpretTip,
    LuckyDirection,
    TrigramInfo,
    UnluckyDirection,
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
                usage=kind["usage"],
            )
            for direction, kind in zip(info["lucky"], _LUCKY_KINDS)
        ]

        unlucky_directions = [
            UnluckyDirection(
                direction=direction,
                kind_korean=_UNLUCKY_KIND_META[kind_name]["kind_korean"],
                kind_han=_UNLUCKY_KIND_META[kind_name]["kind_han"],
                meaning=_UNLUCKY_KIND_META[kind_name]["meaning"],
            )
            for direction, kind_name in zip(info["unlucky"], info["unlucky_kinds"])
        ]

        yongshin = natal.yongshin
        fortune = YONGSHIN_FORTUNE.get(yongshin, {})
        missing = [o for o, c in natal.element_stats.items() if c == 0]
        best_dir = info["lucky"][0]
        health_dir = info["lucky"][1]

        interior_tips: list[InterpretTip] = []

        interior_tips.append(InterpretTip(
            label=f"생기방({best_dir}) 활용",
            text=f"책상·작업 공간을 {best_dir}쪽으로 배치하세요. 재물운·성취운이 가장 강하게 들어오는 자리예요.",
        ))
        interior_tips.append(InterpretTip(
            label=f"침대 머리 방향 — {health_dir}",
            text=f"침대 머리를 {health_dir}쪽으로 향하게 두면 건강·숙면에 좋아요. 연년(延年)은 장수와 인연을 돕는 방위예요.",
        ))
        if fortune.get("색상"):
            interior_tips.append(InterpretTip(
                label="행운 색상 활용",
                text=f"{fortune['색상']} — 침구·커튼·소품에 사용하세요. 특히 생기방({best_dir}) 가구에 이 색을 더하면 효과가 높아요.",
            ))
        for o in missing:
            item = _ELEMENT_ITEM.get(o)
            if item:
                interior_tips.append(InterpretTip(
                    label=f"{o.meaning}({o.name}) 기운 보완",
                    text=item,
                ))

        worst_dir = next(
            (d.direction for d in unlucky_directions if d.kind_korean == "절명"), info["unlucky"][2]
        )

        return FengShuiResult(
            kua_number=kua,
            trigram=trigram,
            group=info["group"],
            is_eastern=info["group"].startswith("동사택"),
            lucky_directions=lucky_directions,
            unlucky_directions=unlucky_directions,
            avoid_advice=f"{best_dir}의 생기(生氣)를 향해 책상·작업 공간을 배치하면 재물운·성취운이 가장 강하게 들어와요. 반대로 {worst_dir}의 절명(絶命)은 흉방 중 가장 강하니 출입문·침대·책상이 이 방향을 향하지 않도록 주의하세요.",
            interior_intro=f"용신 {yongshin.meaning}({yongshin.name})의 기운을 공간에 들이는 배치예요. 방위·색상·소품 하나씩 바꿔보세요.",
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
    {"kind_korean": "생기", "kind_han": "生氣", "meaning": "재물·성취·활력", "usage": "책상·작업 공간을 이 방향으로"},
    {"kind_korean": "연년", "kind_han": "延年", "meaning": "건강·장수·인연", "usage": "침대 머리를 이 방향으로"},
    {"kind_korean": "천의", "kind_han": "天醫", "meaning": "귀인·치유·회복", "usage": "몸이 아플 때 이 방향으로 주무세요"},
    {"kind_korean": "복위", "kind_han": "伏位", "meaning": "안정·꾸준한 발전", "usage": "명상·독서 자리로 활용하세요"},
]

_UNLUCKY_KIND_META: dict[str, dict[str, str]] = {
    "절명": {"kind_korean": "절명", "kind_han": "絶命", "meaning": "건강·재물 손상 — 흉방 중 가장 강해요"},
    "오귀": {"kind_korean": "오귀", "kind_han": "五鬼", "meaning": "구설·관재·예기치 못한 사고"},
    "육살": {"kind_korean": "육살", "kind_han": "六殺", "meaning": "인간관계 갈등·소송·상실"},
    "화해": {"kind_korean": "화해", "kind_han": "禍害", "meaning": "다툼·경미한 불운 — 흉방 중 가장 약해요"},
}

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
        "lucky": ["북", "남", "동", "동남"], "unlucky": ["서", "동북", "서북", "서남"],
        "unlucky_kinds": ["육살", "오귀", "절명", "화해"]},
    2: {"group": "서사택(西四宅)", "trigram_char": "坤", "element": "土",
        "lucky": ["서남", "서북", "서", "동북"], "unlucky": ["동", "동남", "남", "북"],
        "unlucky_kinds": ["절명", "오귀", "육살", "화해"]},
    3: {"group": "동사택(東四宅)", "trigram_char": "震", "element": "木",
        "lucky": ["동남", "북", "남", "동"], "unlucky": ["서남", "서", "동북", "서북"],
        "unlucky_kinds": ["오귀", "절명", "육살", "화해"]},
    4: {"group": "동사택(東四宅)", "trigram_char": "巽", "element": "木",
        "lucky": ["남", "동", "북", "동남"], "unlucky": ["서북", "서남", "서", "동북"],
        "unlucky_kinds": ["오귀", "절명", "육살", "화해"]},
    6: {"group": "서사택(西四宅)", "trigram_char": "乾", "element": "金",
        "lucky": ["서북", "서남", "동북", "서"], "unlucky": ["동남", "남", "동", "북"],
        "unlucky_kinds": ["오귀", "육살", "절명", "화해"]},
    7: {"group": "서사택(西四宅)", "trigram_char": "兌", "element": "金",
        "lucky": ["서", "동북", "서남", "서북"], "unlucky": ["동", "동남", "북", "남"],
        "unlucky_kinds": ["오귀", "절명", "육살", "화해"]},
    8: {"group": "서사택(西四宅)", "trigram_char": "艮", "element": "土",
        "lucky": ["동북", "서", "서북", "서남"], "unlucky": ["남", "북", "동남", "동"],
        "unlucky_kinds": ["오귀", "육살", "절명", "화해"]},
    9: {"group": "동사택(東四宅)", "trigram_char": "離", "element": "火",
        "lucky": ["동", "동남", "남", "북"], "unlucky": ["서", "서북", "서남", "동북"],
        "unlucky_kinds": ["오귀", "육살", "절명", "화해"]},
}
