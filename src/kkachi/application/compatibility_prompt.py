import re

from kkachi.application.report_builder import kor_ganji
from kkachi.application.util.compatibility_meta import (
    DOMAIN_LABEL_BY_REL,
    RELATION_LABEL,
    RelationType,
)
from kkachi.domain.compatibility import CompatibilityResult
from kkachi.domain.ganji import Branch, Pillar, Stem
from kkachi.domain.natal import NatalInfo
from kkachi.domain.user import User

# AI 해석 프롬프트 버전 — 가이드·데이터가 바뀌면 올린다(compatibilities 캐시의 옛 글을 버리고 다시 만들게)
NARRATIVE_PROMPT_VERSION = 5  # 5: 한 줄 총평 제거 · 3: 형식 뼈대(### 제목) 추가 · 4: 5섹션 900~1,200자 + 첫 제목 미리 채움 (2026-10-23)
NARRATIVE_FIRST_HEADING = "### 두 분의 결\n"

# 궁합 결과 → LLM 입력 텍스트. 챗 시스템 프롬프트의 [데이터] 블록(format_chat_context)과
# 종합해석 스트리밍 프롬프트(format_narrative_prompt). 호출은 CompatibilityService.build_chat_context/build_narrative_prompt.


def format_chat_context(
    result: CompatibilityResult,
    natal1: NatalInfo, natal2: NatalInfo,
    user1: User, user2: User, year: int,
    name1: str, name2: str,
    relation_type: RelationType = "lover",
) -> str:
    label_map = DOMAIN_LABEL_BY_REL[relation_type]
    def _person_block(label: str, user: User, natal: NatalInfo) -> str:
        gender = "남" if user.gender.is_male else "여"
        birth = user.birth_dt.strftime("%Y-%m-%d %H:%M")
        pillars = " ".join(str(sb) for sb in natal.saju.pillars.values())
        elem = " ".join(f"{o.name}{c}" for o, c in natal.element_stats.items())
        sinsal = ", ".join(s.korean for _, s in natal.sinsal) or "없음"
        return (
            f"[{label}] {gender} | {birth}\n"
            f"- 사주: {pillars} (일간 {natal.saju.stem_of_day_pillar.name})\n"
            f"- 오행: {elem} | 주오행 {natal.my_main_element.name} | {natal.strength_label} | 용신 {natal.yongshin.name}\n"
            f"- 신살: {sinsal}"
        )

    day = Pillar.日柱.korean
    key_rels = [r.label for r in result.pillar_relations if r.pillar1 == day]
    other_rels = [r.label for r in result.pillar_relations if r.pillar1 != day][:4]
    relations_line = ", ".join(key_rels + other_rels) if (key_rels or other_rels) else "특별한 합·충 없음"

    samhap_line = (
        ", ".join(f"{c['element']}국({''.join(c['branches'])})" for c in result.samhap_completions)
        if result.samhap_completions else "없음"
    )
    scores_line = " / ".join(
        f"{label_map.get(k, k)} {v.get('score', 0)}({v.get('level', '')})"
        for k, v in result.domain_scores.items()
    )
    ec = result.element_complement or {}
    complement_parts: list[str] = []
    if ec.get("p1_provides"):
        complement_parts.append(f"{name1 or '첫 번째 분'}이 {','.join(ec['p1_provides'])} 보완")
    if ec.get("p2_provides"):
        complement_parts.append(f"{name2 or '두 번째 분'}이 {','.join(ec['p2_provides'])} 보완")
    if ec.get("overlap_strong"):
        complement_parts.append(f"공통 과잉: {','.join(ec['overlap_strong'])}")
    complement_line = " / ".join(complement_parts) if complement_parts else "특이사항 없음"

    return "\n".join([
        f"[궁합 분석 {year}년 · 관계 유형: {RELATION_LABEL[relation_type]}]",
        _person_block(name1 or "첫 번째 분", user1, natal1),
        "",
        _person_block(name2 or "두 번째 분", user2, natal2),
        "",
        f"[종합] {result.total_score}점 — {result.label}",
        f"- 한줄평: {result.description}",
        f"- 핵심 관계: {relations_line}",
        f"- 삼합 완성: {samhap_line}",
        f"- 오행 보완: {complement_line}",
        f"- 함께 가진 신살: {', '.join(result.shared_sinsal) if result.shared_sinsal else '없음'}",
        f"- 영역별: {scores_line}",
        f"- 키 트레이트: {', '.join(result.key_traits)}",
    ])


