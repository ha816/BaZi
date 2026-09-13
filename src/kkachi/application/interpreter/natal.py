from dataclasses import asdict

from kkachi.application.util.sipsin_meta import sipsin_domain, sipsin_label, sipsin_timing_meaning
from kkachi.application.util.util import branch_relation, josa, year_to_branch_char, year_to_ganji
from kkachi.application.util.zodiac_meta import zodiac_info
from kkachi.domain.fortune import Fortune
from kkachi.domain.ganji import BRANCH_ANIMAL, OHENG_GUIDE, Branch, Pillar, Sipsin, Stem
from kkachi.domain.interpretation import FengShuiResult, Summary
from kkachi.domain.natal import NatalInfo, PostnatalInfo


def pillar_summary(natal: NatalInfo) -> str:
    """오행 분포 기반 1문장 요약."""
    sorted_elements = sorted(natal.element_stats.items(), key=lambda x: x[1], reverse=True)
    if not sorted_elements or sorted_elements[0][1] == 0:
        return ""
    strongest, count = sorted_elements[0]
    missing = [o for o, c in natal.element_stats.items() if c == 0]
    summary = f"여덟 글자 중 {strongest.meaning}({strongest.name})의 기운이 {count}개로 가장 많아요."
    if missing:
        names = "·".join(o.meaning for o in missing)
        summary += f" {names}의 기운이 없어서, 이를 보완하는 운이 오면 좋아요."
    else:
        summary += " 다섯 기운이 모두 있어 균형 잡힌 구성이에요."
    return summary


def year_zodiac_relations(birth_branch_char: str, base_year: int) -> list[dict]:
    """향후 4년(+최초 삼합/육합)의 띠 관계 행 목록을 반환한다."""
    _DESC_MAP: dict[str, str] = {
        "나":   "본명년(本命年) — 12년마다 돌아오는 변화의 해. 내실 다지기에 집중하세요.",
        "삼합": "삼합(三合) — 강한 기운이 합쳐지는 해. 도전과 확장에 좋은 타이밍입니다.",
        "육합": "육합(六合) — 협력과 관계 확장에 유리한 해입니다.",
        "충":   "충(衝) — 예상치 못한 변화와 이동이 많을 수 있으니 유연하게 대처하세요.",
        "원진": "원진(怨嗔) — 대인관계에서 미묘한 갈등이나 오해가 생기기 쉬운 시기입니다.",
        "보통": "특별한 충·합이 없어요. 큰 기복 없이 꾸준히 나아가기 좋은 한 해입니다.",
    }

    def make_row(year: int) -> dict:
        branch_char = year_to_branch_char(year)
        relation = branch_relation(birth_branch_char, branch_char)
        ganji = year_to_ganji(year)
        info = zodiac_info(branch_char)
        return {
            "year": year,
            "ganji": ganji,
            "branch": branch_char,
            "kor": info.korean,
            "relation": relation,
            "desc": _DESC_MAP.get(relation, ""),
            "info": asdict(info),
        }

    rows = [make_row(base_year + i) for i in range(4)]
    if not any(r["relation"] in ("삼합", "육합") for r in rows):
        for i in range(4, 14):
            r = make_row(base_year + i)
            if r["relation"] in ("삼합", "육합"):
                rows[-1] = r
                break
    return rows


