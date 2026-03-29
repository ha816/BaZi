from __future__ import annotations

from dataclasses import dataclass, field

from bazi.application.constant import DOMAIN_MAP, SAMJAE_LABELS, SAMJAE_MAP
from bazi.application.port.saju_port import NatalPort, PostnatalPort
from bazi.application.interpreter.advice import AdviceInterpreter
from bazi.application.interpreter.daeun import DaeunInterpreter
from bazi.application.interpreter.fortune import FortuneInterpreter
from bazi.application.interpreter.personality import ElementBalanceInterpreter, PersonalityInterpreter
from bazi.application.interpreter.relationship import RelationshipInterpreter
from bazi.application.interpreter.seun import SeunInterpreter
from bazi.application.interpreter.yongshin import YongshinInterpreter
from bazi.domain.ganji import Branch, Stem
from bazi.domain.natal import NatalInfo, PostnatalInfo, Saju
from bazi.domain.user import User
from bazi.application.util.util import year_to_ganji


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

    # 삼재
    samjae: dict | None = None

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
    """종합 해석기 — 각 해석 컴포넌트를 조합하여 Interpretation을 반환한다."""

    async def interpret(self, natal: NatalInfo, postnatal: PostnatalInfo) -> Interpretation:
        return Interpretation(
            **self._build_chart_data(natal, postnatal),
            personality=PersonalityInterpreter()(natal),
            element_balance=ElementBalanceInterpreter()(natal),
            yongshin=YongshinInterpreter()(natal, postnatal),
            fortune_by_domain=FortuneInterpreter()(postnatal),
            annual_fortune=SeunInterpreter()(natal, postnatal),
            major_fortune=DaeunInterpreter()(postnatal),
            relationships=RelationshipInterpreter()(postnatal),
            advice=AdviceInterpreter()(natal, postnatal),
        )

    def _build_chart_data(self, natal: NatalInfo, postnatal: PostnatalInfo) -> dict:
        """프론트엔드 차트/UI에 필요한 데이터를 구성한다."""
        yongshin_el = natal.yongshin
        current_ganji = postnatal.current_daeun.ganji if postnatal.current_daeun else None

        if natal.strength > 0:
            strength_label = "신강(身強)"
        elif natal.strength < 0:
            strength_label = "신약(身弱)"
        else:
            strength_label = "중화(中和)"

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

        current_daeun = None
        if postnatal.current_daeun:
            cd = postnatal.current_daeun
            current_daeun = {
                "ganji": cd.ganji,
                "start_age": cd.start_age,
                "end_age": cd.end_age,
            }

        seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]
        daeun_sipsins = [s for _, s in postnatal.daeun_sipsin]
        domain_scores = {}
        for domain_name, domain_sipsins in DOMAIN_MAP.items():
            seun_hit = sum(1 for s in seun_sipsins if s in domain_sipsins)
            daeun_hit = sum(1 for s in daeun_sipsins if s in domain_sipsins)
            score = seun_hit * 2 + daeun_hit
            level = "high" if score >= 3 else "medium" if score >= 1 else "low"
            domain_scores[domain_name] = {"score": score, "level": level}

        year_branch = Branch.from_char(natal.saju.year_pillar[1])
        seun_branch = Branch.from_char(year_to_ganji(postnatal.year)[1])
        samjae = None
        for group, (entering, sitting, leaving) in SAMJAE_MAP.items():
            if year_branch in group:
                samjae_branches = (entering, sitting, leaving)
                if seun_branch in samjae_branches:
                    idx = samjae_branches.index(seun_branch)
                    samjae = {
                        "type": SAMJAE_LABELS[idx],
                        "year_branch": seun_branch.name,
                        "birth_branch": year_branch.name,
                    }
                break

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
            "samjae": samjae,
        }


class SajuService:
    """사주 분석 서비스 — Port를 주입받아 전체 분석 파이프라인을 수행한다."""

    def __init__(
        self,
        natal_port: NatalPort,
        postnatal_port: PostnatalPort,
        interpreter: Interpreter,
    ):
        self.natal_port = natal_port
        self.postnatal_port = postnatal_port
        self.interpreter = interpreter

    async def analyze(self, saju: "Saju", user: "User", year: int) -> Interpretation:
        natal = await self.natal_port.analyze(saju)
        postnatal = await self.postnatal_port.analyze(user, natal, year)
        return await self.interpreter.interpret(natal, postnatal)
