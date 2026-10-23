"""AI 풀이 프롬프트 — 룰 엔진 결과를 LLM이 '한 편의 이야기'로 엮을 수 있는 짧은 자료 시트로 만든다.

2026-10-23 개편: 카드 본문(성격·오행·운세 블록 등)을 통째로 싣던 7,000토큰짜리 레포트를 버리고
탭마다 한두 줄의 구조화된 자료(≈1,800토큰)만 준다 — 첫 토큰까지 99초 → 20초대, 출력은 5섹션 700~900자.
프롬프트가 바뀌면 REPORT_PROMPT_VERSION을 올린다(analyses 캐시의 옛 글은 버리고 다시 만든다).
"""
from kkachi.domain.ganji import Branch, Stem
from kkachi.domain.interpretation import NatalResult, PostnatalResult
from kkachi.domain.user import Gender, User

REPORT_PROMPT_VERSION = 6  # 6: 앞으로 1년·달 자료 제거, 6섹션 1,000~1,200자 · 5: 한 줄 총평 제거 · 3: 형식 뼈대(### 제목) 추가, qwen3.8 기본 · 4: 삶의 영역 7섹션 1,300~1,500자 + 첫 제목 미리 채움 (2026-10-23)
# 답의 첫 줄 — 어댑터가 assistant 메시지로 미리 채워 이어 쓰게 한다(qwen3.8이 제목을 통째로 빼먹는 것 방지)
REPORT_FIRST_HEADING = "### 나는 어떤 사람\n"

_PILLARS = ["년주", "월주", "일주", "시주"]
SIPSIN_KOR = {"比肩": "비견", "劫財": "겁재", "食神": "식신", "傷官": "상관", "偏財": "편재", "正財": "정재", "偏官": "편관", "正官": "정관", "偏印": "편인", "正印": "정인"}
_ELEMENT_KOR = {"木": "나무", "火": "불", "土": "흙", "金": "쇠", "水": "물"}
_LEVEL_KOR = {"high": "좋음", "medium": "보통", "low": "주의"}
_SIPSIN_GROUPS: list[tuple[str, str, list[str], str]] = [
    ("비겁", "자아·동료", ["比肩", "劫財"], "무비겁 — 동료·경쟁 관계 약함"),
    ("식상", "표현·재능", ["食神", "傷官"], "무식상 — 표현 출구 부족"),
    ("재성", "재물·결과", ["偏財", "正財"], "무재 — 직접 돈벌이보다 조직 안에서 인정받는 쪽이 유리"),
    ("관성", "직장·규율", ["偏官", "正官"], "무관 — 자유로운 행보"),
    ("인성", "학문·후원", ["偏印", "正印"], "무인성 — 멘토·학습으로 보완"),
]


def kor_ganji(ganji: str) -> str:
    """'己卯' → '기묘(己卯)'. 모르는 글자는 그대로."""
    if len(ganji) < 2:
        return ganji
    s, b = ganji[0], ganji[1]
    try:
        return f"{Stem[s].korean}{Branch[b].korean}({ganji})"
    except KeyError:
        return ganji


def kor_sipsin(name: str) -> str:
    """'偏印' → '편인(偏印)'."""
    return f"{SIPSIN_KOR[name]}({name})" if name in SIPSIN_KOR else name


def kor_element(ch: str) -> str:
    """'木' → '나무(木)'."""
    return f"{_ELEMENT_KOR[ch]}({ch})" if ch in _ELEMENT_KOR else ch