_ELEMENT_KOR = {"木": "나무", "火": "불", "土": "흙", "金": "쇠", "水": "물"}
_SCORE_WORD = {"좋음": "잘 맞음", "보통": "무난", "주의": "아쉬움"}


def _kor_el(ch: str) -> str:
    return f"{_ELEMENT_KOR[ch]}({ch})" if ch in _ELEMENT_KOR else ch


def _kor_char(ch: str) -> str:
    """'丁' → '정(丁)', '午' → '오(午)'."""
    try:
        return f"{Stem[ch].korean}({ch})"
    except KeyError:
        try:
            return f"{Branch[ch].korean}({ch})"
        except KeyError:
            return ch


def kor_relation_label(label: str) -> str:
    """'丁壬 천간합' → '정(丁)·임(壬) 천간합', '午戌 반합(火)' → '오(午)·술(戌) 반합 불(火)'."""
    m = re.match(r"^([\u4e00-\u9fff])([\u4e00-\u9fff])\s*(.*)$", label)
    if not m:
        return label
    rest = re.sub(r"\(([木火土金水])\)", lambda mm: " " + _kor_el(mm.group(1)), m.group(3))
    return f"{_kor_char(m.group(1))}·{_kor_char(m.group(2))} {rest}".strip()


def _names(text: str, name1: str, name2: str) -> str:
    """요약·캐릭터 문장의 {p1}·{p2} 토큰(뒤에 '님'이 붙어 있음) → 맨이름."""
    return text.replace("{p1}", name1).replace("{p2}", name2)


def _person_line(name: str, user: User, snap: dict | None, zodiac: dict | None, sinsal_only: list[str], shared: list[str]) -> str:
    gender = "남" if user.gender.is_male else "여"
    if not snap:
        return f"- {name}: {gender}"
    pillars = "·".join(kor_ganji(g) for g in snap.get("pillars") or [])
    stats = snap.get("element_stats") or {}
    elems = " ".join(f"{_ELEMENT_KOR[e]}{stats.get(e, 0)}" for e in ("木", "火", "土", "金", "水") if e in _ELEMENT_KOR)
    zod = f" · 띠 {zodiac['korean']}({zodiac['branch']})" if zodiac else ""
    hour = " · 시간 미상(세 기둥)" if snap.get("hour_unknown") else ""
    sins = "·".join(shared + sinsal_only) or "없음"
    return (
        f"- {name}: {gender} · 일간 {_kor_char(snap.get('day_stem', ''))} 주오행 {_kor_el(snap.get('my_main_element', ''))} · "
        f"기운 {snap.get('strength_pct', 0):g}% {snap.get('strength_label', '')} · 용신 {_kor_el(snap.get('yongshin', ''))} · "
        f"기둥 {pillars}{hour} · 오행 {elems}{zod} · 신살 {sins}"
    )


