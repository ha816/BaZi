import re
from datetime import date

from lunardate import LunarDate
from sajupy import calculate_saju as _sajupy_calculate

from kkachi.application.util.sipsin_meta import sipsin_korean
from kkachi.application.util.util import josa, year_to_ganji
from kkachi.domain.fortune import Fortune
from kkachi.domain.ganji import OHENG_GUIDE, Branch, Oheng, Pillar, Sipsin, StemBranch
from kkachi.domain.natal import NatalInfo, PostnatalInfo

# 24절기 — (월, 일): (절기명, 오행, 특별 팁)
# 날짜는 연도별로 ±1일 차이가 있으나 MVP에서는 대표 날짜 사용
SOLAR_TERMS: dict[tuple[int, int], tuple[str, Oheng, str]] = {
    (1, 6):  ("소한(小寒)", Oheng.水, "겨울 추위의 절정. 체력 관리를 우선순위에 두세요."),
    (1, 20): ("대한(大寒)", Oheng.水, "가장 추운 날. 차분히 봄을 준비할 에너지를 모을 때입니다."),
    (2, 4):  ("입춘(立春)", Oheng.木, "봄의 기운이 시작됩니다. 새로운 시작과 도전에 길한 날입니다."),
    (2, 19): ("우수(雨水)", Oheng.木, "봄비로 만물이 소생합니다. 막혔던 일이 풀리기 시작하는 기운입니다."),
    (3, 6):  ("경칩(驚蟄)", Oheng.木, "겨울잠에서 깨어나는 날. 잠재된 에너지를 깨울 절호의 기회입니다."),
    (3, 20): ("춘분(春分)", Oheng.木, "낮과 밤의 길이가 같아집니다. 균형을 되찾기 좋은 날입니다."),
    (4, 5):  ("청명(淸明)", Oheng.木, "하늘이 맑고 밝아지는 날. 새 계획을 실행에 옮기기 좋은 기운입니다."),
    (4, 20): ("곡우(穀雨)", Oheng.木, "봄비로 곡식이 자라는 시기. 꾸준한 노력이 결실을 맺기 시작합니다."),
    (5, 6):  ("입하(立夏)", Oheng.火, "여름이 시작됩니다. 열정과 활력이 넘치는 기운이 함께합니다."),
    (5, 21): ("소만(小滿)", Oheng.火, "만물이 가득 차는 시기. 활발한 활동으로 에너지를 발산하세요."),
    (6, 6):  ("망종(芒種)", Oheng.火, "씨앗을 뿌리는 절기. 지금의 노력이 나중에 큰 열매가 됩니다."),
    (6, 21): ("하지(夏至)", Oheng.火, "일 년 중 낮이 가장 긴 날. 강한 火 기운이 최고조입니다."),
    (7, 7):  ("소서(小暑)", Oheng.火, "더위가 시작됩니다. 무리하지 말고 체력을 비축하세요."),
    (7, 23): ("대서(大暑)", Oheng.火, "일 년 중 가장 더운 시기. 여유를 갖는 것이 지혜입니다."),
    (8, 7):  ("입추(立秋)", Oheng.金, "가을이 시작됩니다. 성과를 정리하고 수확을 준비할 시기입니다."),
    (8, 23): ("처서(處暑)", Oheng.金, "더위가 물러갑니다. 활기차게 재도약할 기운이 모입니다."),
    (9, 8):  ("백로(白露)", Oheng.金, "이슬이 맺히는 청명한 가을. 중요한 결정을 내리기 좋습니다."),
    (9, 23): ("추분(秋分)", Oheng.金, "낮과 밤이 다시 같아집니다. 균형 잡힌 시각으로 상황을 돌아보세요."),
    (10, 8): ("한로(寒露)", Oheng.金, "찬 이슬이 내리는 시기. 주변 관계를 돌아보고 정리할 좋은 때입니다."),
    (10, 23):("상강(霜降)", Oheng.金, "서리가 내리기 시작합니다. 한 해의 성과를 점검하는 날로 삼으세요."),
    (11, 7): ("입동(立冬)", Oheng.水, "겨울이 시작됩니다. 에너지를 비축하고 내면을 돌아볼 시기입니다."),
    (11, 22):("소설(小雪)", Oheng.水, "첫눈이 내리는 시기. 차분히 마음을 정돈하고 내년을 계획하세요."),
    (12, 7): ("대설(大雪)", Oheng.水, "눈이 많이 내리는 시기. 조용히 실력을 다지는 내실의 시간입니다."),
    (12, 22):("동지(冬至)", Oheng.水, "밤이 가장 긴 날. 동지팥죽으로 나쁜 기운을 쫓고 새 에너지를 맞이하세요."),
}


