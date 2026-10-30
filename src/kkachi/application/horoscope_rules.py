from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from kkachi.application.fortune_rules import level_fortune, make_brief
from kkachi.application.port.astro_port import AstroPort
from kkachi.domain.user import User

KST = ZoneInfo("Asia/Seoul")  # birth_dt는 KST 벽시계 — 1954~61 +8:30·옛 서머타임은 tzdata가 처리

# 열대 황도 30°씩 양자리부터. range는 표시용 — 판정은 황경(경계일은 천문력대로). 이름은 한글만(화면 폰트 서브셋)
SIGNS: list[dict] = [
    {"key": "aries", "korean": "양", "symbol": "♈", "range": "3.21~4.19", "element": "불"},
    {"key": "taurus", "korean": "황소", "symbol": "♉", "range": "4.20~5.20", "element": "흙"},
    {"key": "gemini", "korean": "쌍둥이", "symbol": "♊", "range": "5.21~6.21", "element": "공기"},
    {"key": "cancer", "korean": "게", "symbol": "♋", "range": "6.22~7.22", "element": "물"},
    {"key": "leo", "korean": "사자", "symbol": "♌", "range": "7.23~8.22", "element": "불"},
    {"key": "virgo", "korean": "처녀", "symbol": "♍", "range": "8.23~9.22", "element": "흙"},
    {"key": "libra", "korean": "천칭", "symbol": "♎", "range": "9.23~10.22", "element": "공기"},
    {"key": "scorpio", "korean": "전갈", "symbol": "♏", "range": "10.23~11.22", "element": "물"},
    {"key": "sagittarius", "korean": "사수", "symbol": "♐", "range": "11.23~12.21", "element": "불"},
    {"key": "capricorn", "korean": "염소", "symbol": "♑", "range": "12.22~1.19", "element": "흙"},
    {"key": "aquarius", "korean": "물병", "symbol": "♒", "range": "1.20~2.18", "element": "공기"},
    {"key": "pisces", "korean": "물고기", "symbol": "♓", "range": "2.19~3.20", "element": "물"},
]
_KEY_INDEX = {s["key"]: i for i, s in enumerate(SIGNS)}

# whole-sign 애스펙트 — 별자리 차이로만 본다(시간 미상·정오 추정에도 흔들리지 않게). 1·5·11은 보통
_ASPECT = {0: "합", 2: "육각", 10: "육각", 3: "사각", 9: "사각", 4: "삼각", 8: "삼각", 6: "충"}

# (오늘 천체, 출생 자리) → 애스펙트별 보정. 달은 하루 기분, 태양은 한 달 흐름. 합·삼각 길, 사각·충 흉, 육각 작은 길
_WEIGHT: dict[tuple[str, str], dict[str, int]] = {
    ("moon", "sun"): {"합": 10, "삼각": 12, "육각": 6, "사각": -10, "충": -8},
    ("moon", "moon"): {"합": 8, "삼각": 8, "육각": 4, "사각": -8, "충": -6},
    ("moon", "asc"): {"합": 6, "삼각": 6, "육각": 3, "사각": -6, "충": -4},
    ("sun", "sun"): {"합": 8, "삼각": 8, "육각": 4, "사각": -8, "충": -6},
    ("sun", "moon"): {"합": 4, "삼각": 6, "육각": 3, "사각": -6, "충": -4},
    ("sun", "asc"): {"합": 4, "삼각": 4, "육각": 2, "사각": -4, "충": -3},
}

# 이각(달−해) 상한 → 달 모양
_PHASE = [
    (12, "새달"), (78, "초승달"), (102, "상현달"), (168, "차오르는 달"), (192, "보름달"),
    (258, "이지러지는 달"), (282, "하현달"), (348, "그믐달"), (360, "새달"),
]
_NEW_MOON = (4, "새달이라 시작의 기운이 더해져요.", "작은 것이라도 오늘 시작하세요.", "")
_FULL_MOON = (-3, "보름달이라 감정이 크게 일렁이는 날이에요.", "산책으로 기운을 식히세요.", "감정이 앞선 말을 조심하세요.")

