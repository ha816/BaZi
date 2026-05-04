from kkachi.domain.interpretation import (
    InterpretBlock,
    NatalResult,
    PostnatalResult,
)
from kkachi.domain.user import Gender, User


_PILLAR_LABELS = ["년주(年柱)", "월주(月柱)", "일주(日柱)", "시주(時柱)"]
_GUIDE_KEYS = [("color", "색상"), ("direction", "방향"), ("career", "직업"), ("daily", "일상")]

_SIPSIN_GROUPS: list[tuple[str, str, list[str]]] = [
    ("比劫(비겁)", "자아·동료·경쟁", ["比肩", "劫財"]),
    ("食傷(식상)", "표현·재능·자유", ["食神", "傷官"]),
    ("財星(재성)", "재물·결과·확장", ["偏財", "正財"]),
    ("官星(관성)", "직장·명예·규율", ["偏官", "正官"]),
    ("印星(인성)", "학문·후원·정신", ["偏印", "正印"]),
]

_SIPSIN_MISSING_NOTE: dict[str, str] = {
    "比劫(비겁)": "무비겁(無比劫) — 동료·경쟁 관계 약함, 자기 정체성 흔들리기 쉬움",
    "食傷(식상)": "무식상(無食傷) — 자기표현·재능 출구 부족, 답답함 누적되기 쉬움",
    "財星(재성)": "무재(無財) — 직접 돈벌이보다 조직 안 인정으로 풀어가는 게 유리",
    "官星(관성)": "무관(無官) — 규율·자리 욕구 약함, 자유로운 행보가 자연스러움",
    "印星(인성)": "무인성(無印星) — 윗사람 도움·정신적 안식 부족, 멘토·학습으로 보완 필요",
}


