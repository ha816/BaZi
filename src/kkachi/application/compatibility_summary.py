from kkachi.application.compatibility_zodiac import zodiac_summary_line
from kkachi.application.interpreter.narrative import strength_story
from kkachi.application.util.util import josa
from kkachi.domain.ganji import Oheng, Pillar

# 궁합 "한눈에" — 결과 dict만 보고 탭별 한 줄을 만든다(캐시된 옛 결과에도 그대로 동작).
# 이름은 캐시에 없으므로 {p1}·{p2} 토큰으로 두고 프론트가 이름으로 치환한다.

_DAY = Pillar.日柱.korean

_DAY_PHRASE = {
    "stem_combine": "일간이 천간합(天干合)으로 묶여 처음부터 서로 끌리는 사이예요",
    "branch_combine": "일지가 육합(六合)이라 생활 호흡이 잘 맞아요",
    "samhap": "일지가 반합(半合)을 이뤄 함께 있을 때 힘이 모여요",
    "stem_clash": "일간이 천간충(天干衝)이라 생각의 방향이 자주 엇갈려요",
    "branch_clash": "일지가 충(衝)이라 생활 방식이 부딪치기 쉬워요",
    "wonjin": "일지가 원진(怨嗔)이라 이유 없이 서운함이 쌓이기 쉬워요",
    "hyung": "일지가 형(刑)이라 가까울수록 날이 서기 쉬워요",
    "hae": "일지가 해(害)라 작은 오해가 커지기 쉬워요",
    "pa": "일지가 파(破)라 약속이 어긋나기 쉬워요",
}
# 같은 일주에 여러 관계가 있으면 이 순서로 대표를 고른다 (합 먼저, 그다음 충)
_DAY_ORDER = ["stem_combine", "branch_combine", "samhap", "branch_clash", "stem_clash", "wonjin", "hyung", "hae", "pa"]


def _el(name: str) -> str:
    try:
        return f"{Oheng[name].meaning}({name})"
    except KeyError:
        return name


def _el_josa(name: str, with_jong: str, without_jong: str) -> str:
    """오행 표기 + 조사 — "쇠(金)이"가 아니라 뜻풀이(쇠) 받침으로 고른다"""
    word = Oheng[name].meaning if name in Oheng.__members__ else name
    return _el(name) + josa(word, with_jong, without_jong)


def _els(names: list[str]) -> str:
    return "·".join(_el(n) for n in names)


def _pillars_line(result: dict) -> str:
    rels = result.get("pillar_relations") or []
    day_kinds = {r["kind"] for r in rels if r.get("pillar1") == _DAY}
    lead = next((_DAY_PHRASE[k] for k in _DAY_ORDER if k in day_kinds), "")
    good = sum(1 for r in rels if r.get("polarity", 0) > 0)
    bad = sum(1 for r in rels if r.get("polarity", 0) < 0)
    if not lead:
        if good or bad:
            lead = f"일주끼리는 특별한 합·충이 없고, 다른 기둥에서 합 {good}개·충돌 {bad}개가 보여요"
        else:
            lead = "같은 기둥끼리 뚜렷한 합·충이 없어 담백하게 흘러가는 사이예요"
    samhap = result.get("samhap_completions") or []
    if samhap:
        lead += f". 두 분의 지지가 모여 {_el(samhap[0]['element'])}국 삼합이 완성돼요"
    return lead + "."


def _element_line(result: dict) -> str:
    ec = result.get("element_complement") or {}
    s1, s2 = result.get("pillar1_snapshot"), result.get("pillar2_snapshot")
    parts: list[str] = []
    # 용신 보완 — 상대의 주오행이 내 용신이면 곁에 있는 것만으로 힘이 된다
    if s1 and s2:
        if s2.get("my_main_element") and s2["my_main_element"] == s1.get("yongshin"):
            parts.append(f"{{p2}}님의 주오행 {_el_josa(s2['my_main_element'], '이', '가')} {{p1}}님의 용신(用神)이라 곁에 있으면 힘이 돼요")
        if s1.get("my_main_element") and s1["my_main_element"] == s2.get("yongshin"):
            parts.append(f"{{p1}}님의 주오행 {_el_josa(s1['my_main_element'], '이', '가')} {{p2}}님의 용신(用神)이라 곁에 있으면 힘이 돼요")
    if not parts:
        if ec.get("p2_provides"):
            parts.append(f"{{p2}}님이 {_els(ec['p2_provides'])} 기운으로 {{p1}}님의 빈 곳을 채워줘요")
        if ec.get("p1_provides"):
            parts.append(f"{{p1}}님이 {_els(ec['p1_provides'])} 기운으로 {{p2}}님의 빈 곳을 채워줘요")
    if ec.get("overlap_strong"):
        parts.append(f"두 분 모두 {_els(ec['overlap_strong'])} 기운이 강해 부딪칠 수 있어요")
    if not parts:
        return "오행 구성이 비슷한 균형 관계예요."
    return ". ".join(parts[:2]) + "."