def _get_solar_term(today: date) -> tuple[str, Oheng, str] | None:
    return SOLAR_TERMS.get((today.month, today.day))


def _is_son_eomneun_nal(today: date) -> bool:
    """음력 날짜 끝자리가 9 또는 0인 날 (손없는 날)."""
    lunar_day = LunarDate.fromSolarDate(today.year, today.month, today.day).day
    return lunar_day % 10 in (9, 0)


GOOD_SIPSIN = {Sipsin.食神, Sipsin.正財, Sipsin.正官, Sipsin.正印}
BAD_SIPSIN = {Sipsin.偏官, Sipsin.劫財}

BRANCH_COMBINES = {
    Branch.子: Branch.丑, Branch.丑: Branch.子,
    Branch.寅: Branch.亥, Branch.亥: Branch.寅,
    Branch.卯: Branch.戌, Branch.戌: Branch.卯,
    Branch.辰: Branch.酉, Branch.酉: Branch.辰,
    Branch.巳: Branch.申, Branch.申: Branch.巳,
    Branch.午: Branch.未, Branch.未: Branch.午,
}

BRANCH_CLASHES = {
    Branch.子: Branch.午, Branch.午: Branch.子,
    Branch.丑: Branch.未, Branch.未: Branch.丑,
    Branch.寅: Branch.申, Branch.申: Branch.寅,
    Branch.卯: Branch.酉, Branch.酉: Branch.卯,
    Branch.辰: Branch.戌, Branch.戌: Branch.辰,
    Branch.巳: Branch.亥, Branch.亥: Branch.巳,
}


def _level_fortune(score: int) -> str:
    if score >= 70:
        return "좋은 날"
    if score >= 40:
        return "평범한 날"
    return "주의가 필요한 날"


def _level_domain(score: int) -> str:
    if score >= 70:
        return "좋음"
    if score >= 40:
        return "보통"
    return "주의"


def _get_day_stembrach(today: date) -> StemBranch:
    result = _sajupy_calculate(
        year=today.year, month=today.month, day=today.day,
        hour=12, minute=0, city="Seoul",
    )
    return StemBranch.from_text(result["day_pillar"])


_GOOD_SIPSIN_ACTION: dict[Sipsin, str] = {
    Sipsin.食神: "아이디어를 말로 꺼내세요. 표현이 통하는 날이에요.",
    Sipsin.正財: "지출을 정리하고 저축 계획을 손보세요.",
    Sipsin.正官: "보고·계약처럼 공식적인 일을 오늘 처리하세요.",
    Sipsin.正印: "공부·문서·배움에 시간을 쓰세요.",
}

_BAD_SIPSIN_CAUTION: dict[Sipsin, str] = {
    Sipsin.偏官: "윗사람·규칙과 부딪히기 쉬워요. 한 박자 늦게 반응하세요.",
    Sipsin.劫財: "지갑이 새기 쉬운 날이에요. 충동 지출을 조심하세요.",
}


def _domain_short(sipsin: Sipsin) -> str:
    """'재능·표현·식복' → '재능·표현' (앞 두 단어)."""
    return "·".join(sipsin.domain.split("·")[:2])


def _condition_label(condition: str) -> str:
    """'대체로 맑음 21°C' → '대체로 맑음'."""
    return re.sub(r"\s*-?\d+(\.\d+)?°C$", "", condition).strip() or "오늘 날씨"


