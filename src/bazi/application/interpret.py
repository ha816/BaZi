"""종합 해석: NatalInfo + PostnatalInfo를 받아 구조화된 해석을 생성한다."""

from __future__ import annotations

from dataclasses import dataclass, field

from bazi.domain.ganji import Oheng, Sipsin
from bazi.domain.natal import NatalInfo, PostnatalInfo


# ── 영역별 십신 매핑 ──

_DOMAIN_MAP: dict[str, list[Sipsin]] = {
    "재물운": [Sipsin.偏財, Sipsin.正財],
    "직장·사회운": [Sipsin.偏官, Sipsin.正官],
    "학업·자격운": [Sipsin.偏印, Sipsin.正印],
    "표현·건강운": [Sipsin.食神, Sipsin.傷官],
    "대인관계": [Sipsin.比肩, Sipsin.劫財],
}

_SIPSIN_DETAIL: dict[Sipsin, str] = {
    Sipsin.比肩: "동료·경쟁자가 많아지며 독립심이 강해집니다.",
    Sipsin.劫財: "경쟁이 치열해지고 재물 관리에 주의가 필요합니다.",
    Sipsin.食神: "재능 발휘와 표현력이 좋아지며 식복이 따릅니다.",
    Sipsin.傷官: "창의력이 높아지나 대인관계에서 마찰이 생길 수 있습니다.",
    Sipsin.偏財: "투자·사업 기회가 오며 유동적 재물 운이 활발합니다.",
    Sipsin.正財: "안정적 수입이 기대되며 저축·근면한 재물 운입니다.",
    Sipsin.偏官: "변화와 도전이 찾아오며 권력·승진 기회가 있습니다.",
    Sipsin.正官: "직장에서 인정받고 명예가 올라가는 시기입니다.",
    Sipsin.偏印: "영감과 아이디어가 풍부하나 안정감은 떨어질 수 있습니다.",
    Sipsin.正印: "학업·자격 취득에 유리하고 윗사람의 도움이 있습니다.",
}

# ── 오행 성질 ──

_OHENG_EXCESS: dict[Oheng, str] = {
    Oheng.木: "추진력이 과해 무리하기 쉽고, 간·담 건강에 유의하세요.",
    Oheng.火: "감정 기복이 크고 성급해질 수 있으며, 심장·혈압에 유의하세요.",
    Oheng.土: "고집이 세고 변화를 꺼리게 되며, 소화기 건강에 유의하세요.",
    Oheng.金: "지나치게 냉철해 대인관계가 경직될 수 있으며, 폐·호흡기에 유의하세요.",
    Oheng.水: "우유부단해지기 쉽고 불안감이 커질 수 있으며, 신장·방광에 유의하세요.",
}

_OHENG_LACK: dict[Oheng, str] = {
    Oheng.木: "추진력과 결단력이 부족할 수 있습니다.",
    Oheng.火: "열정과 적극성이 부족할 수 있습니다.",
    Oheng.土: "안정감과 신뢰감이 부족할 수 있습니다.",
    Oheng.金: "결단력과 실행력이 부족할 수 있습니다.",
    Oheng.水: "지혜와 유연성이 부족할 수 있습니다.",
}


@dataclass
class Interpretation:
    """구조화된 종합 해석 결과."""

    personality: list[str] = field(default_factory=list)
    element_balance: list[str] = field(default_factory=list)
    yongshin: list[str] = field(default_factory=list)
    fortune_by_domain: list[str] = field(default_factory=list)
    annual_fortune: list[str] = field(default_factory=list)
    major_fortune: list[str] = field(default_factory=list)
    relationships: list[str] = field(default_factory=list)
    advice: list[str] = field(default_factory=list)