# (오늘 천체, 출생 자리, 애스펙트) → (headline, action, caution). 달 문장은 "오늘 달이", 태양 문장은 "요즘/이 시기"
# ("이번 달"은 moon/month가 섞여 못 읽음). 태양=내 별자리, 달=내 마음 별자리, 상승=내 첫인상 별자리. 한자 없음
_TEXT: dict[tuple[str, str, str], tuple[str, str, str]] = {
    ("moon", "sun", "합"): ("오늘 달이 내 별자리에 머물러요. 감정과 의지가 한 방향이에요.", "미뤄 둔 결심 하나를 오늘 꺼내 보세요.", ""),
    ("moon", "sun", "삼각"): ("달이 내 별자리와 잘 맞는 자리라 하루가 매끄럽게 흘러요.", "중요한 대화나 부탁은 오늘 하세요.", ""),
    ("moon", "sun", "육각"): ("달이 내 별자리에 살짝 힘을 보태는 날이에요.", "가벼운 연락 한 통이 좋은 기회로 이어져요.", ""),
    ("moon", "sun", "사각"): ("달이 내 별자리와 엇갈려 마음이 조급해지기 쉬워요.", "오늘은 결정 대신 정리만 하세요.", "서두른 말과 충동 구매를 조심하세요."),
    ("moon", "sun", "충"): ("달이 내 별자리 맞은편에 있어 남의 기분이 크게 보이는 날이에요.", "상대 말을 끝까지 듣고 답하세요.", "감정 싸움은 하루 미루세요."),
    ("moon", "moon", "합"): ("오늘 달이 내 마음 별자리를 지나요. 감수성이 또렷해요.", "혼자만의 시간을 30분 챙기세요.", ""),
    ("moon", "moon", "삼각"): ("마음이 편안히 가라앉는 날이에요.", "가까운 사람과 밥 한 끼 어때요?", ""),
    ("moon", "moon", "육각"): ("마음이 열려 사람이 편하게 느껴져요.", "안부 인사를 먼저 건네 보세요.", ""),
    ("moon", "moon", "사각"): ("기분이 오르내리기 쉬운 날이에요.", "몸을 움직이면 마음이 가벼워져요.", "작은 일에 서운해하지 마세요."),
    ("moon", "moon", "충"): ("마음이 둘로 갈리는 느낌이 들 수 있어요.", "결정은 하룻밤 자고 하세요.", "가까운 사람에게 날을 세우지 마세요."),
    ("moon", "asc", "합"): ("달이 내 첫인상 별자리를 지나 존재감이 커지는 날이에요.", "사람 앞에 서는 일을 오늘 잡으세요.", ""),
    ("moon", "asc", "삼각"): ("나답게 보이는 날이에요. 첫 만남이 순조로워요.", "새 사람을 만나는 자리에 나가 보세요.", ""),
    ("moon", "asc", "육각"): ("표정이 부드러워 보이는 날이에요.", "부탁할 일은 얼굴 보고 하세요.", ""),
    ("moon", "asc", "사각"): ("말과 마음이 따로 놀기 쉬워요.", "중요한 메시지는 한 번 더 읽고 보내세요.", "오해 살 농담은 넣어 두세요."),
    ("moon", "asc", "충"): ("상대 마음이 더 크게 보이는 날이에요. 내 속도를 지키세요.", "약속은 짧고 가볍게 잡으세요.", "끌려다니지 않게 거절할 말을 준비하세요."),
    ("sun", "sun", "합"): ("태양이 내 별자리에 돌아온 생일 무렵이에요. 한 해 기운이 새로 차요.", "올해 하고 싶은 일 하나를 적어 두세요.", ""),
    ("sun", "sun", "삼각"): ("태양이 내 별자리와 같은 원소를 지나 힘이 붙는 시기예요.", "크게 벌이기 좋은 때예요. 시작하세요.", ""),
    ("sun", "sun", "육각"): ("태양이 내 별자리를 거드는 시기예요.", "배움과 공부에 시간을 써 보세요.", ""),
    ("sun", "sun", "사각"): ("태양이 내 별자리와 긴장하는 시기라 쉽게 지쳐요.", "일정을 줄이고 잠을 챙기세요.", "무리한 약속을 늘리지 마세요."),
    ("sun", "sun", "충"): ("태양이 내 별자리 맞은편을 지나 관계가 화두인 시기예요.", "상대 입장에서 한 번 생각해 보세요.", "고집은 반만 부리세요."),
    ("sun", "moon", "합"): ("태양이 내 마음 별자리를 비추는 시기예요. 속마음이 밝아져요.", "하고 싶던 말을 꺼내 보세요.", ""),
    ("sun", "moon", "삼각"): ("마음과 할 일이 잘 맞물리는 시기예요.", "집과 가족 일을 챙기기 좋아요.", ""),
    ("sun", "moon", "육각"): ("마음이 가볍고 집중이 잘 되는 시기예요.", "작은 습관 하나를 들여 보세요.", ""),
    ("sun", "moon", "사각"): ("바깥일이 마음을 눌러 피곤한 시기예요.", "주말엔 일정을 비워 두세요.", "감정 소모가 큰 일은 줄이세요."),
    ("sun", "moon", "충"): ("해야 할 일과 하고 싶은 마음이 엇갈리는 시기예요.", "하루에 하나는 나를 위해 쓰세요.", "억지로 참다 터뜨리지 마세요."),
    ("sun", "asc", "합"): ("태양이 내 첫인상 별자리를 지나 눈에 띄는 시기예요.", "발표·면접·소개 자리를 잡아 보세요.", ""),
    ("sun", "asc", "삼각"): ("자신감 있게 보이는 시기예요.", "새 인연을 만들기 좋아요.", ""),
    ("sun", "asc", "육각"): ("말이 잘 통하는 시기예요.", "협업 제안을 먼저 해 보세요.", ""),
    ("sun", "asc", "사각"): ("의욕은 큰데 몸이 안 따라 주는 시기예요.", "계획을 반으로 줄여 보세요.", "체력 과신은 금물이에요."),
    ("sun", "asc", "충"): ("상대가 주도권을 잡기 쉬운 시기예요.", "내 요구 사항을 먼저 적어 두세요.", "분위기에 밀려 승낙하지 마세요."),
}