def year_zodiac_narrative(rows: list[dict], name: str = "") -> str:
    """year_zodiac_relations 행 목록을 이름 개인화 내러티브 문장으로 변환한다."""
    body_map: dict[str, str] = {
        "삼합": "강한 기운이 합쳐지는 해, 도전과 확장에 좋은 타이밍",
        "육합": "협력과 관계 확장에 유리한 시기",
        "충":   "예상치 못한 변화와 이동이 많을 수 있는 시기",
        "원진": "대인관계에서 미묘한 갈등이나 오해가 생기기 쉬운 시기",
    }

    good = [r for r in rows if r["relation"] in ("삼합", "육합")]
    bad = [r for r in rows if r["relation"] in ("충", "원진")]
    bon = [r for r in rows if r["relation"] == "나"]

    if not good and not bad and not bon:
        return ""

    def fragment(group: list[dict]) -> str:
        if len(group) == 1:
            r = group[0]
            yy = r["year"] % 100
            return f"{yy}년 {r['kor']}띠와 {r['relation']}으로 {body_map[r['relation']]}"
        years = ", ".join(f"{r['year'] % 100}년" for r in group)
        rels = ", ".join(r["relation"] for r in group)
        bodies = ", ".join(body_map[r["relation"]] for r in group)
        return f"{years}은 {rels}으로 {bodies}"

    prefix = f"{name}님은 " if name else ""
    sentences: list[str] = []

    if good:
        sentences.append(f"{prefix}{fragment(good)}이에요.")
    if bad:
        head = "반면 " if good else prefix
        sentences.append(f"{head}{fragment(bad)}예요.")
    if bon:
        yy = bon[0]["year"] % 100
        if good or bad:
            sentences.append(f"{yy}년은 12년마다 돌아오는 본명년(本命年)이라 내실 다지기 좋은 해예요.")
        else:
            sentences.append(f"{prefix}{yy}년 본명년(本命年)을 맞아 내실 다지기 좋은 시기예요.")

    return " ".join(sentences)


def month_badges(upcoming_months: list[dict]) -> dict[str, list[str]]:
    """이번 달 시운 십신을 도메인→라벨 배지 dict로 변환한다."""
    if not upcoming_months:
        return {}
    current = upcoming_months[0]
    badges: dict[str, list[str]] = {}
    for key in ("stem_sipsin", "branch_sipsin"):
        sipsin_dict = current.get(key) or {}
        sipsin_name = sipsin_dict.get("sipsin_name")
        if not sipsin_name:
            continue
        try:
            sipsin = Sipsin[sipsin_name]
        except KeyError:
            continue
        domain = sipsin_domain(sipsin)
        label = sipsin_label(sipsin)
        badges.setdefault(domain, []).append(label)
    return badges


def core_summary(natal: NatalInfo, postnatal: PostnatalInfo, name: str = "") -> str:
    """선천·후천 데이터를 종합한 핵심 요약 문단을 반환한다."""
    prefix = f"{name}님은" if name else "이 사주는"
    day_stem = natal.saju.stem_of_day_pillar
    my_el = natal.my_main_element
    yong = natal.yongshin
    kisin = yong.overcome_by

    sorted_els = sorted(natal.element_stats.items(), key=lambda x: x[1], reverse=True)
    strongest, top_count = sorted_els[0]
    missing = [o for o, c in natal.element_stats.items() if c == 0]

    sentences: list[str] = []
    sentences.append(
        f"{prefix} {day_stem.korean}({day_stem.name}) 일간으로 "
        f"{my_el.meaning}({my_el.name}) 기운이 중심인 {natal.strength_label} 사주예요."
    )

    if strongest is my_el:
        top_josa = josa(strongest.meaning, "이", "가")
        top_clause = f"여덟 글자 중 주 오행인 {strongest.meaning}{top_josa} {top_count}개로 두텁게 자리잡고 있어요"
    else:
        my_josa = josa(my_el.meaning, "이", "가")
        top_clause = (
            f"여덟 글자 중 {strongest.meaning}({strongest.name})의 기운이 {top_count}개로 가장 많고, "
            f"주 오행 {my_el.meaning}{my_josa} 받쳐주는 구성이에요"
        )
    if missing:
        miss_names = "·".join(o.meaning for o in missing)
        sentences.append(f"{top_clause}. 다만 {miss_names}의 기운이 비어 있어 이를 채워주는 흐름이 들어올 때 결이 부드러워져요.")
    else:
        sentences.append(f"{top_clause}. 다섯 기운이 모두 있어 비교적 균형 잡힌 구성이에요.")

    kisin_josa = josa(kisin.meaning, "은", "는")
    sentences.append(
        f"균형을 잡아주는 처방은 용신 {yong.meaning}({yong.name}) — 색·방향·습관에서 가까이 두면 흐름이 가벼워지고, "
        f"기신 {kisin.meaning}({kisin.name}){kisin_josa} 가능한 멀리하면 좋아요."
    )

    if postnatal.samjae:
        stage = postnatal.samjae.get("type", "")
        if stage:
            sentences.append(
                f"올해는 {stage} 흐름이라 큰 확장보다 내실 다지기에 집중하면 다음 도약의 발판이 돼요."
            )

    return " ".join(sentences)


