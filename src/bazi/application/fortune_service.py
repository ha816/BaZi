from dataclasses import asdict
from datetime import date, datetime, timedelta
from uuid import UUID

from sajupy import calculate_saju as _sajupy_calculate

from bazi.application.port.fortune_port import FortunePort
from bazi.application.port.profile_port import ProfilePort
from bazi.application.port.weather_port import WeatherPort
from bazi.application.saju_service import SajuService
from bazi.domain.fortune import Fortune
from bazi.domain.ganji import Branch, Oheng, Pillar, Sipsin, StemBranch
from bazi.domain.natal import NatalInfo
from bazi.domain.user import User


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
    tips = _make_tips(total_score, branch_combine, branch_clash, natal.yongshin, day_element)

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


def _make_tips(
    score: int,
    branch_combine: bool,
    branch_clash: bool,
    yongshin: Oheng,
    day_element: Oheng,
) -> list[str]:
    tips = []
    if branch_clash:
        tips.append("이동이나 계약 등 중요한 결정은 하루 미루는 것이 좋습니다.")
    if branch_combine:
        tips.append("오늘은 소중한 사람과 시간을 보내면 좋은 에너지가 됩니다.")
    if day_element == yongshin:
        tips.append(f"{yongshin.meaning} 관련 활동(운동·야외·물 등)이 힘이 됩니다.")
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