def _make_brief(factors: list[tuple[int, str, str, str]], name: str, son_nal: bool) -> tuple[str, str, str]:
    """판정 요인 목록 → (headline, action, caution). 가장 큰 요인이 헤드라인, 동점이면 흉 우선.
    흉이 헤드라인이면 action도 그 요인의 것을 써서 "계약하세요/계약 미루세요" 같은 모순을 막는다."""
    prefix = f"{name}님, " if name else ""
    if not factors:
        action = "손없는 날이니 이사·계약·개업 같은 일을 하기 좋아요." if son_nal else "루틴을 지키고 미뤄둔 작은 일 하나를 끝내세요."
        return prefix + "오늘은 튀는 기운 없이 잔잔한 날이에요.", action, ""

    top = max(factors, key=lambda f: (abs(f[0]), f[0] < 0))
    positives = [f for f in factors if f[0] > 0 and f[2]]
    negatives = [f for f in factors if f[0] < 0 and f[3]]

    if top[0] < 0 and top[2]:
        action = top[2]
    elif positives:
        action = max(positives, key=lambda f: f[0])[2]
    elif son_nal and not negatives:
        action = "손없는 날이니 이사·계약·개업 같은 일을 하기 좋아요."
    else:
        action = next((f[2] for f in factors if f[2]), "예정된 일만 차분히 처리하세요.")
    caution = min(negatives, key=lambda f: f[0])[3] if negatives else ""
    return prefix + top[1], action, caution


