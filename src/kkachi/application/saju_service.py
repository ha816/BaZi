from __future__ import annotations

import logging

from kkachi.application.interpreter.advice import AdviceInterpreter
from kkachi.application.interpreter.daeun import DaeunInterpreter
from kkachi.application.interpreter.fengshui import FengShuiInterpreter
from kkachi.application.interpreter.fortune import FortuneInterpreter
from kkachi.application.interpreter.personality import ElementBalanceInterpreter, PersonalityInterpreter
from kkachi.application.interpreter.relationship import RelationshipInterpreter
from kkachi.application.interpreter.samjae import SamjaeInterpreter
from kkachi.application.interpreter.seun import SeunInterpreter
from kkachi.application.interpreter.yongshin import YongshinInterpreter
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.saju_port import InterpreterPort, NatalPort, PostnatalPort
from kkachi.application.util.util import year_to_ganji
from kkachi.domain.ganji import Branch, Stem
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

    _SAMHAP_ZODIAC: list[list[str]] = [
        ["申", "子", "辰"],
        ["巳", "酉", "丑"],
        ["寅", "午", "戌"],
        ["亥", "卯", "未"],
    ]
    _YUGHAP_PAIRS: list[tuple[str, str]] = [
        ("子", "丑"), ("寅", "亥"), ("卯", "戌"), ("辰", "酉"), ("巳", "申"), ("午", "未"),
    ]
    _WONJIN_PAIRS: list[tuple[str, str]] = [
        ("子", "未"), ("丑", "午"), ("寅", "酉"), ("卯", "申"), ("辰", "亥"), ("巳", "戌"),
    ]
    _CLASH_ZODIAC_PAIRS: list[tuple[str, str]] = [
        ("子", "午"), ("丑", "未"), ("寅", "申"), ("卯", "酉"), ("辰", "戌"), ("巳", "亥"),
    ]
    _BRANCHES_ORDER: list[str] = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
    _BRANCH_KOREAN: dict[str, str] = {
        "子": "쥐", "丑": "소", "寅": "호랑이", "卯": "토끼", "辰": "용", "巳": "뱀",
        "午": "말", "未": "양", "申": "원숭이", "酉": "닭", "戌": "개", "亥": "돼지",
    }

    def _zodiac_relation_type(self, a: str, b: str) -> str:
        if a == b:
            return "나"
        if any(a in g and b in g for g in self._SAMHAP_ZODIAC):
            return "삼합"
        if any((x == a and y == b) or (x == b and y == a) for x, y in self._YUGHAP_PAIRS):
            return "육합"
        if any((x == a and y == b) or (x == b and y == a) for x, y in self._CLASH_ZODIAC_PAIRS):
            return "충"
        if any((x == a and y == b) or (x == b and y == a) for x, y in self._WONJIN_PAIRS):
            return "원진"
        return "보통"

    def _get_year_branch_char(self, year: int) -> str:
        return self._BRANCHES_ORDER[(year - 4 + 1200) % 12]

    def _build_year_zodiac_relations(self, birth_branch_char: str, base_year: int) -> list[dict]:
        _DESC_MAP: dict[str, str] = {
            "나":   "본명년(本命年) — 12년마다 돌아오는 변화의 해. 내실 다지기에 집중하세요.",
            "삼합": "삼합(三合) — 강한 기운이 합쳐지는 해. 도전과 확장에 좋은 타이밍입니다.",
            "육합": "육합(六合) — 협력과 관계 확장에 유리한 해입니다.",
            "충":   "충(衝) — 예상치 못한 변화와 이동이 많을 수 있으니 유연하게 대처하세요.",
            "원진": "원진(怨嗔) — 대인관계에서 미묘한 갈등이나 오해가 생기기 쉬운 시기입니다.",
            "보통": "특별한 충·합이 없어요. 큰 기복 없이 꾸준히 나아가기 좋은 한 해입니다.",
        }

        def make_row(year: int) -> dict:
            branch_char = self._get_year_branch_char(year)
            relation = self._zodiac_relation_type(birth_branch_char, branch_char)
            ganji = year_to_ganji(year)
            return {
                "year": year,
                "ganji": ganji,
                "branch": branch_char,
                "kor": self._BRANCH_KOREAN.get(branch_char, branch_char),
                "relation": relation,
                "desc": _DESC_MAP.get(relation, ""),
            }

        rows = [make_row(base_year), make_row(base_year + 1)]
        for i in range(2, 14):
            r = make_row(base_year + i)
            if r["relation"] in ("삼합", "육합"):
                rows.append(r)
                break
        return rows

    def _find_nearest_yongshin_year(self, base_year: int, seun_ganji: str, yongshin: Oheng) -> int | None:
        seun_stem = Stem.from_char(seun_ganji[0])
        seun_branch = Branch.from_char(seun_ganji[1])
        for offset in range(2, 16):
            stem = Stem.by_order(seun_stem.order + offset)
            branch = Branch.by_order(seun_branch.order + offset)
            if stem.element == yongshin or branch.element == yongshin:
                return base_year + offset
        return None

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

    def interpret_natal(self, natal: NatalInfo, birth_year: int = 0, is_male: bool = True) -> NatalResult:
        day_stem = natal.saju.stem_of_day_pillar
        pillar_elements = [
            {"stem_element": sb.stem.element.name, "branch_element": sb.branch.element.name}
            for sb in natal.saju.pillars.values()
        ]
        return NatalResult(
            pillars=[str(sb) for sb in natal.saju.pillars.values()],
            day_stem=day_stem.name,
            day_stem_yin_yang="양(陽)" if day_stem.is_yang else "음(陰)",
            pillar_elements=pillar_elements,
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
            feng_shui=FengShuiInterpreter()(natal, birth_year, is_male),
        )

    async def interpret_postnatal(self, natal: NatalInfo, postnatal: PostnatalInfo, name: str = "") -> PostnatalResult:
        current_ganji = postnatal.current_daeun.ganji if postnatal.current_daeun else None
        rule_advice = AdviceInterpreter()(natal, postnatal)
        advice = await self._enrich_advice(rule_advice, natal, postnatal, name)
        birth_branch_char = list(natal.saju.pillars.values())[0].branch.name
        return PostnatalResult(
            year=postnatal.year,
            seun_ganji=year_to_ganji(postnatal.year),
            seun_stem={"char": postnatal.seun_stem[0], "sipsin_name": postnatal.seun_stem[1].name,
                       "domain": postnatal.seun_stem[1].domain,
                       "element": Stem.from_char(postnatal.seun_stem[0]).element.name},
            seun_branch={"char": postnatal.seun_branch[0], "sipsin_name": postnatal.seun_branch[1].name,
                         "domain": postnatal.seun_branch[1].domain,
                         "element": Branch.from_char(postnatal.seun_branch[0]).element.name},
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
            daeun_sipsin=[
                {"char": ch, "sipsin_name": s.name, "domain": s.domain,
                 "element": (Stem.from_char(ch).element.name if i == 0 else Branch.from_char(ch).element.name)}
                for i, (ch, s) in enumerate(postnatal.daeun_sipsin)
            ],
            seun_clashes=postnatal.seun_clashes,
            seun_combines=postnatal.seun_combines,
            daeun_clashes=postnatal.daeun_clashes,
            daeun_combines=postnatal.daeun_combines,
            domain_scores=postnatal.domain_scores,
            samjae=postnatal.samjae,
            nearest_yongshin_year=self._find_nearest_yongshin_year(
                postnatal.year, year_to_ganji(postnatal.year), natal.yongshin
            ),
            year_zodiac_relations=self._build_year_zodiac_relations(birth_branch_char, postnatal.year),
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

    async def interpret(
        self, natal: NatalInfo, postnatal: PostnatalInfo, user: User | None = None, name: str = ""
    ) -> Interpretation:
        birth_year = user.birth_dt.year if user else 0
        is_male = user.gender.is_male if user else True
        return Interpretation(
            natal=self.interpret_natal(natal, birth_year=birth_year, is_male=is_male),
            postnatal=await self.interpret_postnatal(natal, postnatal, name),
        )
