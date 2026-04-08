from dataclasses import asdict
from datetime import date, datetime, timedelta
from uuid import UUID

from sajupy import calculate_saju as _sajupy_calculate

from kkachi.application.port.fortune_port import FortunePort
from kkachi.application.port.profile_port import ProfilePort
from kkachi.application.port.weather_port import WeatherPort
from kkachi.application.saju_service import SajuService
from kkachi.domain.fortune import Fortune
from kkachi.domain.ganji import Branch, Oheng, Pillar, Sipsin, StemBranch
from kkachi.domain.natal import NatalInfo
from kkachi.domain.user import User


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


def _compute(natal: NatalInfo, today: date, weather: dict | None = None) -> Fortune:
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

    # 용신 판정
    if day_element == natal.yongshin:
        raw += 25
        reasons.append(f"오늘 일간({day_stem.name})이 용신({natal.yongshin.name}) 오행")
    elif day_element.generates == natal.yongshin:
        raw += 15
        reasons.append(f"오늘 일간이 용신을 生함")
    elif day_element.overcomes == natal.yongshin or natal.yongshin.overcomes == day_element:
        raw -= 15
        reasons.append(f"오늘 일간이 용신을 剋함")

    # 일지 합/충
    if branch_combine:
        raw += 15
        reasons.append("오늘 일지와 내 일지가 육합(六合)")
    if branch_clash:
        raw -= 15
        reasons.append("오늘 일지와 내 일지가 충(衝)")

    # 오행 생조
    if day_element.generates == natal.my_main_element:
        raw += 10
        reasons.append(f"오늘 오행이 내 주 오행을 生함")

    # 십신
    if today_sipsin_stem in GOOD_SIPSIN:
        raw += 8
        reasons.append(f"일간 십신 {today_sipsin_stem.name} 길신")
    elif today_sipsin_stem in BAD_SIPSIN:
        raw -= 8
        reasons.append(f"일간 십신 {today_sipsin_stem.name} 흉신")

    # 날씨 오행 보정
    if weather:
        weather_el = Oheng[weather["element"]]
        if weather_el == natal.yongshin:
            raw += 10
            reasons.append(f"날씨({weather['condition']})가 용신 오행과 일치")
        elif weather_el.generates == natal.yongshin:
            raw += 5
            reasons.append(f"날씨가 용신을 生함")
        elif weather_el.overcomes == natal.yongshin:
            raw -= 8
            reasons.append(f"날씨({weather['condition']})가 용신을 剋함")

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
        name, st_element, st_tip = solar_term_info
        solar_term_name = name
        tips = [f"오늘은 {name}입니다. {st_tip}", *tips][:3]

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
            parts.append(f"특별한 길흉보다는 꾸준함이 힘이 되는 하루입니다.")
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
    if score >= 85: return "high"
    if score >= 70: return "mid"
    if score >= 40: return "low"
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


class FortuneService:
    def __init__(
        self,
        profile_port: ProfilePort,
        fortune_port: FortunePort,
        saju_service: SajuService,
        weather_adapter: WeatherPort | None = None,
    ):
        self._profile_port = profile_port
        self._fortune_port = fortune_port
        self._saju_service = saju_service
        self._weather = weather_adapter

    async def _get_weather_map(self, city: str, days: int) -> dict[str, dict]:
        """날짜 문자열 → 날씨 dict 맵 반환. 실패 시 빈 dict."""
        if self._weather is None:
            return {}
        forecast = await self._weather.get_forecast(city, days=days)
        if not forecast:
            return {}
        return {w["date"]: w for w in forecast}

    async def get_fortune(self, profile_id: UUID, today: date | None = None) -> dict:
        if today is None:
            today = date.today()

        cached = await self._fortune_port.get(profile_id, today)
        # 날씨 어댑터가 있는데 캐시에 날씨가 없으면 재계산
        if cached and (self._weather is None or cached.result.get("weather") is not None):
            return cached.result

        profile = await self._profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")

        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)
        natal, _ = self._saju_service.analyze(user, today.year)
        weather_map = await self._get_weather_map(profile.city, days=1)
        weather = weather_map.get(today.isoformat())

        fortune = _compute(natal, today, weather)
        result = asdict(fortune)
        await self._fortune_port.save(profile_id, today, result)
        return result

    async def get_forecast(self, profile_id: UUID, days: int = 7) -> list[dict]:
        today = date.today()
        profile = await self._profile_port.get(profile_id)
        if profile is None:
            raise ValueError(f"Profile {profile_id} not found")

        user = User(name=profile.name, gender=profile.gender, birth_dt=profile.birth_dt, city=profile.city)
        weather_map = await self._get_weather_map(profile.city, days=days)

        results = []
        for i in range(days):
            target = today + timedelta(days=i)
            target_str = target.isoformat()
            weather = weather_map.get(target_str)

            cached = await self._fortune_port.get(profile_id, target)
            # 캐시 재사용 조건: 날씨 데이터 있거나, 날씨 어댑터 없거나, 캐시에 이미 날씨 있음
            if cached and (weather is None or cached.result.get("weather") is not None):
                results.append(cached.result)
                continue

            natal, _ = self._saju_service.analyze(user, target.year)
            fortune = _compute(natal, target, weather)
            result = asdict(fortune)
            await self._fortune_port.save(profile_id, target, result)
            results.append(result)
        return results
