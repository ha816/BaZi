from __future__ import annotations

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
from bazi.domain.interpretation import Interpretation
from bazi.domain.natal import NatalInfo, PostnatalInfo, Saju
from bazi.domain.user import User
from bazi.application.util.util import year_to_ganji


class SajuService:
    """사주 분석 서비스 — Port를 주입받아 전체 분석 파이프라인을 수행한다."""

    def __init__(
        self,
        natal_port: NatalPort,
        postnatal_port: PostnatalPort,
    ):
        self.natal_port = natal_port
        self.postnatal_port = postnatal_port

    def analyze(self, saju: "Saju", user: "User", year: int) -> Interpretation:
        natal = self.natal_port.analyze(saju)
        postnatal = self.postnatal_port.analyze(user, natal, year)
        return self._interpret(natal, postnatal)

    def _interpret(self, natal: NatalInfo, postnatal: PostnatalInfo) -> Interpretation:
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

    @staticmethod
    def _build_chart_data(natal: NatalInfo, postnatal: PostnatalInfo) -> dict:
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