def compute_fortune(
    natal: NatalInfo,
    today: date,
    weather: dict | None = None,
    postnatal: PostnatalInfo | None = None,
    name: str = "",
) -> Fortune:
    day_sb = _get_day_stembrach(today)
    day_stem = day_sb.stem
    day_branch = day_sb.branch
    day_element: Oheng = day_stem.element

    my_branch = natal.saju[Pillar.日柱].branch
    my_day_stem = natal.saju.stem_of_day_pillar

    # 오늘 일진의 십신 (내 일간 기준)
    today_sipsin_stem = Sipsin.of(my_day_stem, day_stem)

    branch_combine = BRANCH_COMBINES.get(my_branch) == day_branch
    branch_clash = BRANCH_CLASHES.get(my_branch) == day_branch

    raw = 50
    reasons = []
    factors: list[tuple[int, str, str, str]] = []  # (delta, headline, action, caution)
    yong = natal.yongshin
    me = natal.my_main_element

    # 용신 판정
    if day_element == yong:
        raw += 25
        reasons.append(f"오늘 일간({day_stem.name})이 용신({yong.name}) 오행")
        factors.append((25,
            f"오늘은 용신 {yong.name}({yong.meaning}) 기운이 그대로 들어오는 날이에요.",
            "미뤄둔 시작이 있다면 오늘 첫걸음을 떼세요.", ""))
    elif day_element.generates == yong:
        raw += 15
        reasons.append("오늘 일간이 용신을 生함")
        factors.append((15,
            f"오늘 일진이 용신 {yong.name}({yong.meaning}) 기운을 살려주는 날이에요.",
            f"{OHENG_GUIDE[yong]['color'].split('·')[0]} 계열 소품 하나를 곁에 두세요.", ""))
    elif day_element.overcomes == yong or yong.overcomes == day_element:
        raw -= 15
        reasons.append("오늘 일간이 용신을 剋함")
        factors.append((-15,
            f"오늘 일진이 용신 {yong.name}({yong.meaning}) 기운을 누르는 날이에요.",
            "오늘은 새 일보다 마무리와 정리에 집중하세요.",
            "큰 결정과 새 계약은 하루 미루세요."))

    # 일지 합/충
    if branch_combine:
        raw += 15
        reasons.append("오늘 일지와 내 일지가 육합(六合)")
        factors.append((15,
            f"오늘 일진 {day_branch.korean}({day_branch.name}){josa(day_branch.korean, '이', '가')} "
            f"내 일지 {my_branch.korean}({my_branch.name}){josa(my_branch.korean, '과', '와')} 육합(六合)하는 날이에요.",
            "먼저 연락하세요. 사람이 힘이 되는 날이에요.", ""))
    if branch_clash:
        raw -= 15
        reasons.append("오늘 일지와 내 일지가 충(衝)")
        factors.append((-15,
            f"오늘 일진 {day_branch.korean}({day_branch.name}){josa(day_branch.korean, '이', '가')} "
            f"내 일지 {my_branch.korean}({my_branch.name}){josa(my_branch.korean, '과', '와')} 충(衝)하는 날이에요.",
            "예정된 일만 차분히 처리하세요.",
            "이동·계약·다툼은 피하고, 약속은 한 번 더 확인하세요."))

    # 오행 생조
    if day_element.generates == me:
        raw += 10
        reasons.append("오늘 오행이 내 주 오행을 生함")
        factors.append((10,
            f"오늘 {day_element.meaning} 기운이 내 {me.meaning} 기운을 밀어주는 날이에요.",
            "체력이 붙는 날이니 몸 쓰는 일을 앞에 두세요.", ""))

    # 십신
    if today_sipsin_stem in GOOD_SIPSIN:
        raw += 8
        reasons.append(f"일간 십신 {today_sipsin_stem.name} 길신")
        factors.append((8,
            f"오늘 일진이 {sipsin_korean(today_sipsin_stem)}({today_sipsin_stem.name}) 자리에 들어와 "
            f"{_domain_short(today_sipsin_stem)} 기운이 살아요.",
            _GOOD_SIPSIN_ACTION[today_sipsin_stem], ""))
    elif today_sipsin_stem in BAD_SIPSIN:
        raw -= 8
        reasons.append(f"일간 십신 {today_sipsin_stem.name} 흉신")
        factors.append((-8,
            f"오늘 일진이 {sipsin_korean(today_sipsin_stem)}({today_sipsin_stem.name}) 자리라 "
            f"{_domain_short(today_sipsin_stem)} 쪽에 마찰이 생기기 쉬운 날이에요.",
            "", _BAD_SIPSIN_CAUTION[today_sipsin_stem]))

    # 날씨 오행 보정
    if weather:
        weather_el = Oheng[weather["element"]]
        cond = _condition_label(weather.get("condition", ""))
        if weather_el == yong:
            raw += 10
            reasons.append(f"날씨({weather['condition']})가 용신 오행과 일치")
            factors.append((10,
                f"날씨({cond})까지 용신 {yong.name}({yong.meaning}) 기운과 맞는 날이에요.",
                "밖으로 나가 오늘 날씨의 기운을 직접 받으세요.", ""))
        elif weather_el.generates == yong:
            raw += 5
            reasons.append("날씨가 용신을 生함")
            factors.append((5,
                "오늘 날씨가 용신 기운을 북돋아 주는 날이에요.",
                "잠깐이라도 바깥 공기를 쐬면 기운이 돌아요.", ""))
        elif weather_el.overcomes == yong:
            raw -= 8
            reasons.append(f"날씨({weather['condition']})가 용신을 剋함")
            factors.append((-8,
                f"날씨({cond})가 용신 {yong.name}({yong.meaning}) 기운을 누르는 날이에요.",
                "", "날씨 기운이 용신을 누르니 실내에서 컨디션을 지키세요."))

    total_score = max(0, min(100, raw))

    # 영역별
    domain_scores = _compute_domain_scores(
        natal, day_element, branch_combine, branch_clash, today_sipsin_stem, total_score
    )

    description = _make_description(total_score, day_element, natal, branch_combine, branch_clash, reasons)
    tips = _make_tips(total_score, branch_combine, branch_clash, natal.yongshin, day_element, weather)

    solar_term_info = _get_solar_term(today)
    solar_term_name: str | None = None
    if solar_term_info:
        st_name, st_element, st_tip = solar_term_info
        solar_term_name = st_name
        tips = [f"오늘은 {st_name}입니다. {st_tip}", *tips][:3]

    son_nal = _is_son_eomneun_nal(today)
    headline, action, caution = _make_brief(factors, name, son_nal)

    daeun_ganji = postnatal.current_daeun.ganji if postnatal and postnatal.current_daeun else None
    seun_ganji = year_to_ganji(today.year) if postnatal is None else year_to_ganji(postnatal.year)
    wol_ganji = postnatal.upcoming_months[0]["ganji"] if postnatal and postnatal.upcoming_months else ""
    yongshin_in_daeun = postnatal.yongshin_in_daeun if postnatal else False
    yongshin_in_seun = postnatal.yongshin_in_seun if postnatal else False
    yongshin_in_wol = postnatal.upcoming_months[0].get("matches_yongshin", False) if postnatal and postnatal.upcoming_months else False
    yongshin_in_il = day_element == natal.yongshin

    return Fortune(
        date=today.isoformat(),
        day_pillar=str(day_sb),
        day_element=day_element.name,
        total_score=total_score,
        level=_level_fortune(total_score),
        domain_scores=domain_scores,
        description=description,
        tips=tips,
        weather=weather,
        solar_term=solar_term_name,
        yongshin=natal.yongshin.name,
        son_eomneun_nal=son_nal,
        daeun_ganji=daeun_ganji,
        seun_ganji=seun_ganji,
        wol_ganji=wol_ganji,
        yongshin_in_daeun=yongshin_in_daeun,
        yongshin_in_seun=yongshin_in_seun,
        yongshin_in_wol=yongshin_in_wol,
        yongshin_in_il=yongshin_in_il,
        headline=headline,
        action=action,
        caution=caution,
    )


