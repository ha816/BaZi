from kkachi.application.interpreter.advice import YONGSHIN_FORTUNE
from kkachi.domain.ganji import Oheng
from kkachi.domain.interpretation import InterpretBlock, InterpretTip
from kkachi.domain.natal import NatalInfo


class FengShuiInterpreter:
    """팔택풍수(八宅風水) 기반 풍수지리 해석기.

    생년·성별 → 쿠아 넘버(1~9) → 동/서사택 그룹 → 행운·흉한 방위 + 인테리어 개운법.
    """

    def __call__(self, natal: NatalInfo, birth_year: int, is_male: bool) -> list[InterpretBlock]:
        if not birth_year:
            return []

        kua = _calc_kua(birth_year, is_male)
        info = _KUA_DATA[kua]
        yongshin = natal.yongshin
        fortune = YONGSHIN_FORTUNE.get(yongshin, {})
        missing = [o for o, c in natal.element_stats.items() if c == 0]

        kua_block = InterpretBlock(
            category="쿠아 넘버",
            description=(
                f"쿠아 넘버 {kua}번 — {info['trigram']} / {info['group']}에 속해요. "
                f"최고 길방은 {info['lucky'][0][0]}({info['lucky'][0][1].split(' ')[0]})이에요."
            ),
            tips=[
                InterpretTip(label="오행", text=f"{info['element']}({info['element_kor']})의 기운"),
                InterpretTip(label="그룹", text=info["group"]),
            ],
        )

        lucky_block = InterpretBlock(
            category="행운의 방위",
            description="책상·침대 머리를 아래 방향으로 맞추면 기운을 높일 수 있어요.",
            tips=[
                InterpretTip(label=direction, text=fortune_name)
                for direction, fortune_name in info["lucky"]
            ],
        )

        avoid_block = InterpretBlock(
            category="피해야 할 방위",
            description=(
                f"{' · '.join(info['unlucky'])} 방향은 흉방이에요. "
                "출입문·침대·책상이 이쪽을 향하지 않도록 주의하세요."
            ),
        )

        interior_tips = []
        if fortune.get("색상"):
            interior_tips.append(InterpretTip(label="행운 색상", text=fortune["색상"]))
        if fortune.get("방향"):
            interior_tips.append(InterpretTip(label="용신 방향", text=fortune["방향"]))
        for o in missing:
            item = _ELEMENT_ITEM.get(o)
            if item:
                interior_tips.append(InterpretTip(label=f"{o.meaning}({o.name}) 보완", text=item))

        interior_block = InterpretBlock(
            category="인테리어 개운법",
            description=f"용신 {yongshin.meaning}({yongshin.name})의 기운을 공간에 불어넣는 배치예요.",
            tips=interior_tips,
        )

        return [kua_block, lucky_block, avoid_block, interior_block]


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

_KUA_DATA: dict[int, dict] = {
    1: {
        "group": "동사택(東四宅)",
        "trigram": "坎(감)",
        "element": "水",
        "element_kor": "수",
        "lucky": [
            ("북", "생기(生氣) — 최고 길방, 재물·성취"),
            ("남", "연년(延年) — 건강·장수·인연"),
            ("동", "천의(天醫) — 귀인·치유·회복"),
            ("동남", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["서", "동북", "서북", "서남"],
    },
    2: {
        "group": "서사택(西四宅)",
        "trigram": "坤(곤)",
        "element": "土",
        "element_kor": "토",
        "lucky": [
            ("서남", "생기(生氣) — 최고 길방, 재물·성취"),
            ("서북", "연년(延年) — 건강·장수·인연"),
            ("서", "천의(天醫) — 귀인·치유·회복"),
            ("동북", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["동", "동남", "남", "북"],
    },
    3: {
        "group": "동사택(東四宅)",
        "trigram": "震(진)",
        "element": "木",
        "element_kor": "목",
        "lucky": [
            ("동남", "생기(生氣) — 최고 길방, 재물·성취"),
            ("북", "연년(延年) — 건강·장수·인연"),
            ("남", "천의(天醫) — 귀인·치유·회복"),
            ("동", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["서남", "서", "동북", "서북"],
    },
    4: {
        "group": "동사택(東四宅)",
        "trigram": "巽(손)",
        "element": "木",
        "element_kor": "목",
        "lucky": [
            ("남", "생기(生氣) — 최고 길방, 재물·성취"),
            ("동", "연년(延年) — 건강·장수·인연"),
            ("북", "천의(天醫) — 귀인·치유·회복"),
            ("동남", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["서북", "서남", "서", "동북"],
    },
    6: {
        "group": "서사택(西四宅)",
        "trigram": "乾(건)",
        "element": "金",
        "element_kor": "금",
        "lucky": [
            ("서북", "생기(生氣) — 최고 길방, 재물·성취"),
            ("서남", "연년(延年) — 건강·장수·인연"),
            ("동북", "천의(天醫) — 귀인·치유·회복"),
            ("서", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["동남", "남", "동", "북"],
    },
    7: {
        "group": "서사택(西四宅)",
        "trigram": "兌(태)",
        "element": "金",
        "element_kor": "금",
        "lucky": [
            ("서", "생기(生氣) — 최고 길방, 재물·성취"),
            ("동북", "연년(延年) — 건강·장수·인연"),
            ("서남", "천의(天醫) — 귀인·치유·회복"),
            ("서북", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["동", "동남", "북", "남"],
    },
    8: {
        "group": "서사택(西四宅)",
        "trigram": "艮(간)",
        "element": "土",
        "element_kor": "토",
        "lucky": [
            ("동북", "생기(生氣) — 최고 길방, 재물·성취"),
            ("서", "연년(延年) — 건강·장수·인연"),
            ("서북", "천의(天醫) — 귀인·치유·회복"),
            ("서남", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["남", "북", "동남", "동"],
    },
    9: {
        "group": "동사택(東四宅)",
        "trigram": "離(리)",
        "element": "火",
        "element_kor": "화",
        "lucky": [
            ("동", "생기(生氣) — 최고 길방, 재물·성취"),
            ("동남", "연년(延年) — 건강·장수·인연"),
            ("남", "천의(天醫) — 귀인·치유·회복"),
            ("북", "복위(伏位) — 안정·꾸준한 발전"),
        ],
        "unlucky": ["서", "서북", "서남", "동북"],
    },
}