def zodiac_relation(birth_branch: Branch, year: int) -> str:
    """태어난 해 지지와 분석 연도의 띠 관계를 한 문장으로 반환."""
    seun_branch = Branch.from_char(year_to_ganji(year)[1])
    kor = BRANCH_ANIMAL.get(seun_branch.name, seun_branch.name)
    label = f"{year}년 {kor}띠 해"
    rel = branch_relation(birth_branch.name, seun_branch.name)
    if rel == "나":
        return f"올해({label})와 같은 해예요. 본명년(本命年)으로 변화가 많은 해입니다."
    if rel == "충":
        return f"올해({label})와 충(衝)이 있어요. 예상치 못한 변화에 유연하게 대처하세요."
    if rel == "삼합":
        return f"올해({label})와 삼합이 맞아요. 좋은 기운이 따릅니다."
    return f"올해({label})와 특별한 충·합은 없어요. 꾸준히 나아가기 좋은 해예요."


def _polite(text: str) -> str:
    """'~습니다.' 체를 카드 톤인 '~어요.' 체로. Oheng.personality 5문장에 맞춘 최소 규칙."""
    return text.replace("합니다.", "해요.").replace("납니다.", "나요.").replace("습니다.", "어요.")


def _ganji_korean(ganji: str) -> str:
    return Stem.from_char(ganji[0]).korean + Branch.from_char(ganji[1]).korean


def today_line(fortune: Fortune) -> str:
    """아침 한 마디 헤드라인에서 '{name}님, ' 접두를 뗀다 (카드 첫 줄이 이미 이름을 말함)."""
    head = fortune.headline or fortune.description
    return head.split("님, ", 1)[1] if "님, " in head[:12] else head


