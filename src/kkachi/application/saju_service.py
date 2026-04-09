from __future__ import annotations

import logging

from kkachi.application.interpreter.advice import AdviceInterpreter
from kkachi.application.interpreter.daeun import DaeunInterpreter
from kkachi.application.interpreter.fortune import FortuneInterpreter
from kkachi.application.interpreter.personality import ElementBalanceInterpreter, PersonalityInterpreter
from kkachi.application.interpreter.relationship import RelationshipInterpreter
from kkachi.application.interpreter.samjae import SamjaeInterpreter
from kkachi.application.interpreter.seun import SeunInterpreter
from kkachi.application.interpreter.yongshin import YongshinInterpreter
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.saju_port import InterpreterPort, NatalPort, PostnatalPort
from kkachi.application.util.util import year_to_ganji
from kkachi.domain.ganji import Branch
from kkachi.domain.interpretation import InterpretBlock, Interpretation, NatalResult, PostnatalResult
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User

_log = logging.getLogger(__name__)


class SajuService(InterpreterPort):
    """사주 분석 서비스 — Port를 주입받아 전체 분석 파이프라인을 수행한다."""

    def __init__(self, natal_port: NatalPort, postnatal_port: PostnatalPort, llm_port: LlmPort | None = None):
        self.natal_port = natal_port
        self.postnatal_port = postnatal_port
        self._llm_port = llm_port

    _SAMHAP_GROUPS: list[tuple[frozenset, str]] = [
        (frozenset({Branch.寅, Branch.午, Branch.戌}), "火"),
        (frozenset({Branch.亥, Branch.卯, Branch.未}), "木"),
        (frozenset({Branch.申, Branch.子, Branch.辰}), "水"),
        (frozenset({Branch.巳, Branch.酉, Branch.丑}), "金"),
    ]

    _BRANCH_KOREAN: dict[str, str] = {
        "子": "쥐", "丑": "소", "寅": "호랑이", "卯": "토끼", "辰": "용", "巳": "뱀",
        "午": "말", "未": "양", "申": "원숭이", "酉": "닭", "戌": "개", "亥": "돼지",
    }

    def _zodiac_relation(self, birth_branch: Branch, year: int) -> str:
        seun_ganji = year_to_ganji(year)
        seun_branch = Branch.from_char(seun_ganji[1])
        kor = self._BRANCH_KOREAN.get(seun_branch.name, seun_branch.name)
        label = f"{year}년 {kor}띠 해"

        if birth_branch == seun_branch:
            return f"올해({label})와 같은 해예요. 본명년(本命年)으로 변화가 많은 해입니다."
        if birth_branch.clashes == seun_branch:
            return f"올해({label})와 충(衝)이 있어요. 예상치 못한 변화에 유연하게 대처하세요."
        for group, element in self._SAMHAP_GROUPS:
            if birth_branch in group and seun_branch in group:
                return f"올해({label})와 삼합({element}気)이 맞아요. 좋은 기운이 따릅니다."
        return f"올해({label})와 특별한 충·합은 없어요. 꾸준히 나아가기 좋은 해예요."

    def basic_analyze(self, user: User, year: int) -> dict:
        natal = self.natal_port.analyze(user)
        birth_branch = list(natal.saju.pillars.values())[0].branch
        return {
            "pillars": [str(sb) for sb in natal.saju.pillars.values()],
            "day_stem": natal.saju.stem_of_day_pillar.name,
            "element_stats": {o.name: c for o, c in natal.element_stats.items()},
            "my_element": {"name": natal.my_main_element.name, "meaning": natal.my_main_element.meaning},
            "year_branch": birth_branch.name,
            "zodiac_relation": self._zodiac_relation(birth_branch, year),
        }

    def analyze(self, user: User, year: int) -> tuple[NatalInfo, PostnatalInfo]:
        natal = self.natal_port.analyze(user)
        postnatal = self.postnatal_port.analyze(user, natal, year)
        return natal, postnatal

    def _build_pillar_summary(self, natal: NatalInfo) -> str:
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

    def interpret_natal(self, natal: NatalInfo) -> NatalResult:
        return NatalResult(
            pillars=[str(sb) for sb in natal.saju.pillars.values()],
            day_stem=natal.saju.stem_of_day_pillar.name,
            element_stats={o.name: c for o, c in natal.element_stats.items()},
            strength_value=natal.strength,
            strength_label=natal.strength_label,
            my_element={"name": natal.my_main_element.name, "meaning": natal.my_main_element.meaning},
            yongshin_info={"name": natal.yongshin.name, "meaning": natal.yongshin.meaning},
            sipsin=[{"char": ch, "sipsin_name": s.name, "domain": s.domain} for ch, s in natal.sipsin],
            sibi_unseong=[{"pillar": p, "unseong_name": u.name, "meaning": u.meaning} for p, u in natal.sibi_unseong],
            sinsal=[{"branch": b.name, "sinsal_korean": s.korean, "meaning": s.meaning} for b, s in natal.sinsal],
            pillar_summary=self._build_pillar_summary(natal),
            personality=PersonalityInterpreter()(natal),
            element_balance=ElementBalanceInterpreter()(natal),
        )

    async def interpret_postnatal(self, natal: NatalInfo, postnatal: PostnatalInfo, name: str = "") -> PostnatalResult:
        current_ganji = postnatal.current_daeun.ganji if postnatal.current_daeun else None
        rule_advice = AdviceInterpreter()(natal, postnatal)
        advice = await self._enrich_advice(rule_advice, natal, postnatal, name)
        return PostnatalResult(
            year=postnatal.year,
            seun_ganji=year_to_ganji(postnatal.year),
            seun_stem={"char": postnatal.seun_stem[0], "sipsin_name": postnatal.seun_stem[1].name,
                       "domain": postnatal.seun_stem[1].domain},
            seun_branch={"char": postnatal.seun_branch[0], "sipsin_name": postnatal.seun_branch[1].name,
                         "domain": postnatal.seun_branch[1].domain},
            yongshin_in_seun=postnatal.yongshin_in_seun,
            yongshin_in_daeun=postnatal.yongshin_in_daeun,
            daeun=[
                {"ganji": d.ganji, "start_age": d.start_age, "end_age": d.end_age,
                 "has_yongshin": d.has_yongshin, "is_current": d.ganji == current_ganji}
                for d in postnatal.daeun
            ],
            current_daeun=(
                {"ganji": postnatal.current_daeun.ganji, "start_age": postnatal.current_daeun.start_age,
                 "end_age": postnatal.current_daeun.end_age}
                if postnatal.current_daeun else None
            ),
            daeun_sipsin=[{"char": ch, "sipsin_name": s.name, "domain": s.domain} for ch, s in postnatal.daeun_sipsin],
            seun_clashes=postnatal.seun_clashes,
            seun_combines=postnatal.seun_combines,
            daeun_clashes=postnatal.daeun_clashes,
            daeun_combines=postnatal.daeun_combines,
            domain_scores=postnatal.domain_scores,
            samjae=postnatal.samjae,
            yongshin=YongshinInterpreter()(natal, postnatal),
            fortune_by_domain=FortuneInterpreter()(postnatal),
            annual_fortune=SeunInterpreter()(natal, postnatal),
            samjae_fortune=SamjaeInterpreter()(natal, postnatal),
            major_fortune=DaeunInterpreter()(postnatal),
            relationships=RelationshipInterpreter()(natal, postnatal),
            advice=advice,
        )

    async def _enrich_advice(
        self,
        rule_advice: list[InterpretBlock],
        natal: NatalInfo,
        postnatal: PostnatalInfo,
        name: str,
    ) -> list[InterpretBlock]:
        if not self._llm_port or not self._llm_port.available:
            return rule_advice
        try:
            daeun_stem = postnatal.current_daeun.ganji[0] if postnatal.current_daeun else ""
            clash_labels = [f"{c.get('stem_or_branch', '')}" for c in postnatal.seun_clashes]
            llm_text = await self._llm_port.get_advice({
                "name": name,
                "yongshin": natal.yongshin.name,
                "yongshin_meaning": natal.yongshin.meaning,
                "strength_label": natal.strength_label,
                "element_stats": {o.name: c for o, c in natal.element_stats.items()},
                "year": postnatal.year,
                "yongshin_in_seun": postnatal.yongshin_in_seun,
                "seun_clashes": clash_labels or None,
                "daeun_stem": daeun_stem,
            })
            if llm_text:
                return [InterpretBlock(description=llm_text)] + rule_advice[1:]
        except Exception:
            _log.exception("LLM advice enrichment failed — falling back to rule engine")
        return rule_advice

    async def interpret(self, natal: NatalInfo, postnatal: PostnatalInfo, name: str = "") -> Interpretation:
        return Interpretation(
            natal=self.interpret_natal(natal),
            postnatal=await self.interpret_postnatal(natal, postnatal, name),
        )