def _compute_domain_scores(
    natal: NatalInfo,
    day_element: Oheng,
    branch_combine: bool,
    branch_clash: bool,
    sipsin_stem: Sipsin,
    base: int,
) -> dict[str, dict]:
    # 재물
    wealth = base
    wealth_reasons = []
    if sipsin_stem in (Sipsin.正財, Sipsin.偏財):
        wealth += 15
        wealth_reasons.append("오늘 십신이 재성(財星)")
    if branch_combine:
        wealth += 5
        wealth_reasons.append("일지 합으로 재물 흐름 양호")
    if branch_clash:
        wealth -= 10
        wealth_reasons.append("일지 충으로 재물 변동 주의")
    wealth = max(0, min(100, wealth))

    # 연애
    love = base
    love_reasons = []
    if sipsin_stem == Sipsin.正財:
        love += 10
        love_reasons.append("정재 — 안정적 이성 인연")
    elif sipsin_stem == Sipsin.偏財:
        love += 8
        love_reasons.append("편재 — 활발한 이성 교류")
    if branch_combine:
        love += 15
        love_reasons.append("일지 육합으로 감정 교감 깊음")
    if branch_clash:
        love -= 15
        love_reasons.append("일지 충으로 감정 마찰 주의")
    love = max(0, min(100, love))

    # 직업
    career = base
    career_reasons = []
    if sipsin_stem in (Sipsin.正官, Sipsin.偏官):
        career += 12
        career_reasons.append("관성(官星)으로 사회 활동 활발")
    if day_element == natal.yongshin:
        career += 8
        career_reasons.append("용신 오행으로 능력 발휘")
    if branch_clash:
        career -= 8
        career_reasons.append("충으로 직장 내 긴장감")
    career = max(0, min(100, career))

    # 건강
    health = base
    health_reasons = []
    if branch_clash:
        health -= 15
        health_reasons.append("일지 충 — 체력 소모 주의")
    if sipsin_stem == Sipsin.偏官:
        health -= 8
        health_reasons.append("편관 — 스트레스 주의")
    if day_element.generates == natal.my_main_element:
        health += 8
        health_reasons.append("오행 상생으로 활력 충전")
    health = max(0, min(100, health))

    return {
        "재물": {"score": wealth, "level": _level_domain(wealth), "reason": "·".join(wealth_reasons) or "기본 오행 관계"},
        "연애": {"score": love, "level": _level_domain(love), "reason": "·".join(love_reasons) or "기본 오행 관계"},
        "직업": {"score": career, "level": _level_domain(career), "reason": "·".join(career_reasons) or "기본 오행 관계"},
        "건강": {"score": health, "level": _level_domain(health), "reason": "·".join(health_reasons) or "기본 오행 관계"},
    }


def _make_description(
    score: int,
    day_element: Oheng,
    natal: NatalInfo,
    branch_combine: bool,
    branch_clash: bool,
    reasons: list[str],
) -> str:
    parts = []
    el_name = day_element.meaning

    if score >= 70:
        parts.append(f"오늘은 {el_name}의 기운이 감도는 좋은 날입니다.")
        if day_element == natal.yongshin:
            parts.append(f"용신인 {natal.yongshin.name} 오행이 강하게 들어와 모든 일이 순조롭습니다.")
        if branch_combine:
            parts.append("일지가 육합을 이루어 대인 관계와 감정적 교감이 깊어지는 날입니다.")
    elif score >= 40:
        parts.append(f"오늘은 무난한 {el_name}의 기운으로 평범하게 흘러가는 날입니다.")
        if reasons:
            parts.append("특별한 길흉보다는 꾸준함이 힘이 되는 하루입니다.")
    else:
        parts.append(f"오늘은 {el_name}의 기운이 내 사주와 다소 충돌하는 날입니다.")
        if branch_clash:
            parts.append("일지 충(衝)이 발생해 예기치 못한 변수에 주의가 필요합니다.")
        parts.append("무리한 계획보다는 조용히 내실을 다지는 날로 삼으세요.")

    return " ".join(parts)