def _sinsal_line(result: dict) -> str:
    shared = result.get("shared_sinsal") or []
    u1 = result.get("unique_sinsal_1") or []
    u2 = result.get("unique_sinsal_2") or []
    if shared:
        names = "·".join(shared[:2])
        obj = f"{names} 외 {len(shared) - 2}개를" if len(shared) > 2 else names + josa(names, "을", "를")
        head = f"두 분 모두 {obj} 가져 같은 기운을 나눠요"
    elif u1 or u2:
        head = "함께 가진 신살은 없지만 각자 다른 자리에서 서로를 받쳐줘요"
    else:
        return "두 분 모두 눈에 띄는 신살이 없어요. 신살이 없다고 궁합이 나쁜 건 아니에요."
    tail = []
    if u1:
        tail.append(f"{{p1}}님만 {u1[0]}{'' if len(u1) == 1 else f' 등 {len(u1)}개'}")
    if u2:
        tail.append(f"{{p2}}님만 {u2[0]}{'' if len(u2) == 1 else f' 등 {len(u2)}개'}")
    return head + (f" ({', '.join(tail)})." if tail else ".")


def _domain_line(result: dict) -> str:
    ds = result.get("domain_scores") or {}
    if not ds:
        return ""
    items = sorted(ds.items(), key=lambda kv: kv[1].get("score", 0), reverse=True)
    name = lambda kv: kv[1].get("display_name") or kv[0]  # noqa: E731
    top, low = items[0], items[-1]
    top_score, low_score = top[1].get("score", 0), low[1].get("score", 0)
    if top_score - low_score < 5:
        return f"네 영역이 {low_score}~{top_score}점으로 고르게 비슷해요."
    ties = [name(kv) for kv in items if kv[1].get("score", 0) == top_score]
    best = "·".join(ties[:2])
    line = f"{best} 쪽이 {top_score}점으로 가장 잘 맞고"
    if low_score < 50:
        return f"{line}, {name(low)}{josa(name(low), '은', '는')} {low_score}점으로 노력이 필요해요."
    return f"{line}, {name(low)}도 {low_score}점으로 무난해요."


_STRONG, _WEAK = "신강(身強)", "신약(身弱)"


def _strength_line(result: dict) -> str:
    """두 사람 신강·신약 조합 — strength_label만 쓰므로 옛 캐시에도 동작"""
    s1, s2 = result.get("pillar1_snapshot"), result.get("pillar2_snapshot")
    if not s1 or not s2:
        return ""
    l1, l2 = s1.get("strength_label", ""), s2.get("strength_label", "")
    if l1 == _STRONG and l2 == _WEAK:
        return "{p1}님은 신강(身強), {p2}님은 신약(身弱)이라 한 분이 앞에서 이끌고 한 분이 곁에서 받쳐주는 짝이에요."
    if l1 == _WEAK and l2 == _STRONG:
        return "{p2}님은 신강(身強), {p1}님은 신약(身弱)이라 한 분이 앞에서 이끌고 한 분이 곁에서 받쳐주는 짝이에요."
    if l1 == _STRONG and l2 == _STRONG:
        return "두 분 모두 신강(身強)이라 각자 주관이 뚜렷해요. 결정할 영역을 미리 나눠 두면 부딪힘이 줄어요."
    if l1 == _WEAK and l2 == _WEAK:
        return "두 분 모두 신약(身弱)이라 서로 기대며 힘을 보태는 사이예요. 주변의 도움을 함께 끌어오면 더 단단해져요."
    return ""


def _strength_person(snap: dict | None, token: str) -> str:
    """한 사람의 강약 풀이 — 라벨 · 성향/팁 · 강약 때문에 정해진 용신"""
    if not snap or not snap.get("strength_label"):
        return ""
    label = snap["strength_label"]
    v = snap.get("strength_pct")
    score = f"기운 {v:g}%의 " if isinstance(v, (int, float)) else ""
    line = f"{token}님은 {score}{label}이에요. {strength_story(label)}"
    ys = snap.get("yongshin")
    if ys and label == _STRONG:
        line += f" 넘치는 기운을 풀어주는 {_el_josa(ys, '이', '가')} 용신(用神)이에요."
    elif ys and label == _WEAK:
        line += f" 부족한 힘을 채워주는 {_el_josa(ys, '이', '가')} 용신(用神)이에요."
    return line


def build_compat_summary(result: dict) -> dict:
    """궁합 결과 → 한눈에 {pillars, element, strength, sinsal, domain}. {p1}·{p2}는 이름 토큰."""
    return {
        "pillars": _pillars_line(result),
        "element": _element_line(result),
        "strength": _strength_line(result),
        "strength_p1": _strength_person(result.get("pillar1_snapshot"), "{p1}"),
        "strength_p2": _strength_person(result.get("pillar2_snapshot"), "{p2}"),
        "sinsal": _sinsal_line(result),
        "zodiac": zodiac_summary_line(result),
        "domain": _domain_line(result),
    }