class LlmReportBuilder:
    """NatalResult + PostnatalResult를 외부 LLM 입력용 markdown 레포트로 변환한다."""

    def build(
        self, natal: NatalResult, postnatal: PostnatalResult, user: User, name: str = ""
    ) -> str:
        sections = [
            self._intro(),
            self._user_section(user, name, postnatal.year),
            self._manseryeok_section(natal),
            self._yongshin_samjae_section(natal, postnatal),
            self._siun_section(postnatal),
            self._zodiac_section(natal, postnatal),
            self._fengshui_section(natal),
        ]
        return "\n\n".join(s for s in sections if s)

    def _intro(self) -> str:
        return (
            "# 사주 분석 레포트\n"
            "\n"
            "이 레포트는 사주명리학 룰 엔진이 산출한 데이터와 한국어 풀이를 정리한 것입니다. "
            "종합조언은 제외했고, **만세력·용신·삼재·시운·십이지신·풍수** 5개 영역의 핵심을 담았습니다.\n"
            "\n"
            "## 해석 가이드\n"
            "\n"
            "이 데이터를 바탕으로 사용자에게 **자연스러운 한국어로 통합 해석**을 제공해주세요.\n"
            "\n"
            "### 문체 규칙 (반드시 따를 것)\n"
            "\n"
            "- **각 섹션은 핵심 한 줄로 시작**: `👉 \"...\"` 형식의 굵은 결론 먼저, 근거는 뒤에\n"
            "- **짧은 블록 유지**: 연속 3줄 넘는 문단 금지. 문단 대신 짧은 문장 + 불릿 조합 사용\n"
            "- **근거 병기**: 핵심 주장 뒤에 반드시 `(정관 강함)`, `(무재 구조)` 같은 근거 괄호 추가\n"
            "- **✔/❌ 가이드**: 해도 좋은 것 / 하지 말아야 할 것 구분에 사용\n"
            "- **전문용어 금지**: 식상·관성 같은 용어는 '표현력', '직장운' 같이 먼저 쓰고 `(식상)` 괄호 병기\n"
            "- **구어체 존댓말**: '~입니다', '~해요' 혼용 가능. '~하십시오'는 1회 이하\n"
            "\n"
            "### 다뤄야 할 8개 섹션\n"
            "\n"
            "1. **본질·자아** — 일간·일주·십이운성·음양을 묶어 '이 사람이 어떤 사람인지' 한 단락\n"
            "2. **에너지 분석** — 오행 과다·결핍 + 십신 카테고리 결핍(無財·無印 등)이 만드는 삶의 패턴\n"
            "3. **신살의 힘** — 보유 신살 콤보의 강점·주의점. 없으면 생략\n"
            "4. **올해 핵심 전략** — 세운+대운 십신, 충·합, 영역점수를 통합한 전략 방향\n"
            "5. **재물·성취** — 재성 유무 + 영역점수 + 가까운 용신해를 쓴 실질 조언\n"
            "6. **월별 상세 가이드** — 다가올 6개월 월운에서 충·용신·전환점만 짚기 (표 형식 가능)\n"
            "7. **건강·심리** — 오행 과다·결핍의 신체·심리 영향 + 실천 처방 1~2가지\n"
            "8. **풍수·개운법** — 길/흉 방위 + 결핍 오행 보완 + 추천 인맥 띠\n"
            "\n"
            "마지막에 **메타포 한 줄 총평**: 이 사람의 사주를 비유로 압축 + 지금 당장 할 수 있는 행동 하나.\n"
            "막연한 격려 금지. 데이터에 근거한 구체적 지침으로 마무리하세요."
        )

    def _user_section(self, user: User, name: str, year: int) -> str:
        gender = "남성" if user.gender == Gender.MALE else "여성"
        birth = user.birth_dt.strftime("%Y-%m-%d %H:%M")
        return (
            "## 기본 정보\n"
            f"- 이름: {name or '(미입력)'}\n"
            f"- 성별: {gender}\n"
            f"- 생년월일시: {birth}\n"
            f"- 분석 연도: {year}년"
        )

    def _manseryeok_section(self, n: NatalResult) -> str:
        lines = ["## 만세력(萬歲曆) — 사주팔자 8글자", ""]
        lines.append("### 4기둥(四柱)")
        for i, p in enumerate(n.pillars):
            stem, branch = (p[0], p[1]) if len(p) >= 2 else ("", "")
            stem_kor = n.pillar_stems_korean[i] if i < len(n.pillar_stems_korean) else ""
            branch_kor = n.pillar_branches_korean[i] if i < len(n.pillar_branches_korean) else ""
            stem_el = n.pillar_elements[i].get("stem_element", "") if i < len(n.pillar_elements) else ""
            branch_el = n.pillar_elements[i].get("branch_element", "") if i < len(n.pillar_elements) else ""
            day_marker = " ← 일간(나)" if i == 2 else ""
            lines.append(
                f"- {_PILLAR_LABELS[i]}: {p}({stem_kor}{branch_kor}) — 천간 {stem}({stem_el}) / 지지 {branch}({branch_el}){day_marker}"
            )
        lines.append(f"- 일간 음양: {n.day_stem_yin_yang}")

        lines.extend(["", "### 오행(五行) 분포"])
        for el in ("木", "火", "土", "金", "水"):
            lines.append(f"- {el}: {n.element_stats.get(el, 0)}개")
        if n.pillar_summary:
            lines.append(f"\n> {n.pillar_summary}")

        if n.sipsin:
            lines.extend(["", "### 십신(十神)"])
            for s in n.sipsin:
                lines.append(self._format_sipsin_entry(s))
            if n.narratives.get("sipsin_story"):
                lines.append(f"\n> {n.narratives['sipsin_story']}")

            lines.extend(["", "### 십신 카테고리 분포 (5그룹)"])
            for label, role, members in _SIPSIN_GROUPS:
                count = sum(1 for s in n.sipsin if s.get("sipsin_name") in members)
                if count == 0:
                    note = _SIPSIN_MISSING_NOTE.get(label, "")
                    lines.append(f"- {label}: 0개 ⚠ {note}")
                else:
                    intensity = " (강세)" if count >= 3 else (" (보통)" if count == 2 else "")
                    lines.append(f"- {label}: {count}개 — {role}{intensity}")

        if n.sibi_unseong:
            lines.extend(["", "### 십이운성(十二運星)"])
            for u in n.sibi_unseong:
                lines.append(
                    f"- {u.get('pillar','')}: {u.get('unseong_korean','')}({u.get('unseong_name','')})"
                    f" — {u.get('meaning','')} (강도: {u.get('strength','')})"
                )
            if n.narratives.get("unseong_story"):
                lines.append(f"\n> {n.narratives['unseong_story']}")

        if n.sinsal:
            lines.extend(["", "### 신살(神殺)"])
            for ss in n.sinsal:
                lines.append(f"- {ss.get('branch','')}: {ss.get('sinsal_korean','')} — {ss.get('meaning','')}")
            if n.narratives.get("sinsal_narrative"):
                lines.append(f"\n> {n.narratives['sinsal_narrative']}")

        if n.jizan_gan:
            lines.extend(["", "### 지장간(地藏干)"])
            for i, group in enumerate(n.jizan_gan):
                if not group:
                    continue
                items = [
                    f"{g.get('stem','')}({g.get('stem_korean','')}, {g.get('weight',0)}일, "
                    f"{g.get('sipsin_name','')}, {g.get('role','')})"
                    for g in group
                ]
                lines.append(f"- {_PILLAR_LABELS[i]}: {', '.join(items)}")

        if any(n.gongmang):
            lines.extend(["", "### 공망(空亡)"])
            gongmang_pillars = [_PILLAR_LABELS[i] for i, g in enumerate(n.gongmang) if g]
            lines.append(f"- 공망인 자리: {', '.join(gongmang_pillars)}")

        if n.sibi_sinsal:
            lines.extend(["", "### 십이신살(十二神殺)"])
            pairs = [
                f"{_PILLAR_LABELS[i]}: {n.sibi_sinsal[i]}"
                for i in range(min(4, len(n.sibi_sinsal)))
                if n.sibi_sinsal[i]
            ]
            if pairs:
                lines.append("- " + " / ".join(pairs))

        if n.personality:
            lines.extend(["", "### 성격 분석"])
            lines.extend(self._blocks_to_lines(n.personality))

        if n.element_balance:
            lines.extend(["", "### 오행 균형 풀이"])
            lines.extend(self._blocks_to_lines(n.element_balance))

        extra = []
        if n.narratives.get("pillar_tip"):
            extra.append(f"> 사주팔자 풀이: {n.narratives['pillar_tip']}")
        if n.narratives.get("ohaeng_tip"):
            extra.append(f"> 오행 풀이: {n.narratives['ohaeng_tip']}")
        if extra:
            lines.append("")
            lines.extend(extra)

        return "\n".join(lines)

    def _yongshin_samjae_section(self, n: NatalResult, p: PostnatalResult) -> str:
        lines = ["## 용신·삼재(用神·三災)", ""]
        lines.append("### 신강·신약(身強·身弱)")
        lines.append(f"- {n.strength_label} (값: {n.strength_value:+d})")
        if n.narratives.get("strength_tip"):
            lines.append(f"> {n.narratives['strength_tip']}")

        lines.extend(["", "### 용신·기신(用神·忌神)"])
        lines.append(
            f"- 용신(用神): {n.yongshin_info.get('name','')}({n.yongshin_info.get('meaning','')})"
            " — 균형을 잡아주는 도움 오행"
        )
        lines.append(
            f"- 기신(忌神): {n.kisin_info.get('name','')}({n.kisin_info.get('meaning','')})"
            " — 멀리해야 할 오행"
        )
        if n.narratives.get("yongshin_tip"):
            lines.append(f"> {n.narratives['yongshin_tip']}")

        if n.yongshin_guide:
            lines.extend(["", "### 용신 활용 가이드"])
            for k, label in _GUIDE_KEYS:
                v = n.yongshin_guide.get(k, "")
                if v:
                    lines.append(f"- {label}: {v}")
        if n.kisin_guide:
            lines.extend(["", "### 기신 회피 가이드"])
            for k, label in _GUIDE_KEYS:
                v = n.kisin_guide.get(k, "")
                if v:
                    lines.append(f"- {label}: {v}")

        if p.yongshin:
            lines.extend(["", "### 용신 풀이"])
            lines.extend(self._blocks_to_lines(p.yongshin))

        lines.extend(["", "### 삼재(三災) — 12년 주기 액운기"])
        if p.samjae:
            lines.append(
                f"- 현재 상태: {p.samjae.get('type','')} 흐름"
                f" (생년 지지 {p.samjae.get('birth_branch','')}, 올해 지지 {p.samjae.get('year_branch','')})"
            )
        else:
            lines.append("- 올해는 삼재 시기가 아닙니다.")
        if p.samjae_fortune:
            lines.append("")
            lines.extend(self._blocks_to_lines(p.samjae_fortune))

        return "\n".join(lines)

    def _siun_section(self, p: PostnatalResult) -> str:
        lines = ["## 시운(時運) — 대운·세운·월운", ""]

        lines.append("### 현재 대운(大運)")
        if p.current_daeun:
            cd = p.current_daeun
            tag = " — 용신 기운 있음" if p.yongshin_in_daeun else ""
            lines.append(f"- {cd['ganji']} ({cd['start_age']}세 ~ {cd['end_age']}세){tag}")
        else:
            lines.append("- 현재 대운 정보 없음")

        if p.daeun_sipsin:
            lines.extend(["", "### 대운 천간·지지 십신"])
            for s in p.daeun_sipsin:
                lines.append(self._format_sipsin_entry(s))

        if p.daeun:
            lines.extend(["", "### 대운 전체 흐름"])
            for d in p.daeun:
                marker = " ★현재" if d.get("is_current") else ""
                yong = " ✨용신" if d.get("has_yongshin") else ""
                lines.append(f"- {d['ganji']} ({d['start_age']}~{d['end_age']}세){marker}{yong}")

        lines.extend(["", f"### {p.year}년 세운(歲運)"])
        seun_tag = " — 용신 기운 있음" if p.yongshin_in_seun else ""
        lines.append(f"- 세운 간지: {p.seun_ganji}{seun_tag}")
        lines.append("- 천간: " + self._format_sipsin_entry(p.seun_stem, prefix=False))
        lines.append("- 지지: " + self._format_sipsin_entry(p.seun_branch, prefix=False))

        clashes_combines = [
            ("세운 충", p.seun_clashes),
            ("세운 합", p.seun_combines),
            ("대운 충", p.daeun_clashes),
            ("대운 합", p.daeun_combines),
        ]
        if any(items for _, items in clashes_combines):
            lines.extend(["", "### 충(衝)·합(合)"])
            narrative_to_labels: dict[str, list[str]] = {}
            for label, items in clashes_combines:
                for c in items:
                    text = c.get("narrative") or f"{c.get('incoming','')}↔{c.get('target','')}"
                    narrative_to_labels.setdefault(text, []).append(label)
            for text, labels in narrative_to_labels.items():
                lines.append(f"- {' / '.join(labels)}: {text}")

        if p.upcoming_months:
            lines.extend(["", "### 다가올 6개월 월운(月運)"])
            for m in p.upcoming_months:
                marker = " ✨용신" if m.get("matches_yongshin") else ""
                lines.append(
                    f"- {m['year']}년 {m['month']}월 {m['ganji']} "
                    f"(천간 {m.get('stem_element','')} / 지지 {m.get('branch_element','')}){marker}"
                )

        if p.domain_scores:
            lines.extend(["", "### 영역별 운세 점수"])
            for domain, score in p.domain_scores.items():
                lines.append(
                    f"- {domain}: {score.get('score','')}점 ({score.get('level','')})"
                    f" — {score.get('reason','')}"
                )

        if p.nearest_yongshin_year:
            lines.extend(["", f"### 가까운 용신의 해\n- {p.nearest_yongshin_year}년"])

        for title, blocks in [
            ("올해 운세 해석", p.annual_fortune),
            ("영역별 운세 해석", p.fortune_by_domain),
            ("대운 흐름 해석", p.major_fortune),
            ("인간관계 해석", p.relationships),
        ]:
            if blocks:
                lines.extend(["", f"### {title}"])
                lines.extend(self._blocks_to_lines(blocks))

        return "\n".join(lines)

    def _zodiac_section(self, n: NatalResult, p: PostnatalResult) -> str:
        z = n.zodiac
        if not z:
            return ""
        lines = ["## 십이지신(十二支神)", ""]

        info = z.year_info
        lines.append("### 년주(年柱) 띠")
        lines.append(f"- 띠: {info.korean}({z.year_branch}) — 키워드: {info.keyword}")
        if info.traits:
            lines.append(f"- 기질: {', '.join(info.traits)}")
        if info.strength:
            lines.append(f"- 강점: {info.strength}")
        if info.weakness:
            lines.append(f"- 약점: {info.weakness}")

        lines.extend(["", "### 4기둥 띠"])
        for pz in z.pillar_zodiacs:
            mark = " ← 년주(사회적 자아)" if pz.is_year else ""
            lines.append(
                f"- {pz.pillar_label}: {pz.info.korean}({pz.branch}) — 역할: {pz.role},"
                f" 기운: {pz.info.keyword}{mark}"
            )

        if z.pillar_pairs:
            lines.extend(["", "### 4기둥 충·합 관계"])
            for pp in z.pillar_pairs:
                lines.append(
                    f"- {pp.pillar_label_a} {pp.zodiac_a}({pp.branch_a}) ↔ "
                    f"{pp.pillar_label_b} {pp.zodiac_b}({pp.branch_b}): {pp.relation_label}"
                )
        if z.pillar_tip:
            lines.append(f"\n> {z.pillar_tip}")

        rel_groups: dict[str, list[str]] = {}
        for r in z.relations:
            if r.relation in ("나", "보통"):
                continue
            rel_groups.setdefault(r.relation_label, []).append(f"{r.info.korean}({r.branch})")
        if rel_groups:
            lines.extend(["", "### 12띠 충합 분류 (년주 기준)"])
            for label, items in rel_groups.items():
                lines.append(f"- {label}: {', '.join(items)}")

        if z.samhap:
            lines.extend(["", "### 년주 삼합 그룹"])
            lines.append(
                f"- {z.samhap.label}: {', '.join(z.samhap.members)}"
                f" (4기둥 안 포함: {'예' if z.samhap.in_pillars else '아니오'})"
            )

        if p.year_zodiac_relations:
            lines.extend(["", "### 연도별 띠 흐름 (4년)"])
            for r in p.year_zodiac_relations:
                lines.append(
                    f"- {r['year']}년 {r['kor']}띠({r['branch']}, {r['ganji']}): {r['relation']}"
                    f" — {r['desc']}"
                )
            if p.year_zodiac_narrative:
                lines.append(f"\n> {p.year_zodiac_narrative}")

        return "\n".join(lines)

    def _fengshui_section(self, n: NatalResult) -> str:
        f = n.feng_shui
        if not f:
            return ""
        lines = ["## 풍수(風水) — 본명괘 기반", ""]
        lines.append("### 본명괘(本命卦)")
        lines.append(f"- 괘 번호: {f.kua_number}")
        lines.append(
            f"- 8괘: {f.trigram.char}({f.trigram.reading}) — "
            f"오행 {f.trigram.element_korean}({f.trigram.element})"
        )
        if f.trigram.description:
            lines.append(f"- 의미: {f.trigram.description}")
        group_kor = "동사명" if f.is_eastern else "서사명"
        lines.append(f"- 그룹: {f.group} ({group_kor})")

        if f.lucky_directions:
            lines.extend(["", "### 길방(吉方)"])
            for d in f.lucky_directions:
                lines.append(f"- {d.kind_korean}({d.kind_han}): {d.direction} — {d.meaning}")

        if f.unlucky_directions:
            lines.extend(["", "### 흉방(凶方)"])
            lines.append(f"- {', '.join(f.unlucky_directions)}")
            if f.avoid_advice:
                lines.append(f"> {f.avoid_advice}")

        if f.interior_intro or f.interior_tips:
            lines.extend(["", "### 인테리어 팁"])
            if f.interior_intro:
                lines.append(f"> {f.interior_intro}")
            for tip in f.interior_tips:
                if tip.label:
                    lines.append(f"- {tip.label}: {tip.text}")
                else:
                    lines.append(f"- {tip.text}")

        return "\n".join(lines)

    @staticmethod
    def _format_sipsin_entry(s: dict, prefix: bool = True) -> str:
        char = s.get("char", "")
        name = s.get("sipsin_name", "")
        kor = s.get("sipsin_korean", "")
        domain = s.get("domain", "")
        head = f"{char} → {kor}({name})" if kor else f"{char} → {name}"
        suffix = f" — {domain}" if domain else ""
        return f"- {head}{suffix}" if prefix else f"{head}{suffix}"

    @staticmethod
    def _blocks_to_lines(blocks: list[InterpretBlock]) -> list[str]:
        out: list[str] = []
        for b in blocks:
            if b.category:
                out.append(f"**[{b.category}]**")
            if b.description:
                out.append(b.description)
            for tip in b.tips:
                if tip.label:
                    out.append(f"- {tip.label}: {tip.text}")
                else:
                    out.append(f"- {tip.text}")
            out.append("")
        return out