def build_summary(
    natal: NatalInfo, postnatal: PostnatalInfo, name: str, today: Fortune | None,
    feng_shui: FengShuiResult | None = None,
) -> Summary:
    """결과 첫 화면 요약. 각 줄은 이미 있는 룰 엔진 데이터에서 조립하며 LLM을 쓰지 않는다.
    한눈에 탭이 만세력·용신삼재·시운·십이지신·풍수로 진입하는 허브가 되도록 영역별 한 줄을 담는다."""
    day_stem = natal.saju.stem_of_day_pillar
    my_el = natal.my_main_element
    yong = natal.yongshin
    kisin = yong.overcome_by
    prefix = f"{name}님의 사주는" if name else "이 사주는"

    recite = "·".join(
        f"{sb.stem.korean}{sb.branch.korean}({sb.stem.name}{sb.branch.name})"
        for sb in natal.saju.pillars.values()
    )
    count_word = "세" if natal.saju.hour_unknown else "네"
    me = (
        f"{prefix} {recite} {count_word} 기둥이에요. "
        f"{day_stem.korean}({day_stem.name}) 일간, {my_el.meaning}({my_el.name}) 기운이 중심인 "
        f"{natal.strength_label} 사주로 {_polite(my_el.personality)}"
    )

    seun_ganji = year_to_ganji(postnatal.year)
    _, seun_sipsin = postnatal.seun_stem
    year = (
        f"올해 {postnatal.year}년 {seun_ganji}({_ganji_korean(seun_ganji)}){josa(_ganji_korean(seun_ganji), '은', '는')} {sipsin_label(seun_sipsin)} 해예요. "
        f"{sipsin_timing_meaning(seun_sipsin)}"
    )
    if postnatal.yongshin_in_seun:
        year += f" 용신 {yong.meaning}({yong.name}) 기운도 함께 들어와 큰 흐름이 좋아요."

    months = postnatal.upcoming_months or []
    if months:
        cur = months[0]
        domains = list(month_badges(months))
        m_kor = _ganji_korean(cur["ganji"])
        if domains:
            month = f"이번 달 {cur['month']}월 {cur['ganji']}({m_kor}){josa(m_kor, '은', '는')} {'·'.join(domains)} 기운이 살아요."
        else:
            month = f"이번 달 {cur['month']}월 {cur['ganji']}({m_kor}){josa(m_kor, '은', '는')} 튀는 기운 없이 잔잔해요."
        if cur.get("matches_yongshin"):
            month += " 용신 달이라 흐름이 가벼워요."
    else:
        month = ""

    if postnatal.seun_clashes:
        c = postnatal.seun_clashes[0]
        caution = (
            f"올해 세운 {c['incoming_korean']}({c['incoming']})이 {c['pillar']} {c['target_korean']}({c['target']})과 "
            f"충(衝)이에요. {c['area_label']}에서 갑작스런 변화에 대비하세요."
        )
    elif postnatal.daeun_clashes:
        c = postnatal.daeun_clashes[0]
        caution = (
            f"현재 대운이 {c['pillar']} {c['target_korean']}({c['target']})과 충(衝)이에요. "
            f"{c['area_label']}은 서두르지 말고 다지는 시기예요."
        )
    else:
        guide = OHENG_GUIDE[kisin]
        caution = (
            f"기신 {kisin.meaning}({kisin.name}) 기운은 멀리하세요. "
            f"{guide['color']} 계열과 {guide['direction']} 방향은 줄이는 게 좋아요."
        )

    sinsal_names = list(dict.fromkeys(s.korean for _, s in natal.sinsal))
    if sinsal_names:
        joined = "·".join(sinsal_names)
        energy = f"{joined}{josa(sinsal_names[-1], '을', '를')} 지녔어요. 특별한 기운이라 잘 살리면 나만의 강점이 돼요."
    else:
        energy = "뚜렷한 신살은 없어요. 십이운성으로 인생 시기별 에너지 흐름을 볼 수 있어요."

    yong_guide = OHENG_GUIDE[yong]
    yongshin = (
        f"용신은 {yong.meaning}({yong.name}) — {yong_guide['color']} 색과 {yong_guide['direction']} 방향을 가까이 두면 흐름이 가벼워져요."
    )
    if postnatal.samjae:
        yongshin += f" 올해는 {postnatal.samjae.get('type', '')} 흐름이라 내실 다지기에 좋아요."
    else:
        yongshin += " 올해는 삼재(三災) 시기가 아니에요."

    year_branch = natal.saju.pillars[Pillar.年柱].branch
    animal = BRANCH_ANIMAL.get(year_branch.name, year_branch.name)
    zodiac = f"{animal}띠예요. {zodiac_relation(year_branch, postnatal.year)}"

    fengshui = ""
    if feng_shui is not None:
        dirs = "·".join(d.direction for d in feng_shui.lucky_directions[:2])
        fengshui = f"{feng_shui.group} — 책상·잠자리를 {dirs}쪽으로 두면 기운이 살아요." if dirs else feng_shui.group

    return Summary(
        me=me,
        year=year,
        month=month,
        today=today_line(today) if today else "",
        caution=caution,
        today_date=today.date if today else "",
        energy=energy,
        yongshin=yongshin,
        zodiac=zodiac,
        fengshui=fengshui,
    )