class LlmReportBuilder:
    """NatalResult + PostnatalResult → LLM 입력 마크다운(쓰는 법 + 섹션 + 자료)."""

    def build(self, natal: NatalResult, postnatal: PostnatalResult, user: User, name: str = "") -> str:
        who = f"{name}님" if name else "당신"
        parts = [
            self._guide(natal, postnatal, who),
            "## 자료",
            self._basic(user, name, postnatal.year, natal.hour_unknown),
            self._palja(natal, who),
            self._yongshin(natal, postnatal),
            self._siun(postnatal),
            self._zodiac(natal, postnatal),
            self._fengshui(natal),
        ]
        return "\n\n".join(p for p in parts if p) + self._TAIL

    # ── 쓰는 법 ──────────────────────────────────────────────────────────
    def _guide(self, n: NatalResult, p: PostnatalResult, who: str) -> str:
        character = (n.character or {}).get("title", "")
        char_hint = f" 캐릭터 이름 '{character}'을 한 번 쓰세요." if character else ""
        hour_rule = (
            "- 출생시간 미상: 시주 없이 세 기둥으로 본 자료예요. 자녀·말년(시주) 이야기는 하지 말고, "
            "시간을 알면 더 볼 수 있다고 한 번만 말하세요.\n"
            if n.hour_unknown else ""
        )
        return (
            f"# {who} 사주 풀이 자료 ({p.year}년)\n"
            "\n"
            "## 쓰는 법 (반드시 지킬 것)\n"
            f"- 아래 자료는 사주까치 룰 엔진이 계산한 결론이에요. {who}은 결과 화면의 탭(만세력·신살·운성·용신·삼재·택시·시운·십이지신·풍수)에서 "
            "이 내용을 카드로 이미 봤어요. 같은 문장을 되풀이하지 말고, 탭 사이를 잇는 한 편의 이야기와 '그래서 지금 무엇을 할지'를 쓰세요.\n"
            "- 분량: 전체 1,000~1,200자를 넘기지 마세요. 아래 6개 섹션을 순서대로, 각 섹션은 `### 제목` 한 줄 뒤에 2~3문장(불릿 없이). 섹션의 첫 문장이 결론이에요.\n"
            "- 신강(身強)·신약(身弱)은 체력·체질이 아니라 일간 기운의 세기예요 — '기운이 강한 편/약한 편'으로 풀어 쓰세요. 이 '쓰는 법'의 지시 문장을 글에 옮겨 적지 마세요.\n"
            f"- 문체: 구어체 존댓말('~해요'). 상대는 '{who}'이라고 부르세요('님'을 두 번 붙이지 마세요).\n"
            "- 용어: 우리말을 먼저 쓰고 한자는 괄호 안에만 — 예 '물(水)', '겁재(劫財)', '을해(乙亥)'. 괄호 밖에 한자·중국어·일본어·영어를 쓰지 마세요. "
            "'合'·'月'처럼 한 글자만 한자로 바꾸는 것도 안 돼요.\n"
            "- 근거: 핵심 주장 뒤에 짧은 괄호 — 예 (겁재 해), (무재), (2028년 용신해). 몇 월이 좋은지 같은 달 이야기는 쓰지 마세요(택시 탭이 따로 보여 줘요).\n"
            "- 금지: 표(|), '사주에 따르면'·'데이터에 따르면'·'자료에 따르면' 같은 말, 자료에 없는 추측(질병 진단·단정 예언), 막연한 격려, 총평·요약 문장.\n"
            f"{hour_rule}"
            "\n"
            "## 섹션\n"
            f"1. `### 나는 어떤 사람` — 일간·기운 세기·오행의 많고 적음·십신 분포·신살로 타고난 성향, 강점 둘과 조심할 점 하나.{char_hint}\n"
            "2. `### 올해의 흐름` — 지난 대운·지금 대운·다음 대운을 잇고, 올해 세운·충합·삼재가 그 안의 어느 자리인지.\n"
            "3. `### 일과 재물` — 영역 점수 중 관록운·재물운·재능운·학문운과 어울리는 일·재성 유무로 일하는 방식과 돈 다루는 법.\n"
            "4. `### 사랑과 사람` — 인연운·도화 같은 신살·띠 관계(잘 맞는 띠·조심할 띠)로 사람을 대하는 법과 연애·결혼 이야기.\n"
            "5. `### 몸과 마음` — 오행의 많고 적음과 기운 세기로 컨디션·마음 습관을 잠·운동·쉼 같은 생활 습관으로 풀어요(병 이름은 쓰지 않아요).\n"
            "6. `### 개운법` — 용신 색·방향·일상 습관과 풍수 길방·배치에서 오늘 당장 할 수 있는 행동 둘셋.\n"
            "마지막 섹션(개운법)에서 글을 끝내고, 총평·요약·맺음말은 쓰지 마세요.\n"
            "\n"
            "## 형식 (이 뼈대를 그대로 채우세요 — 제목 줄 `### `을 빼먹지 마세요)\n"
            "### 나는 어떤 사람\n(2~3문장)\n\n### 올해의 흐름\n(2~3문장)\n\n### 일과 재물\n(2~3문장)\n\n"
            "### 사랑과 사람\n(2~3문장)\n\n### 몸과 마음\n(2~3문장)\n\n### 개운법\n(2~3문장)"
        )

    _TAIL = "\n\n(답은 처음부터 끝까지 한국어로만 쓰세요. 중국어 문장이 한 줄이라도 섞이면 안 돼요.)"

    # ── 자료 ─────────────────────────────────────────────────────────────
    def _basic(self, user: User, name: str, year: int, hour_unknown: bool) -> str:
        gender = "남성" if user.gender == Gender.MALE else "여성"
        birth = user.birth_dt.strftime("%Y-%m-%d") + (" (시간 미상)" if hour_unknown else user.birth_dt.strftime(" %H:%M"))
        return f"### 기본\n- 이름 {name or '(미입력)'} · {gender} · {birth} · 분석 연도 {year}년"

    def _palja(self, n: NatalResult, who: str) -> str:
        lines = ["### 사주팔자"]
        cols = []
        for i, g in enumerate(n.pillars):
            sk = n.pillar_stems_korean[i] if i < len(n.pillar_stems_korean) else ""
            bk = n.pillar_branches_korean[i] if i < len(n.pillar_branches_korean) else ""
            cols.append(f"{_PILLARS[i]} {sk}{bk}({g})" + (" ← 일간=나" if i == 2 else ""))
        lines.append(("- 세 기둥(三柱) · 시주 없음: " if n.hour_unknown else "- 네 기둥: ") + " · ".join(cols))
        elems = " ".join(f"{_ELEMENT_KOR[e]}{n.element_stats.get(e, 0)}" for e in ("木", "火", "土", "金", "水"))
        lines.append(f"- 일간 {n.day_stem_korean}({n.day_stem}) {n.day_stem_yin_yang} · 오행 분포 {elems}" + (f" · {n.pillar_summary}" if n.pillar_summary else ""))
        strength = f"- 기운 세기 {n.strength_pct:g}% {n.strength_label}"
        if n.narratives.get("strength_tip"):
            strength += f" — {n.narratives['strength_tip']}"
        lines.append(strength)
        c = n.character or {}
        if c.get("title"):
            jobs = "·".join(c.get("jobs") or [])
            lines.append(f"- 캐릭터 '{c['title']}'({c.get('name', '')}) — {c.get('line', '')}" + (f" · 어울리는 일 {jobs}" if jobs else ""))
        if n.sipsin:
            groups = []
            for label, role, members, missing in _SIPSIN_GROUPS:
                cnt = sum(1 for s in n.sipsin if s.get("sipsin_name") in members)
                if cnt == 0:
                    groups.append(f"{label} 0({missing})")
                else:
                    groups.append(f"{label} {cnt}" + ("(강세)" if cnt >= 3 else "") + f" {role}")
            line = "- 십신: " + " · ".join(groups)
            if n.narratives.get("sipsin_story"):
                line += f"\n  - {n.narratives['sipsin_story']}"
            lines.append(line)
        if n.sibi_unseong:
            lines.append("- 십이운성: " + " · ".join(
                f"{u.get('pillar', '')} {u.get('unseong_korean', '')}({u.get('unseong_name', '')})" for u in n.sibi_unseong
            ))
        if n.sinsal:
            seen: dict[str, str] = {}
            for ss in n.sinsal:
                seen.setdefault(ss.get("sinsal_korean", ""), "·".join(str(ss.get("meaning", "")).split("·")[:2]))
            lines.append("- 신살: " + " · ".join(f"{k}({v})" for k, v in seen.items() if k))
        else:
            lines.append("- 신살: 없음")
        gm = [_PILLARS[i] for i, g in enumerate(n.gongmang) if g and i < 4]
        if gm:
            lines.append(f"- 공망(空亡): {'·'.join(gm)} — 그 자리의 기운이 비어 담담한 태도가 좋은 자리")
        return "\n".join(lines)

    def _yongshin(self, n: NatalResult, p: PostnatalResult) -> str:
        yi, ki = n.yongshin_info, n.kisin_info
        yg, kg = n.yongshin_guide or {}, n.kisin_guide or {}
        lines = ["### 용신·삼재"]
        lines.append(
            f"- 용신 {yi.get('meaning', '')}({yi.get('name', '')}) — 색 {yg.get('color', '')} · 방향 {yg.get('direction', '')} · "
            f"일상 {yg.get('daily', '')} · 직업 {yg.get('career', '')}"
        )
        lines.append(f"- 기신 {ki.get('meaning', '')}({ki.get('name', '')}) — 피할 색 {kg.get('color', '')} · 방향 {kg.get('direction', '')}")
        if n.narratives.get("yongshin_tip"):
            lines.append(f"- {n.narratives['yongshin_tip'].replace('**', '')}")
        elif p.nearest_yongshin_year:
            lines.append(f"- 가까운 용신의 해 {p.nearest_yongshin_year}년")
        if p.samjae:
            try:
                birth_b, year_b = Branch[p.samjae.get("birth_branch", "")].korean, Branch[p.samjae.get("year_branch", "")].korean
            except KeyError:
                birth_b, year_b = p.samjae.get("birth_branch", ""), p.samjae.get("year_branch", "")
            lines.append(f"- 삼재: {p.year}년은 {p.samjae.get('type', '')} (생년 지지 {birth_b}({p.samjae.get('birth_branch', '')}) · 올해 {year_b}({p.samjae.get('year_branch', '')}))")
        else:
            lines.append(f"- 삼재: {p.year}년은 삼재 아님")
        return "\n".join(lines)

    def _siun(self, p: PostnatalResult) -> str:
        lines = ["### 시운(時運)"]
        if p.current_daeun:
            cd = p.current_daeun
            sips = " · ".join(f"{s.get('sipsin_korean', '')}({s.get('domain', '')})" for s in p.daeun_sipsin) if p.daeun_sipsin else ""
            lines.append(
                f"- 대운(10년): 현재 {kor_ganji(cd['ganji'])} {cd['start_age']}~{cd['end_age']}세 — {sips}"
                + (" · 용신 기운 있음" if p.yongshin_in_daeun else "")
            )
        if p.daeun:
            flow = " ".join(
                f"{kor_ganji(d['ganji'])}{d['start_age']}~{d['end_age']}{'★' if d.get('is_current') else ''}{'✨' if d.get('has_yongshin') else ''}"
                for d in p.daeun
            )
            lines.append(f"- 대운 흐름(★현재 ✨용신): {flow}")
            cur = next((i for i, d in enumerate(p.daeun) if d.get("is_current")), None)
            if cur is not None:
                def _d(i: int) -> str:
                    d = p.daeun[i]
                    return f"{kor_ganji(d['ganji'])}({d['start_age']}~{d['end_age']}세{', 용신' if d.get('has_yongshin') else ''})"
                trio = [f"지금 대운 {_d(cur)}"]
                if cur > 0:
                    trio.insert(0, f"지난 대운 {_d(cur - 1)}")
                if cur + 1 < len(p.daeun):
                    trio.append(f"다음 대운 {_d(cur + 1)}")
                lines.append("- " + " → ".join(trio))
        seun = f"- 올해 {p.year}년 {kor_ganji(p.seun_ganji)}: 천간 {p.seun_stem.get('sipsin_korean', '')} · 지지 {p.seun_branch.get('sipsin_korean', '')}"
        if p.seun_stem.get("timing_meaning"):
            seun += f" — {p.seun_stem['timing_meaning']}"
        seun += " · 용신 기운 " + ("있음" if p.yongshin_in_seun else "없음")
        lines.append(seun)
        texts: list[str] = []
        for label, items in (("세운 충", p.seun_clashes), ("세운 합", p.seun_combines), ("대운 충", p.daeun_clashes), ("대운 합", p.daeun_combines)):
            for c in items:
                t = c.get("narrative") or f"{c.get('incoming', '')}↔{c.get('target', '')}"
                if t and all(t not in x for x in texts):
                    texts.append(f"{label}: {t}")
        lines.append("- 충·합: " + (" / ".join(texts[:4]) if texts else "올해 특별한 충·합 없음"))
        if p.domain_scores:
            lines.append("- 영역 점수: " + " · ".join(
                f"{d} {v.get('score', '')}({_LEVEL_KOR.get(v.get('level', ''), v.get('level', ''))}, {str(v.get('reason', ''))[:30]})"
                for d, v in p.domain_scores.items()
            ))
        # 월운·택시(달별 좋은 시기)는 싣지 않는다 — LLM이 영역과 달을 뒤섞어 옮겨서 택시 탭에 맡김(2026-10-23, 사용자 지시)
        return "\n".join(lines)

    def _zodiac(self, n: NatalResult, p: PostnatalResult) -> str:
        z = n.zodiac
        if not z:
            return ""
        info = z.year_info
        lines = ["### 십이지신", f"- 띠: {info.korean}띠({z.year_branch}) — {info.keyword}"]
        groups: dict[str, list[str]] = {}
        for r in z.relations:
            if r.relation in ("나", "보통"):
                continue
            groups.setdefault(r.relation_label, []).append(f"{r.info.korean}({r.branch})")
        if groups:
            lines.append("- 띠 관계: " + " · ".join(f"{k} {'·'.join(v)}" for k, v in groups.items()))
        if p.year_zodiac_relations:
            lines.append("- 연도별: " + " · ".join(f"{r['year']} {r['kor']}띠 {r['relation']}" for r in p.year_zodiac_relations)
                         + (f" — {p.year_zodiac_narrative}" if p.year_zodiac_narrative else ""))
        return "\n".join(lines)

    def _fengshui(self, n: NatalResult) -> str:
        f = n.feng_shui
        if not f:
            return ""
        lucky = " · ".join(f"{d.kind_korean} {d.direction}({d.meaning})" for d in f.lucky_directions)
        unlucky = "·".join(d.direction for d in f.unlucky_directions)
        lines = [
            "### 풍수",
            f"- 본명괘 {f.trigram.reading}({f.trigram.char})·{f.trigram.element_korean}({f.trigram.element}) {f.group} — 길방 {lucky} / 흉방 {unlucky}",
        ]
        tips = [t.label for t in f.interior_tips if t.label]
        if tips:
            lines.append("- 배치: " + " · ".join(tips))
        return "\n".join(lines)