# 요인이 하나도 없는 날 — 날짜·별자리 순번으로 돌려 매일 다르게
_PLAIN: list[tuple[str, str]] = [
    ("달이 멀리 있어 조용한 하루예요.", "밀린 정리를 하기 좋아요."),
    ("튀는 기운 없이 잔잔해요.", "끼니와 잠을 잘 챙기세요."),
    ("큰 흐름이 없는 날이에요.", "작은 약속을 지키는 게 운이 돼요."),
    ("눈에 띄는 일은 없어도 내실을 쌓기 좋은 날이에요.", "책 한 쪽, 산책 한 바퀴면 충분해요."),
]

# 행운의 아이템 — 내 별자리 원소별, 날짜·별자리 순번으로 회전
_LUCKY: dict[str, list[str]] = {
    "불": ["빨간 소품", "따뜻한 차", "향초", "노란 과일", "운동화", "햇빛 산책"],
    "흙": ["초록 식물", "흙색 머그", "견과류", "나무 소품", "수첩", "편한 신발"],
    "공기": ["책 한 권", "파란 펜", "바람 쐬기", "가벼운 스카프", "음악 한 곡", "창문 열기"],
    "물": ["물 한 컵 더", "푸른 소품", "따뜻한 목욕", "바다 사진", "조용한 음악", "일찍 자기"],
}


