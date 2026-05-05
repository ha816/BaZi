from dataclasses import asdict

from kkachi.application.util.sipsin_meta import sipsin_domain, sipsin_label
from kkachi.application.util.util import josa, year_to_ganji
from kkachi.application.util.zodiac_meta import zodiac_info
from kkachi.domain.ganji import BRANCH_ANIMAL, Branch, Oheng, Sipsin, branch_relation, year_to_branch_char
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