# 점수 구간 × 날씨 오행 → 맞춤 팁 (20가지 조합)
_WEATHER_TIPS: dict[tuple[str, str], str] = {
    ("high",   "火"): "맑고 활기찬 기운 속에 자신감 있게 움직이세요. 오늘은 먼저 연락하기 좋은 날입니다.",
    ("high",   "土"): "흐린 하늘이지만 내 기운은 좋습니다. 조용히 집중하면 큰 성과를 낼 수 있어요.",
    ("high",   "金"): "서늘한 기운이 머리를 맑게 합니다. 중요한 판단이나 협상에 적합한 날입니다.",
    ("high",   "水"): "비가 내려도 기운은 충만합니다. 창의적인 아이디어가 샘솟는 하루가 될 거예요.",
    ("high",   "木"): "바람이 불어도 든든한 날. 새로운 시작이나 도전을 결심하기 좋은 타이밍입니다.",
    ("mid",    "火"): "날씨도 사주도 평범한 날. 무리하지 않고 루틴에 충실하면 충분합니다.",
    ("mid",    "土"): "흐린 날씨에 에너지가 분산될 수 있어요. 할 일 목록을 작성해 집중해보세요.",
    ("mid",    "金"): "차분한 날씨처럼 조용히 실력을 쌓는 데 집중해보세요. 내실의 하루입니다.",
    ("mid",    "水"): "비 오는 날엔 독서나 기록이 잘 됩니다. 생각을 정리하는 시간으로 활용하세요.",
    ("mid",    "木"): "바람 부는 날, 몸과 마음이 가벼운 상태입니다. 산책으로 에너지를 환기하세요.",
    ("low",    "火"): "맑은 날씨와 달리 내 기운은 다소 긴장 상태입니다. 무리한 약속은 피하세요.",
    ("low",    "土"): "날씨도, 기운도 무거운 날. 최소한의 일만 하고 충분한 휴식을 취하세요.",
    ("low",    "金"): "차갑고 예민해지기 쉬운 날. 감정적 대화는 내일로 미루는 것이 현명합니다.",
    ("low",    "水"): "비와 함께 기운도 가라앉는 날. 몸을 따뜻하게 하고 무리하지 마세요.",
    ("low",    "木"): "바람처럼 기운이 흔들리는 날. 중심을 잡고 외부 자극에 흔들리지 마세요.",
    ("caution","火"): "화창한 날씨도 지금은 위로가 되지 않을 수 있어요. 작은 것에 감사하며 버티세요.",
    ("caution","土"): "흐린 하늘처럼 마음도 무거운 날. 혼자 해결하려 하지 말고 주변에 기대세요.",
    ("caution","金"): "차가운 기운이 겹치는 날. 건강에 특히 신경 쓰고, 자극적인 음식을 피하세요.",
    ("caution","水"): "비에 기운까지 겹치는 힘든 날. 오늘은 그냥 쉬어도 됩니다. 내일이 더 낫습니다.",
    ("caution","木"): "바람처럼 예측 불가한 날. 이동이나 야외 활동을 최소화하고 안전하게 있으세요.",
}


def _score_tier(score: int) -> str:
    if score >= 85:
        return "high"
    if score >= 70:
        return "mid"
    if score >= 40:
        return "low"
    return "caution"


def _make_tips(
    score: int,
    branch_combine: bool,
    branch_clash: bool,
    yongshin: Oheng,
    day_element: Oheng,
    weather: dict | None = None,
) -> list[str]:
    tips = []
    if branch_clash:
        tips.append("이동이나 계약 등 중요한 결정은 하루 미루는 것이 좋습니다.")
    if branch_combine:
        tips.append("오늘은 소중한 사람과 시간을 보내면 좋은 에너지가 됩니다.")
    if day_element == yongshin:
        tips.append(f"{yongshin.meaning} 관련 활동이 힘이 됩니다.")

    # 날씨×점수 조합 맞춤 팁
    if weather:
        key = (_score_tier(score), weather["element"])
        weather_tip = _WEATHER_TIPS.get(key)
        if weather_tip:
            tips.append(weather_tip)

    if score < 40 and not tips:
        tips.append("체력 관리에 집중하고, 새로운 시작보다 마무리에 집중하세요.")
    if not tips:
        tips.append("평소 루틴을 유지하며 차분하게 하루를 보내세요.")
    return tips[:3]