def format_narrative_prompt(
    result: dict, user1: User, user2: User, year: int,
    relation_type: RelationType = "lover",
) -> str:
    """궁합 결과 dict(compute_direct 모양: summary·zodiac·character 포함) → AI 해석 프롬프트."""
    bare1, bare2 = user1.name or "첫 번째 분", user2.name or "두 번째 분"
    n1 = f"{user1.name}님" if user1.name else "첫 번째 분"
    n2 = f"{user2.name}님" if user2.name else "두 번째 분"
    label_map = DOMAIN_LABEL_BY_REL[relation_type]
    rel_label = RELATION_LABEL[relation_type]
    relation_tone = {
        "lover":  "연인·부부 — 끌림·정서·결혼·동반자 어휘를 써도 돼요",
        "friend": "친구·동료 — 끌림·연애 어휘 금지, 신뢰·협업·우정 중심",
        "family": "가족 — 끌림·연애 어휘 금지, 유대·정서 교감·가운(家運) 중심",
    }[relation_type]
    character = result.get("character") or {}
    title = character.get("title", "")
    char_hint = f" 칭호 '{title}'을 한 번 쓰세요." if title else ""

    # 기둥 관계 — 일주부터, 최대 6개
    day = Pillar.日柱.korean
    rels = [r for r in result.get("pillar_relations") or [] if r.get("pillar1") == day]
    rels += [r for r in result.get("pillar_relations") or [] if r.get("pillar1") != day]
    rel_lines = [
        f"{r.get('pillar1', '')} {kor_relation_label(r.get('label', ''))}{'(+)' if r.get('polarity', 0) > 0 else '(−)' if r.get('polarity', 0) < 0 else ''}"
        for r in rels[:6]
    ]
    samhap = result.get("samhap_completions") or []
    samhap_line = ", ".join(f"{_kor_el(c['element'])} 삼합({'·'.join(_kor_char(b) for b in c['branches'])})" for c in samhap) if samhap else "없음"
    ec = result.get("element_complement") or {}
    comp: list[str] = []
    if ec.get("p1_provides"):
        comp.append(f"{n1}이 {'·'.join(_kor_el(e) for e in ec['p1_provides'])}를 채워 줌")
    if ec.get("p2_provides"):
        comp.append(f"{n2}이 {'·'.join(_kor_el(e) for e in ec['p2_provides'])}를 채워 줌")
    if ec.get("overlap_strong"):
        comp.append(f"둘 다 {'·'.join(_kor_el(e) for e in ec['overlap_strong'])} 과잉")
    shared = result.get("shared_sinsal") or []
    u1_only, u2_only = result.get("unique_sinsal_1") or [], result.get("unique_sinsal_2") or []
    sinsal_line = (f"함께 가진 {'·'.join(shared)}" if shared else "함께 가진 신살 없음")
    if u1_only:
        sinsal_line += f" · {n1}만 {'·'.join(u1_only)}"
    if u2_only:
        sinsal_line += f" · {n2}만 {'·'.join(u2_only)}"
    zodiac = result.get("zodiac") or {}
    summary = result.get("summary") or {}

    score_lines = []
    for key, info in (result.get("domain_scores") or {}).items():
        pros = " · ".join(x.get("text", "") for x in (info.get("pros") or [])[:2])
        cons = " · ".join(x.get("text", "") for x in (info.get("cons") or [])[:2])
        level = info.get("level", "")
        score_lines.append(
            f"- {label_map.get(key, key)} {info.get('score', '')}점({_SCORE_WORD.get(level, level)})"
            + (f" — 좋은 점: {pros}" if pros else "") + (f" / 아쉬운 점: {cons}" if cons else "")
        )

    moments = character.get("moments") or {}
    lines = [
        f"# {n1}·{n2} 궁합 풀이 자료 ({year}년 · 관계 {rel_label})",
        "",
        "## 쓰는 법 (반드시 지킬 것)",
        "- 아래 자료는 사주까치 룰 엔진이 계산한 결론이에요. 두 분은 결과 화면의 탭(성격·팔자비교·시운·띠궁합·종합점수)에서 이 내용을 카드로 이미 봤어요. "
        "같은 문장을 되풀이하지 말고, 두 사람 사이의 이야기로 엮고 '그래서 무엇을 해 볼지'를 쓰세요.",
        "- 분량: 전체 900~1,200자. 아래 5개 섹션을 순서대로, 각 섹션은 `### 제목` 한 줄 뒤에 3~4문장(필요하면 불릿 최대 3개). 섹션의 첫 문장이 결론이에요.",
        f"- 두 분은 항상 '{n1}'·'{n2}'라고 부르세요. '첫 번째 분'·'두 번째 분'은 쓰지 마세요.",
        f"- 관계 톤: {relation_tone}.",
        "- 문체: 구어체 존댓말('~해요'). 용어는 우리말을 먼저 쓰고 한자는 괄호 안에만 — 예 '물(水)', '천간합(天干合)', '정(丁)'. "
        "괄호 밖에 한자·중국어·일본어·영어를 쓰지 마세요. '合'·'月'처럼 한 글자만 한자로 바꾸는 것도 안 돼요.",
        "- 신강(身強)·신약(身弱)은 체력이 아니라 일간 기운의 세기예요 — '기운이 강한 편/약한 편'으로 풀어 쓰세요. 점수는 숫자를 나열하지 말고 가장 잘 맞는 곳과 아쉬운 곳만 말하세요.",
        "- 금지: 표(|), '사주에 따르면'·'데이터에 따르면'·'자료에 따르면' 같은 말, 자료에 없는 추측, 막연한 격려, 총평·요약 문장.",
        "",
        "## 섹션",
        f"1. `### 두 분의 결` — 일간 오행·기운 세기·용신이 어떻게 맞물리는지, 어떤 인연인지.{char_hint}",
        "2. `### 끌리는 자리, 부딪히는 자리` — 기둥 관계(합·충·원진 등)·함께 가진 신살·잘 맞는 순간/부딪히기 쉬운 순간 중 큰 것 두세 개. 없으면 솔직히.",
        f"3. `### 영역별 흐름` — {' · '.join(label_map.values())} 중 가장 잘 맞는 곳과 아쉬운 곳, 각각 근거 하나.",
        "4. `### 서로에게 주는 것` — 오행 보완·용신·각자만 가진 신살로 한 사람이 다른 사람에게 채워 주는 것을 사람마다 한 번씩.",
        "5. `### 이번 주에 해 볼 것` — 관계 톤에 맞는 구체적 행동 2~3가지.",
        "마지막 섹션(이번 주에 해 볼 것)에서 글을 끝내고, 총평·요약·맺음말은 쓰지 마세요.",
        "",
        "## 형식 (이 뼈대를 그대로 채우세요 — 제목 줄 `### `을 빼먹지 마세요)",
        "### 두 분의 결\n(3~4문장)\n\n### 끌리는 자리, 부딪히는 자리\n(3~4문장)\n\n### 영역별 흐름\n(3~4문장)\n\n### 서로에게 주는 것\n(3~4문장)\n\n### 이번 주에 해 볼 것\n(3~4문장)",
        "",
        "## 자료",
        "### 두 사람",
        _person_line(n1, user1, result.get("pillar1_snapshot"), zodiac.get("p1"), u1_only, shared),
        _person_line(n2, user2, result.get("pillar2_snapshot"), zodiac.get("p2"), u2_only, shared),
    ]
    if title:
        roles = character.get("roles") or []
        role_txt = " · ".join(
            f"{n1 if r.get('token') == '{p1}' else n2} {r.get('name', '')}·{_kor_el(r.get('element', ''))}" for r in roles
        )
        lines += ["### 궁합 캐릭터", f"- '{title}' — {role_txt}: {_names(character.get('desc', ''), bare1, bare2)}"]
        if moments.get("good") or moments.get("hard"):
            lines.append(f"- 잘 맞는 순간: {' · '.join(moments.get('good') or [])} / 부딪히기 쉬운 순간: {' · '.join(moments.get('hard') or [])}")
    lines += [
        "### 기둥 관계·오행·신살",
        f"- 종합 {result.get('total_score', '')}점 {result.get('label', '')} — {result.get('description', '')}",
        "- 기둥 관계(+좋음 −주의): " + (" · ".join(rel_lines) if rel_lines else "특별한 합·충 없음"),
        f"- 삼합 완성: {samhap_line}",
        "- 오행 보완: " + (" · ".join(comp) if comp else "특이사항 없음"),
        f"- 신살: {sinsal_line}",
    ]
    if zodiac.get("headline"):
        lines.append(f"- 띠: {_names(zodiac['headline'], bare1, bare2)}")
    if score_lines:
        lines += ["### 영역 점수"] + score_lines
    cards = [summary.get(k) for k in ("pillars", "element", "strength", "domain")]
    cards = [c for c in cards if c]
    if cards:
        lines += ["### 화면 카드 문장 (이미 보이는 결론 — 어긋나지 말고, 베끼지도 말 것)"] + [f"- {_names(c, bare1, bare2)}" for c in cards]
    lines.append("\n(답은 처음부터 끝까지 한국어로만 쓰세요. 중국어 문장이 한 줄이라도 섞이면 안 돼요.)")
    return "\n".join(lines)
