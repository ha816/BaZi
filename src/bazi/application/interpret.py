from __future__ import annotations

from dataclasses import dataclass, field

from bazi.domain.ganji import Oheng, Sipsin
from bazi.domain.natal import NatalInfo, PostnatalInfo

DOMAIN_MAP: dict[str, list[Sipsin]] = {
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

_MODERN_CAREER: dict[Sipsin, str] = {
    Sipsin.比肩: "1인 기업, 프리랜서, 독립 컨설턴트 등 자율성이 높은 일이 잘 맞습니다.",
    Sipsin.劫財: "공동 창업이나 파트너십보다는 단독 의사결정이 가능한 포지션이 유리합니다.",
    Sipsin.食神: "콘텐츠 크리에이터, 요리·외식업, 강연·교육 등 표현력을 살리는 분야가 좋습니다.",
    Sipsin.傷官: "스타트업, 예술·디자인, 기획·마케팅 등 틀을 깨는 창의적 직종에서 두각을 나타냅니다.",
    Sipsin.偏財: "부동산 투기보다는 성장주·벤처투자·사업 확장 등 공격적인 재테크가 맞는 시기입니다.",
    Sipsin.正財: "변동성이 큰 코인이나 주식보다는 배당주·적금·부동산처럼 따박따박 들어오는 수익 모델이 사주에 더 잘 맞습니다.",
    Sipsin.偏官: "이직·전직의 기회가 오며, 새로운 조직이나 도전적인 프로젝트에서 승진 가능성이 높습니다.",
    Sipsin.正官: "대기업·공공기관·전문직 등 안정적인 조직에서 인정받기 좋은 시기입니다. 승진 심사나 인사 평가에 유리합니다.",
    Sipsin.偏印: "IT·AI·데이터 분석 등 첨단 분야나 자격증·특수 기술 습득에 유리한 시기입니다.",
    Sipsin.正印: "대학원 진학, 전문 자격증(CPA·변호사·의사 등) 취득, 사내 교육·연수에 최적의 타이밍입니다.",
}

_MODERN_INVEST: dict[Sipsin, str] = {
    Sipsin.比肩: "남의 투자 정보보다 본인만의 원칙을 세워 독자적으로 운용하는 것이 낫습니다.",
    Sipsin.劫財: "보증·동업·대출은 피하고, 지출 관리 앱 등으로 재정을 철저히 통제하세요.",
    Sipsin.食神: "취미가 수익이 되는 사이드 프로젝트, 지식 판매(전자책·강의)가 좋습니다.",
    Sipsin.傷官: "특허·저작권 등 지적재산 투자나 크리에이터 이코노미에 주목하세요.",
    Sipsin.偏財: "분산 투자보다는 확신 있는 한두 종목에 집중하는 전략이 맞는 시기입니다.",
    Sipsin.正財: "ISA·연금저축·우량 배당주 등 장기 복리 전략이 가장 효과적입니다.",
    Sipsin.偏官: "시장 변동기에 기회가 오므로, 현금 비중을 높여두고 타이밍을 노리세요.",
    Sipsin.正官: "회사 스톡옵션·우리사주 등 소속 조직과 연계된 자산 형성이 유리합니다.",
    Sipsin.偏印: "블록체인·AI 관련주 등 미래 기술 테마에 소액으로 분산 투자해 보세요.",
    Sipsin.正印: "자기 계발 투자(교육·건강)가 장기적으로 가장 높은 수익률을 보입니다.",
}

_MODERN_LIFESTYLE: dict[Sipsin, str] = {
    Sipsin.比肩: "혼자 하는 운동(러닝·등산·헬스)이 스트레스 해소에 효과적입니다.",
    Sipsin.劫財: "충동 구매를 줄이고, 정기적인 가계부 점검 루틴을 만드세요.",
    Sipsin.食神: "맛집 탐방, 요리 클래스, 미식 여행 등이 행운을 끌어옵니다.",
    Sipsin.傷官: "예술 활동(그림·음악·글쓰기)으로 감정을 표현하면 대인관계 마찰이 줄어듭니다.",
    Sipsin.偏財: "새로운 사람·장소를 적극적으로 만나세요. 네트워킹 모임이 기회가 됩니다.",
    Sipsin.正財: "규칙적인 생활 패턴과 루틴이 운을 안정시킵니다. 절약이 미덕인 해입니다.",
    Sipsin.偏官: "격투기·클라이밍 등 도전적인 스포츠가 넘치는 에너지를 해소해 줍니다.",
    Sipsin.正官: "품격 있는 취미(골프·와인·독서모임)가 인맥과 명예에 도움이 됩니다.",
    Sipsin.偏印: "명상·요가·디지털 디톡스로 불안한 마음을 다스리세요.",
    Sipsin.正印: "독서 챌린지, 온라인 강의 수강 등 배움의 즐거움을 만끽하세요.",
}

_OHENG_METAPHOR: dict[Oheng, str] = {
    Oheng.木: "봄날의 큰 나무처럼 위로 뻗어가는 에너지",
    Oheng.火: "한여름의 태양처럼 강렬하게 타오르는 에너지",
    Oheng.土: "너른 대지처럼 모든 것을 품어내는 에너지",
    Oheng.金: "가을 서리처럼 맑고 날카로운 에너지",
    Oheng.水: "깊은 바다처럼 유연하고 끝없이 흐르는 에너지",
}

_OHENG_EXCESS: dict[Oheng, str] = {
    Oheng.木: "나무가 너무 빽빽하면 서로 햇빛을 가리듯, 추진력이 과해 무리하기 쉽습니다. 간·담 건강에도 유의하세요.",
    Oheng.火: "불길이 너무 세면 주변까지 태우듯, 감정 기복이 크고 성급해질 수 있습니다. 심장·혈압에 유의하세요.",
    Oheng.土: "흙이 너무 단단하면 새싹이 뚫지 못하듯, 고집이 세고 변화를 꺼리게 됩니다. 소화기 건강에 유의하세요.",
    Oheng.金: "쇠가 너무 차가우면 사람이 다가가기 어렵듯, 대인관계가 경직될 수 있습니다. 폐·호흡기에 유의하세요.",
    Oheng.水: "물이 넘치면 방향을 잃듯, 우유부단해지고 불안감이 커질 수 있습니다. 신장·방광에 유의하세요.",
}

_OHENG_LACK: dict[Oheng, str] = {
    Oheng.木: "나무가 없는 벌판처럼, 추진력과 결단력이 부족하여 시작이 어려울 수 있습니다.",
    Oheng.火: "불꽃 없는 겨울밤처럼, 열정과 적극성이 부족하여 동기 부여가 필요합니다.",
    Oheng.土: "뿌리 내릴 땅이 없는 것처럼, 안정감과 신뢰 기반이 흔들릴 수 있습니다.",
    Oheng.金: "칼날 없는 칼처럼, 결단력과 실행력이 부족하여 마무리가 약할 수 있습니다.",
    Oheng.水: "샘이 마른 우물처럼, 지혜와 유연성이 부족하여 융통성이 필요합니다.",
}

_PILLAR_MEANING: dict[str, str] = {
    "년주": "조상·사회적 환경",
    "월주": "부모·직장·사회활동",
    "일주": "본인·배우자",
    "시주": "자녀·말년·미래",
}

_YONGSHIN_FORTUNE: dict[Oheng, dict[str, str]] = {
    Oheng.木: {
        "활동": "등산·산책·원예 등 자연과 가까운 활동",
        "색상": "초록색·연두색 계열의 옷이나 소품",
        "방향": "동쪽 방향으로의 이동이나 동향 배치",
        "음식": "신맛 나는 음식(레몬·식초·매실)",
        "투자": "성장주·신사업·교육 관련 투자",
    },
    Oheng.火: {
        "활동": "운동·발표·네트워킹 등 열정적인 활동",
        "색상": "붉은색·주황색 계열의 포인트 아이템",
        "방향": "남쪽 방향이 길하며, 밝은 조명의 공간",
        "음식": "쓴맛 나는 음식(커피·다크초콜릿·녹차)",
        "투자": "IT·미디어·에너지 관련 분야",
    },
    Oheng.土: {
        "활동": "명상·요가·부동산 탐방 등 안정감을 주는 활동",
        "색상": "노란색·베이지·브라운 계열의 따뜻한 톤",
        "방향": "중앙이 좋으며, 안정된 공간에 머무르기",
        "음식": "단맛 나는 음식(고구마·단호박·꿀)",
        "투자": "부동산·리츠·인프라 등 실물 자산",
    },
    Oheng.金: {
        "활동": "재정 정리·미니멀 라이프·정리 정돈",
        "색상": "흰색·은색·골드 계열의 깔끔한 톤",
        "방향": "서쪽 방향이 길하며, 정돈된 환경",
        "음식": "매운맛 나는 음식(고추·생강·마늘)",
        "투자": "배당주·금·안정적 채권",
    },
    Oheng.水: {
        "활동": "여행·수영·독서 등 유연하고 흐르는 활동",
        "색상": "검은색·남색·파란색 계열",
        "방향": "북쪽 방향이 길하며, 물 가까운 환경",
        "음식": "짠맛 나는 음식(해산물·미역·김)",
        "투자": "유동성 높은 자산, 해외 투자, 물류·유통",
    },
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

    def _interpret_personality(self) -> list[str]:
        my_element = self.natal.my_main_element
        metaphor = _OHENG_METAPHOR[my_element]
        lines = [
            f"당신은 {metaphor}를 가진 사람입니다. {my_element.personality}"
        ]

        if self.natal.sibi_unseong:
            _, day_unseong = self.natal.sibi_unseong[2]
            lines.append(
                f"여기에 일주 십이운성 {day_unseong.name}({day_unseong.meaning})의 "
                f"기운이 더해져, 삶의 기본 리듬을 형성합니다."
            )

        for branch, sinsal in self.natal.sinsal:
            lines.append(f"특히 {sinsal.korean}이 있어 {sinsal.meaning} 성향이 두드러집니다.")

        return lines

    def _interpret_element_balance(self) -> list[str]:
        stats = self.natal.element_stats
        my_element = self.natal.my_main_element
        lines = []

        # 분포 요약
        dist = ", ".join(f"{oheng.name} {count}개" for oheng, count in stats.items())
        lines.append(f"팔자 속 오행 분포는 [{dist}]입니다.")

        excess = [oheng for oheng, count in stats.items() if count >= 3]
        lacking = [oheng for oheng, count in stats.items() if count == 0]

        if excess:
            for oheng in excess:
                lines.append(f"{oheng.name}({oheng.meaning})이 {stats[oheng]}개로 과다합니다. {_OHENG_EXCESS[oheng]}")
        if lacking:
            for oheng in lacking:
                lines.append(f"{oheng.name}({oheng.meaning})이 없습니다. {_OHENG_LACK[oheng]}")

        if not excess and not lacking:
            lines.append("다섯 가지 기운이 비교적 고르게 분포되어 있어 안정적인 구성입니다.")

        # 신강/신약을 서사로
        strength = self.natal.strength
        if strength > 0:
            lines.append(
                f"신강(+{strength}) — {_OHENG_METAPHOR[my_element]}가 넘치는 상태입니다. "
                f"이 에너지를 바깥으로 발산하는 활동(운동·사업 확장·봉사)이 균형을 맞춰줍니다."
            )
        elif strength < 0:
            lines.append(
                f"신약({strength}) — {my_element.name}의 기운이 주변에 눌려 있는 상태입니다. "
                f"든든한 지원군(멘토·팀·가족)과 함께할 때 본래의 역량이 발휘됩니다."
            )
        else:
            lines.append(
                "중화(0) — 오행이 균형을 이루고 있어 어떤 환경에서든 안정적으로 적응할 수 있습니다."
            )

        return lines

    def _interpret_yongshin(self) -> list[str]:
        yongshin = self.natal.yongshin
        my_element = self.natal.my_main_element
        strength = self.natal.strength
        lines = []

        if strength > 0:
            lines.append(
                f"넘치는 {my_element.name}의 기운을 적절히 빼주는 {yongshin.name}({yongshin.meaning})이 "
                f"당신의 용신입니다. 마치 뜨거운 여름에 시원한 {yongshin.meaning}을 만난 것과 같아, "
                f"{yongshin.name}의 기운이 올 때 삶의 균형이 맞춰집니다."
            )
        else:
            lines.append(
                f"부족한 {my_element.name}의 기운을 채워주는 {yongshin.name}({yongshin.meaning})이 "
                f"당신의 용신입니다. {yongshin.name}의 기운이 들어오는 해에는 "
                f"마치 가뭄 끝에 단비가 내리듯, 일이 풀리기 시작합니다."
            )

        # 세운/대운 용신 충족
        in_seun = self.postnatal.yongshin_in_seun
        in_daeun = self.postnatal.yongshin_in_daeun
        year = self.postnatal.year

        if in_seun and in_daeun:
            lines.append(
                f"반가운 소식입니다! {year}년은 세운과 대운 모두에서 용신({yongshin.name})이 "
                f"작용하여 매우 유리한 해입니다. 새로운 도전에 적극적으로 나설 때입니다."
            )
        elif in_seun:
            lines.append(
                f"{year}년 세운에 용신({yongshin.name})이 있습니다. "
                f"올해 찾아오는 기회를 놓치지 마세요 — 단, 장기적 큰 흐름(대운)에는 "
                f"용신이 없으니 단기 승부에 집중하는 것이 현명합니다."
            )
        elif in_daeun:
            lines.append(
                f"대운이라는 큰 강줄기에 용신({yongshin.name})이 흐르고 있어 "
                f"10년 단위의 큰 흐름은 좋습니다. 다만 {year}년 세운에는 부재하니, "
                f"올해는 씨앗을 뿌리되 수확은 조급해하지 마세요."
            )
        else:
            lines.append(
                f"{year}년은 세운과 대운 모두 용신({yongshin.name})이 부재합니다. "
                f"새 사업·큰 투자·이직 같은 중대한 결정은 한 박자 늦추고, "
                f"내실을 다지는 데 집중하는 것이 지혜로운 선택입니다."
            )

        return lines

    def _interpret_fortune_by_domain(self) -> list[str]:
        lines = []

        # 세운 십신으로 올해 영역 판단
        seun_sipsins = [self.postnatal.seun_stem[1], self.postnatal.seun_branch[1]]
        # 대운 십신도 반영
        daeun_sipsins = [sipsin for _, sipsin in self.postnatal.daeun_sipsin]

        for domain_name, domain_sipsins in DOMAIN_MAP.items():
            seun_match = [sipsin for sipsin in seun_sipsins if sipsin in domain_sipsins]
            daeun_match = [sipsin for sipsin in daeun_sipsins if sipsin in domain_sipsins]

            key_sipsin = (seun_match or daeun_match or [None])[0]
            if key_sipsin is None:
                continue

            influence = "세운과 대운 모두 영향" if seun_match and daeun_match \
                else "올해의 키워드" if seun_match \
                else "대운의 흐름"

            lines.append(f"[{domain_name}] {influence} — {key_sipsin.name}: {_SIPSIN_DETAIL[key_sipsin]}")

            # 현대적 매핑 추가
            if domain_name == "재물운":
                lines.append(f"  💼 투자: {_MODERN_INVEST[key_sipsin]}")
            elif domain_name == "직장·사회운":
                lines.append(f"  💼 커리어: {_MODERN_CAREER[key_sipsin]}")
            elif domain_name == "학업·자격운":
                lines.append(f"  💼 커리어: {_MODERN_CAREER[key_sipsin]}")
            elif domain_name in ("표현·건강운", "대인관계"):
                lines.append(f"  🌿 라이프: {_MODERN_LIFESTYLE[key_sipsin]}")

        return lines

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

    def _interpret_major_fortune(self) -> list[str]:
        lines = []
        current_daeun = self.postnatal.current_daeun
        if not current_daeun:
            return lines

        lines.append(f"현재 대운 {current_daeun.ganji}({current_daeun.start_age}~{current_daeun.end_age}세):")

        for char, sipsin in self.postnatal.daeun_sipsin:
            lines.append(f"  {char}({sipsin.name}): {_SIPSIN_DETAIL[sipsin]}")

        # 대운 흐름 시계열
        daeun_list = self.postnatal.daeun
        current_idx = next(
            (i for i, dp in enumerate(daeun_list) if dp.ganji == current_daeun.ganji), None
        )
        if current_idx is not None:
            if current_idx > 0:
                prev = daeun_list[current_idx - 1]
                lines.append(f"  이전 대운 {prev.ganji}({prev.start_age}~{prev.end_age}세)에서 전환된 흐름입니다.")
            if current_idx < len(daeun_list) - 1:
                nxt = daeun_list[current_idx + 1]
                lines.append(f"  다음 대운 {nxt.ganji}({nxt.start_age}~{nxt.end_age}세)로의 전환을 준비하세요.")

        return lines

    def _interpret_relationships(self) -> list[str]:
        lines = []

        for clash in self.postnatal.seun_clashes:
            pillar = clash['pillar']
            meaning = _PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 세운 {clash['incoming']}이(가) {pillar} {clash['target']}과(와) "
                f"충(衝)합니다. {pillar}은 {meaning}을 상징하므로, "
                f"이 영역에서 변동·갈등이 예상됩니다. 미리 대비하면 오히려 전화위복의 계기가 됩니다."
            )
        for clash in self.postnatal.daeun_clashes:
            pillar = clash['pillar']
            meaning = _PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"대운 {clash['incoming']}이(가) {pillar} {clash['target']}과(와) "
                f"충(衝)합니다. {meaning} 영역에서 이 대운 기간 동안 "
                f"구조적 변화가 일어날 수 있습니다."
            )
        for combine in self.postnatal.seun_combines:
            pillar = combine['pillar']
            meaning = _PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 세운 {combine['incoming']}이(가) {pillar} {combine['target']}과(와) "
                f"{combine['type']}합니다. {meaning} 영역에서 "
                f"뜻밖의 귀인이 나타나거나 좋은 인연이 맺어질 수 있습니다."
            )
        for combine in self.postnatal.daeun_combines:
            pillar = combine['pillar']
            meaning = _PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"대운 {combine['incoming']}이(가) {pillar} {combine['target']}과(와) "
                f"{combine['type']}합니다. {meaning} 영역에서 "
                f"장기적으로 긍정적인 변화와 협력 관계가 형성됩니다."
            )

        return lines

    def _interpret_advice(self) -> list[str]:
        lines = []
        yongshin = self.natal.yongshin
        year = self.postnatal.year
        in_seun = self.postnatal.yongshin_in_seun
        in_daeun = self.postnatal.yongshin_in_daeun
        has_clash = bool(self.postnatal.seun_clashes or self.postnatal.daeun_clashes)
        has_combine = bool(self.postnatal.seun_combines or self.postnatal.daeun_combines)

        # 올해 종합 톤 설정
        if in_seun and in_daeun and not has_clash:
            lines.append(
                f"{year}년은 바람이 돛을 가득 채운 배와 같습니다. "
                f"용신이 세운·대운 모두에 작용하고 충이 없어, "
                f"새로운 사업 시작·이직·투자 등 적극적으로 추진하기 좋은 해입니다."
            )
        elif in_seun and has_clash:
            lines.append(
                f"{year}년은 폭풍 속에 보물이 숨어있는 해입니다. "
                f"용신이 있어 기회는 분명히 오지만, 충의 에너지도 함께하므로 "
                f"갈등 한가운데서 냉정하게 기회를 잡는 지혜가 필요합니다."
            )
        elif in_daeun and not in_seun and has_combine:
            lines.append(
                f"{year}년은 강의 흐름은 좋으나 잔물결이 이는 해입니다. "
                f"대운의 큰 흐름이 좋고 합의 에너지가 귀인을 데려오지만, "
                f"세운에 용신이 없으니 내실을 다지며 다음 해를 준비하세요."
            )
        elif not in_seun and not in_daeun and has_clash:
            lines.append(
                f"{year}년은 거센 역풍을 맞는 시기입니다. "
                f"용신이 부재하고 충까지 있으므로, 새로운 시도보다는 "
                f"현재 가진 것을 지키는 데 집중하세요. 큰 결정은 반드시 한 박자 늦추세요."
            )
        elif not in_seun and not in_daeun:
            lines.append(
                f"{year}년은 겨울처럼 에너지를 안으로 모으는 시기입니다. "
                f"무리한 확장보다는 자기 계발·건강 관리·인간관계 정리 등 "
                f"내면을 가꾸는 데 집중하면, 다가올 봄에 크게 도약할 수 있습니다."
            )

        # 용신 오행별 구체적 개운법
        fortune = _YONGSHIN_FORTUNE[yongshin]
        lines.append(
            f"용신 {yongshin.name}({yongshin.meaning})을 보강하는 개운법:"
        )
        lines.append(f"  🎯 추천 활동: {fortune['활동']}")
        lines.append(f"  🎨 행운의 색상: {fortune['색상']}")
        lines.append(f"  🧭 길한 방향: {fortune['방향']}")
        lines.append(f"  🍽️ 보충 음식: {fortune['음식']}")
        lines.append(f"  💰 투자 방향: {fortune['투자']}")

        return lines