def sign_of(lon: float) -> str:
    """황경(도) → 별자리 key(양 aries ~ 물고기 pisces)."""
    return SIGNS[int(lon % 360 // 30)]["key"]


def aspect(transit: str, natal: str) -> str | None:
    """whole-sign 애스펙트 — 합·육각·사각·삼각·충, 없으면 None(보통)."""
    return _ASPECT.get((_KEY_INDEX[natal] - _KEY_INDEX[transit]) % 12)


def moon_phase(elong: float) -> str:
    return next(name for upper, name in _PHASE if elong < upper)


def compute_horoscope(chart: dict, sky: dict, today: date, name: str = "") -> dict:
    """chart {sun, moon|None, asc|None}(key) × sky {sun, moon(key), moon_phase} → base 50 + 요인표.
    headline·action·caution은 일진과 같은 make_brief(가장 큰 요인, 동점이면 흉 우선), 레벨도 같은 70/40.
    요인이 하나도 없는 날은 보통 문장을 날짜·별자리 순번으로 돌린다."""
    factors: list[tuple[int, str, str, str]] = []
    for transit in ("moon", "sun"):
        for point in ("sun", "moon", "asc"):
            natal = chart.get(point)
            asp = aspect(sky[transit], natal) if natal else None
            if asp:
                factors.append((_WEIGHT[(transit, point)][asp], *_TEXT[(transit, point, asp)]))
    if sky["moon_phase"] == "새달":
        factors.append(_NEW_MOON)
    elif sky["moon_phase"] == "보름달":
        factors.append(_FULL_MOON)
    idx = _KEY_INDEX[chart["sun"]]
    turn = today.toordinal() + idx
    if factors:
        headline, action, caution = make_brief(factors, name, son_nal=False)
    else:
        headline, action = _PLAIN[turn % len(_PLAIN)]
        headline, caution = (f"{name}님, {headline}" if name else headline), ""
    items = _LUCKY[SIGNS[idx]["element"]]
    score = max(0, min(100, 50 + sum(f[0] for f in factors)))
    return {
        "relation": aspect(sky["moon"], chart["sun"]) or "보통",
        "score": score,
        "level": level_fortune(score),
        "headline": headline,
        "action": action,
        "caution": caution,
        "lucky_item": items[turn % len(items)],
    }


def build_sky(astro: AstroPort, today: date) -> dict:
    """오늘 정오 KST의 하늘 — {sun, moon, moon_phase} + 12별자리 일반판 signs(출생 태양만 든 차트)."""
    sky = _get_sky(astro, today)
    return {**sky, "signs": [{**s, **compute_horoscope({"sun": s["key"]}, sky, today)} for s in SIGNS]}


def build_chart(astro: AstroPort, user: User) -> dict:
    """출생 차트(key) {sun, moon, asc|None, uncertain[]} — KST 벽시계 → UTC. 시간 미상이면 상승점 없음,
    정오 저장값으로 태양·달을 보고 그날 0시~24시 사이 별자리가 바뀌는 천체는 uncertain에 적는다."""
    birth = user.birth_dt.replace(tzinfo=KST)
    p = astro.positions(birth.astimezone(UTC), None if user.hour_unknown else user.city)
    uncertain: list[str] = []
    if user.hour_unknown:
        day0 = datetime.combine(user.birth_dt.date(), time(0), tzinfo=KST)
        first = astro.positions(day0.astimezone(UTC))
        last = astro.positions((day0 + timedelta(days=1)).astimezone(UTC))
        uncertain = [b for b in ("sun", "moon") if sign_of(first[b]) != sign_of(last[b])]
    return {
        "sun": sign_of(p["sun"]),
        "moon": sign_of(p["moon"]),
        "asc": sign_of(p["asc"]) if "asc" in p else None,
        "uncertain": uncertain,
    }


def build_my_horoscope(astro: AstroPort, user: User, today: date) -> dict:
    """홈 me.horoscope — {chart, score, level, headline("{name}님, …"), action, caution, lucky_item}."""
    chart = build_chart(astro, user)
    return {"chart": chart, **compute_horoscope(chart, _get_sky(astro, today), today, user.name)}


def _get_sky(astro: AstroPort, today: date) -> dict:
    """오늘 정오 KST — {sun, moon(key), moon_phase}."""
    p = astro.positions(datetime.combine(today, time(12), tzinfo=KST).astimezone(UTC))
    return {"sun": sign_of(p["sun"]), "moon": sign_of(p["moon"]), "moon_phase": moon_phase((p["moon"] - p["sun"]) % 360)}