class Interpreter:
    """종합 해석기 — 선천 + 후천 데이터를 받아 구조화된 해석을 반환한다."""

    natal: NatalInfo
    postnatal: PostnatalInfo

    def __call__(self, natal: NatalInfo, postnatal: PostnatalInfo) -> Interpretation:
        self.natal = natal
        self.postnatal = postnatal
        return Interpretation(
            personality=self._interpret_personality(),
            element_balance=self._interpret_element_balance(),
            yongshin=self._interpret_yongshin(),
            fortune_by_domain=self._interpret_fortune_by_domain(),
            annual_fortune=self._interpret_annual_fortune(),
            major_fortune=self._interpret_major_fortune(),
            relationships=self._interpret_relationships(),
            advice=self._interpret_advice(),
        )

    # ── 1. 성격·기질 ──

    def _interpret_personality(self) -> list[str]:
        me = self.natal.my_main_element
        lines = [f"일간이 {me.name}({me.meaning})인 사람은 {me.personality}"]

        if self.natal.sibi_unseong:
            _, day_unseong = self.natal.sibi_unseong[2]
            lines.append(
                f"일주 십이운성이 {day_unseong.name}({day_unseong.meaning})으로, "
                f"이 에너지가 기본 성향에 영향을 줍니다."
            )

        for branch, s in self.natal.sinsal:
            lines.append(f"{s.korean}({branch.name}): {s.meaning}.")

        return lines

    # ── 2. 오행 밸런스 ──

    def _interpret_element_balance(self) -> list[str]:
        stats = self.natal.element_stats
        lines = []

        excess = [o for o, c in stats.items() if c >= 3]
        lacking = [o for o, c in stats.items() if c == 0]

        if excess:
            for o in excess:
                lines.append(f"{o.name}({o.meaning})이 {stats[o]}개로 과다합니다. {_OHENG_EXCESS[o]}")
        if lacking:
            for o in lacking:
                lines.append(f"{o.name}({o.meaning})이 없습니다. {_OHENG_LACK[o]}")

        if not excess and not lacking:
            lines.append("오행이 비교적 균형 잡혀 있어 안정적인 구성입니다.")

        # 신강/신약 해석
        s = self.natal.strength
        if s > 0:
            lines.append(f"신강(+{s})으로 에너지가 넘치므로, 이를 발산하는 활동이 좋습니다.")
        elif s < 0:
            lines.append(f"신약({s})으로 에너지가 부족하므로, 도움을 주는 환경이 중요합니다.")
        else:
            lines.append("중화(0)로 균형이 잡혀 있어 안정적입니다.")

        return lines

    # ── 3. 용신 분석 ──

    def _interpret_yongshin(self) -> list[str]:
        y = self.natal.yongshin
        me = self.natal.my_main_element
        s = self.natal.strength
        lines = []

        if s > 0:
            lines.append(
                f"신강하여 넘치는 {me.name}의 기운을 빼주는 "
                f"{y.name}({y.meaning})이 용신입니다."
            )
        else:
            lines.append(
                f"신약하여 부족한 {me.name}의 기운을 보충해주는 "
                f"{y.name}({y.meaning})이 용신입니다."
            )

        # 세운/대운 용신 충족
        in_seun = self.postnatal.yongshin_in_seun
        in_daeun = self.postnatal.yongshin_in_daeun
        year = self.postnatal.year

        if in_seun and in_daeun:
            lines.append(f"{year}년은 세운과 대운 모두 용신({y.name})이 작용하여 매우 유리한 해입니다.")
        elif in_seun:
            lines.append(f"{year}년 세운에 용신({y.name})이 있어 올해의 기회를 잘 살릴 수 있습니다.")
        elif in_daeun:
            lines.append(
                f"대운에 용신({y.name})이 있어 큰 흐름은 좋으나, "
                f"{year}년 세운에는 용신이 부재합니다."
            )
        else:
            lines.append(
                f"{year}년은 세운과 대운 모두 용신({y.name})이 없어 "
                f"신중한 판단이 필요합니다."
            )

        return lines

    # ── 4. 영역별 운세 ──

    def _interpret_fortune_by_domain(self) -> list[str]:
        lines = []

        # 세운 십신으로 올해 영역 판단
        seun_sipsins = [self.postnatal.seun_stem[1], self.postnatal.seun_branch[1]]
        # 대운 십신도 반영
        daeun_sipsins = [s for _, s in self.postnatal.daeun_sipsin]

        for domain_name, domain_sipsins in _DOMAIN_MAP.items():
            seun_match = [s for s in seun_sipsins if s in domain_sipsins]
            daeun_match = [s for s in daeun_sipsins if s in domain_sipsins]

            if seun_match and daeun_match:
                s = seun_match[0]
                lines.append(
                    f"[{domain_name}] 세운과 대운 모두 영향 — "
                    f"{s.name}: {_SIPSIN_DETAIL[s]} 올해 특히 강하게 작용합니다."
                )
            elif seun_match:
                s = seun_match[0]
                lines.append(f"[{domain_name}] 올해의 키워드 — {s.name}: {_SIPSIN_DETAIL[s]}")
            elif daeun_match:
                s = daeun_match[0]
                lines.append(f"[{domain_name}] 대운의 흐름 — {s.name}: {_SIPSIN_DETAIL[s]}")

        return lines

    # ── 5. 세운 (올해 운세) ──

    def _interpret_annual_fortune(self) -> list[str]:
        lines = []
        year = self.postnatal.year

        stem_char, stem_sipsin = self.postnatal.seun_stem
        branch_char, branch_sipsin = self.postnatal.seun_branch

        lines.append(
            f"{year}년 천간 {stem_char}({stem_sipsin.name})은 "
            f"{stem_sipsin.domain} 방면에 변화를 가져옵니다."
        )
        lines.append(
            f"{year}년 지지 {branch_char}({branch_sipsin.name})은 "
            f"{branch_sipsin.domain} 방면의 환경을 만듭니다."
        )

        return lines

    # ── 6. 대운 흐름 ──

    def _interpret_major_fortune(self) -> list[str]:
        lines = []
        d = self.postnatal.current_daeun
        if not d:
            return lines

        lines.append(f"현재 대운 {d.ganji}({d.start_age}~{d.end_age}세):")

        for char, s in self.postnatal.daeun_sipsin:
            lines.append(f"  {char}({s.name}): {_SIPSIN_DETAIL[s]}")

        # 대운 흐름 시계열
        daeun_list = self.postnatal.daeun
        current_idx = next(
            (i for i, dp in enumerate(daeun_list) if dp.ganji == d.ganji), None
        )
        if current_idx is not None:
            if current_idx > 0:
                prev = daeun_list[current_idx - 1]
                lines.append(f"  이전 대운 {prev.ganji}({prev.start_age}~{prev.end_age}세)에서 전환된 흐름입니다.")
            if current_idx < len(daeun_list) - 1:
                nxt = daeun_list[current_idx + 1]
                lines.append(f"  다음 대운 {nxt.ganji}({nxt.start_age}~{nxt.end_age}세)로의 전환을 준비하세요.")

        return lines

    # ── 7. 충·합 관계 ──

    def _interpret_relationships(self) -> list[str]:
        lines = []

        for clash in self.postnatal.seun_clashes:
            lines.append(
                f"세운 {clash['incoming']}이(가) {clash['pillar']} "
                f"{clash['target']}과(와) 충(衝)합니다. 변동·갈등에 유의하세요."
            )
        for clash in self.postnatal.daeun_clashes:
            lines.append(
                f"대운 {clash['incoming']}이(가) {clash['pillar']} "
                f"{clash['target']}과(와) 충(衝)합니다. 이 시기 큰 변화가 있을 수 있습니다."
            )
        for combine in self.postnatal.seun_combines:
            lines.append(
                f"세운 {combine['incoming']}이(가) {combine['pillar']} "
                f"{combine['target']}과(와) {combine['type']}합니다. "
                f"새로운 인연·협력이 기대됩니다."
            )
        for combine in self.postnatal.daeun_combines:
            lines.append(
                f"대운 {combine['incoming']}이(가) {combine['pillar']} "
                f"{combine['target']}과(와) {combine['type']}합니다. "
                f"장기적 관계·변화가 예상됩니다."
            )

        return lines

    # ── 8. 종합 조언 ──

    def _interpret_advice(self) -> list[str]:
        lines = []
        y = self.natal.yongshin
        in_seun = self.postnatal.yongshin_in_seun
        in_daeun = self.postnatal.yongshin_in_daeun
        has_clash = bool(self.postnatal.seun_clashes or self.postnatal.daeun_clashes)
        has_combine = bool(self.postnatal.seun_combines or self.postnatal.daeun_combines)

        # 용신 + 충합 교차 분석
        if in_seun and in_daeun and not has_clash:
            lines.append("용신이 세운·대운 모두에 작용하고 충이 없어 적극적으로 추진하기 좋은 해입니다.")
        elif in_seun and has_clash:
            lines.append(
                "올해 용신이 있어 기회는 오지만, 충이 함께 있어 "
                "갈등 속 기회를 잡는 지혜가 필요합니다."
            )
        elif in_daeun and not in_seun and has_combine:
            lines.append(
                "대운의 큰 흐름은 좋고 합의 에너지가 있으나, "
                "올해 세운에 용신이 없어 내실을 다지는 데 집중하세요."
            )
        elif not in_seun and not in_daeun and has_clash:
            lines.append(
                "용신이 부재하고 충까지 있어 보수적으로 접근하되, "
                "큰 결정은 신중히 내리세요."
            )
        elif not in_seun and not in_daeun:
            lines.append(
                "용신이 부재한 시기이므로 무리한 확장보다는 "
                "내면을 가꾸고 실력을 쌓는 데 집중하세요."
            )

        # 용신 오행 활용 조언
        _YONGSHIN_ADVICE: dict[Oheng, str] = {
            Oheng.木: "나무와 관련된 활동(등산, 독서, 새로운 시작)이 도움이 됩니다.",
            Oheng.火: "열정적인 활동(운동, 발표, 네트워킹)이 도움이 됩니다.",
            Oheng.土: "안정적인 활동(부동산, 저축, 신뢰 구축)이 도움이 됩니다.",
            Oheng.金: "절제와 정리(재정 관리, 결단, 마무리)가 도움이 됩니다.",
            Oheng.水: "유연한 활동(여행, 학습, 인맥 확장)이 도움이 됩니다.",
        }
        lines.append(f"용신 {y.name}을 보강하려면: {_YONGSHIN_ADVICE[y]}")

        return lines