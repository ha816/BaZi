from __future__ import annotations

from dataclasses import dataclass, field

from bazi.application.constant import (
    DOMAIN_MAP,
    MODERN_CAREER,
    MODERN_INVEST,
    MODERN_LIFESTYLE,
    OHENG_EXCESS,
    OHENG_LACK,
    OHENG_METAPHOR,
    PILLAR_MEANING,
    SIPSIN_DETAIL,
    YONGSHIN_FORTUNE,
)
from bazi.domain.ganji import Oheng, Sipsin, Stem, Branch
from bazi.domain.natal import NatalInfo, PostnatalInfo
from bazi.domain.util import year_to_ganji


@dataclass
class Interpretation:
    """구조화된 종합 해석 결과. 텍스트 해석 + 차트/UI용 데이터를 모두 포함한다."""

    # 사주 원국
    pillars: list[str] = field(default_factory=list)
    day_stem: str = ""

    # 오행·강약·용신 (차트용)
    element_stats: dict[str, int] = field(default_factory=dict)
    strength_value: int = 0
    strength_label: str = ""
    my_element: dict[str, str] = field(default_factory=dict)
    yongshin_info: dict[str, str] = field(default_factory=dict)

    # 세운
    year: int = 0
    seun_ganji: str = ""
    seun_stem: dict[str, str] = field(default_factory=dict)
    seun_branch: dict[str, str] = field(default_factory=dict)
    yongshin_in_seun: bool = False
    yongshin_in_daeun: bool = False

    # 대운 (차트용)
    daeun: list[dict] = field(default_factory=list)
    current_daeun: dict | None = None
    daeun_sipsin: list[dict[str, str]] = field(default_factory=list)

    # 충·합
    seun_clashes: list[dict] = field(default_factory=list)
    seun_combines: list[dict] = field(default_factory=list)
    daeun_clashes: list[dict] = field(default_factory=list)
    daeun_combines: list[dict] = field(default_factory=list)

    # 영역별 점수 (차트용)
    domain_scores: dict[str, dict] = field(default_factory=dict)

    # 십신·십이운성·신살
    sipsin: list[dict[str, str]] = field(default_factory=list)
    sibi_unseong: list[dict[str, str]] = field(default_factory=list)
    sinsal: list[dict[str, str]] = field(default_factory=list)

    # 텍스트 해석
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
            # 차트/UI 데이터
            **self._build_chart_data(),
            # 텍스트 해석
            personality=self._get_personality(),
            element_balance=self._get_element_balance(),
            yongshin=self._get_yongshin(),
            fortune_by_domain=self._get_fortune_by_domain(),
            annual_fortune=self._get_annual_fortune(),
            major_fortune=self._get_major_fortune(),
            relationships=self._get_relationships(),
            advice=self._get_advice(),
        )

    def _build_chart_data(self) -> dict:
        """프론트엔드 차트/UI에 필요한 데이터를 구성한다."""
        natal = self.natal
        postnatal = self.postnatal
        yongshin_el = natal.yongshin
        current_ganji = postnatal.current_daeun.ganji if postnatal.current_daeun else None

        # 강약 레이블
        if natal.strength > 0:
            strength_label = "신강(身強)"
        elif natal.strength < 0:
            strength_label = "신약(身弱)"
        else:
            strength_label = "중화(中和)"

        # 대운 리스트
        daeun_list = []
        for d in postnatal.daeun:
            has_yongshin = yongshin_el in (
                Stem.from_char(d.ganji[0]).element,
                Branch.from_char(d.ganji[1]).element,
            )
            daeun_list.append({
                "ganji": d.ganji,
                "start_age": d.start_age,
                "end_age": d.end_age,
                "has_yongshin": has_yongshin,
                "is_current": d.ganji == current_ganji,
            })

        # 현재 대운
        current_daeun = None
        if postnatal.current_daeun:
            cd = postnatal.current_daeun
            current_daeun = {
                "ganji": cd.ganji,
                "start_age": cd.start_age,
                "end_age": cd.end_age,
            }

        # 영역별 점수
        seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]
        daeun_sipsins = [s for _, s in postnatal.daeun_sipsin]
        domain_scores = {}
        for domain_name, domain_sipsins in DOMAIN_MAP.items():
            seun_hit = sum(1 for s in seun_sipsins if s in domain_sipsins)
            daeun_hit = sum(1 for s in daeun_sipsins if s in domain_sipsins)
            score = seun_hit * 2 + daeun_hit
            level = "high" if score >= 3 else "medium" if score >= 1 else "low"
            domain_scores[domain_name] = {"score": score, "level": level}

        return {
            "pillars": natal.saju.pillars,
            "day_stem": natal.saju.day_stem,
            "element_stats": {o.name: c for o, c in natal.element_stats.items()},
            "strength_value": natal.strength,
            "strength_label": strength_label,
            "my_element": {"name": natal.my_main_element.name, "meaning": natal.my_main_element.meaning},
            "yongshin_info": {"name": yongshin_el.name, "meaning": yongshin_el.meaning},
            "year": postnatal.year,
            "seun_ganji": year_to_ganji(postnatal.year),
            "seun_stem": {"char": postnatal.seun_stem[0], "sipsin_name": postnatal.seun_stem[1].name, "domain": postnatal.seun_stem[1].domain},
            "seun_branch": {"char": postnatal.seun_branch[0], "sipsin_name": postnatal.seun_branch[1].name, "domain": postnatal.seun_branch[1].domain},
            "yongshin_in_seun": postnatal.yongshin_in_seun,
            "yongshin_in_daeun": postnatal.yongshin_in_daeun,
            "daeun": daeun_list,
            "current_daeun": current_daeun,
            "daeun_sipsin": [{"char": ch, "sipsin_name": s.name, "domain": s.domain} for ch, s in postnatal.daeun_sipsin],
            "seun_clashes": postnatal.seun_clashes,
            "seun_combines": postnatal.seun_combines,
            "daeun_clashes": postnatal.daeun_clashes,
            "daeun_combines": postnatal.daeun_combines,
            "domain_scores": domain_scores,
            "sipsin": [{"char": ch, "sipsin_name": s.name, "domain": s.domain} for ch, s in natal.sipsin],
            "sibi_unseong": [{"pillar": p, "unseong_name": u.name, "meaning": u.meaning} for p, u in natal.sibi_unseong],
            "sinsal": [{"branch": b.name, "sinsal_korean": s.korean, "meaning": s.meaning} for b, s in natal.sinsal],
        }

    def _get_personality(self) -> list[str]:
        my_element = self.natal.my_main_element
        metaphor = OHENG_METAPHOR[my_element]
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

    def _get_element_balance(self) -> list[str]:
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
                lines.append(f"{oheng.name}({oheng.meaning})이 {stats[oheng]}개로 과다합니다. {OHENG_EXCESS[oheng]}")
        if lacking:
            for oheng in lacking:
                lines.append(f"{oheng.name}({oheng.meaning})이 없습니다. {OHENG_LACK[oheng]}")

        if not excess and not lacking:
            lines.append("다섯 가지 기운이 비교적 고르게 분포되어 있어 안정적인 구성입니다.")

        # 신강/신약을 서사로
        strength = self.natal.strength
        if strength > 0:
            lines.append(
                f"신강(+{strength}) — {OHENG_METAPHOR[my_element]}가 넘치는 상태입니다. "
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

    def _get_yongshin(self) -> list[str]:
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

    def _get_fortune_by_domain(self) -> list[str]:
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

            lines.append(f"[{domain_name}] {influence} — {key_sipsin.name}: {SIPSIN_DETAIL[key_sipsin]}")

            # 현대적 매핑 추가
            if domain_name == "재물운":
                lines.append(f"  💼 투자: {MODERN_INVEST[key_sipsin]}")
            elif domain_name == "직장·사회운":
                lines.append(f"  💼 커리어: {MODERN_CAREER[key_sipsin]}")
            elif domain_name == "학업·자격운":
                lines.append(f"  💼 커리어: {MODERN_CAREER[key_sipsin]}")
            elif domain_name in ("표현·건강운", "대인관계"):
                lines.append(f"  🌿 라이프: {MODERN_LIFESTYLE[key_sipsin]}")

        return lines

    def _get_annual_fortune(self) -> list[str]:
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

    def _get_major_fortune(self) -> list[str]:
        lines = []
        current_daeun = self.postnatal.current_daeun
        if not current_daeun:
            return lines

        lines.append(f"현재 대운 {current_daeun.ganji}({current_daeun.start_age}~{current_daeun.end_age}세):")

        for char, sipsin in self.postnatal.daeun_sipsin:
            lines.append(f"  {char}({sipsin.name}): {SIPSIN_DETAIL[sipsin]}")

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

    def _get_relationships(self) -> list[str]:
        lines = []

        for clash in self.postnatal.seun_clashes:
            pillar = clash['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 세운 {clash['incoming']}이(가) {pillar} {clash['target']}과(와) "
                f"충(衝)합니다. {pillar}은 {meaning}을 상징하므로, "
                f"이 영역에서 변동·갈등이 예상됩니다. 미리 대비하면 오히려 전화위복의 계기가 됩니다."
            )
        for clash in self.postnatal.daeun_clashes:
            pillar = clash['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"대운 {clash['incoming']}이(가) {pillar} {clash['target']}과(와) "
                f"충(衝)합니다. {meaning} 영역에서 이 대운 기간 동안 "
                f"구조적 변화가 일어날 수 있습니다."
            )
        for combine in self.postnatal.seun_combines:
            pillar = combine['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"올해 세운 {combine['incoming']}이(가) {pillar} {combine['target']}과(와) "
                f"{combine['type']}합니다. {meaning} 영역에서 "
                f"뜻밖의 귀인이 나타나거나 좋은 인연이 맺어질 수 있습니다."
            )
        for combine in self.postnatal.daeun_combines:
            pillar = combine['pillar']
            meaning = PILLAR_MEANING.get(pillar, "")
            lines.append(
                f"대운 {combine['incoming']}이(가) {pillar} {combine['target']}과(와) "
                f"{combine['type']}합니다. {meaning} 영역에서 "
                f"장기적으로 긍정적인 변화와 협력 관계가 형성됩니다."
            )

        return lines

    def _get_advice(self) -> list[str]:
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
        fortune = YONGSHIN_FORTUNE[yongshin]
        lines.append(
            f"용신 {yongshin.name}({yongshin.meaning})을 보강하는 개운법:"
        )
        lines.append(f"  🎯 추천 활동: {fortune['활동']}")
        lines.append(f"  🎨 행운의 색상: {fortune['색상']}")
        lines.append(f"  🧭 길한 방향: {fortune['방향']}")
        lines.append(f"  🍽️ 보충 음식: {fortune['음식']}")
        lines.append(f"  💰 투자 방향: {fortune['투자']}")

        return lines