from __future__ import annotations

import logging
from dataclasses import asdict

from kkachi.application.interpreter.advice import AdviceInterpreter
from kkachi.application.interpreter.daeun import DaeunInterpreter
from kkachi.application.interpreter.fengshui import FengShuiInterpreter
from kkachi.application.interpreter.fortune import FortuneInterpreter
from kkachi.application.interpreter.narrative import NatalNarrativeInterpreter, build_yongshin_tip
from kkachi.application.interpreter.personality import ElementBalanceInterpreter, PersonalityInterpreter
from kkachi.application.interpreter.relationship import RelationshipInterpreter
from kkachi.application.interpreter.samjae import SamjaeInterpreter
from kkachi.application.interpreter.seun import SeunInterpreter
from kkachi.application.interpreter.yongshin import YongshinInterpreter
from kkachi.application.interpreter.zodiac import ZodiacInterpreter
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.saju_port import InterpreterPort, NatalPort, PostnatalPort
from kkachi.application.report_builder import LlmReportBuilder
from kkachi.application.util.sipsin_meta import enrich_sipsin, sipsin_domain, sipsin_label
from kkachi.application.util.util import year_to_ganji
from kkachi.application.util.zodiac_meta import zodiac_info
from kkachi.domain.ganji import JIZAN_ROLE_HANJA, Branch, Oheng, Sipsin, Stem
from kkachi.domain.interpretation import InterpretBlock, Interpretation, NatalResult, PostnatalResult
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User

_log = logging.getLogger(__name__)

_YONGSHIN_GUIDE: dict[Oheng, dict[str, str]] = {
    Oheng.木: {"color": "초록·청록", "direction": "동쪽", "career": "교육·출판·디자인·환경",  "daily": "식물·나무 가구·산책"},
    Oheng.火: {"color": "빨강·주황", "direction": "남쪽", "career": "엔터테인먼트·언론·요식·뷰티", "daily": "햇빛·캔들·운동"},
    Oheng.土: {"color": "노랑·갈색", "direction": "중앙", "career": "부동산·중개·농업·신뢰업",     "daily": "도자기·황토·정원 가꾸기"},
    Oheng.金: {"color": "흰색·은색", "direction": "서쪽", "career": "금융·법무·기계·의료",         "daily": "금속 액세서리·정돈된 환경"},
    Oheng.水: {"color": "검정·남색", "direction": "북쪽", "career": "IT·연구·유통·물 관련",        "daily": "수족관·물·명상"},
}


class NatalService:
    """선천(先天) 해석 — NatalInfo → NatalResult 조립."""

    @staticmethod
    def kisin(yongshin: Oheng) -> Oheng:
        members = list(Oheng)
        return members[(members.index(yongshin) - 2) % 5]

    @staticmethod
    def josa(word: str, with_jong: str, without_jong: str) -> str:
        if not word:
            return without_jong
        code = ord(word[-1])
        has = 0xAC00 <= code <= 0xD7A3 and (code - 0xAC00) % 28 != 0
        return with_jong if has else without_jong

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

    def interpret_natal(self, natal: NatalInfo, birth_year: int = 0, is_male: bool = True, name: str = "") -> NatalResult:
        day_stem = natal.saju.stem_of_day_pillar
        pillar_elements = [
            {"stem_element": sb.stem.element.name, "branch_element": sb.branch.element.name}
            for sb in natal.saju.pillars.values()
        ]
        pillar_stems_korean = [sb.stem.korean for sb in natal.saju.pillars.values()]
        pillar_branches_korean = [sb.branch.korean for sb in natal.saju.pillars.values()]
        kisin = self.kisin(natal.yongshin)
        return NatalResult(
            pillars=[str(sb) for sb in natal.saju.pillars.values()],
            day_stem=day_stem.name,
            day_stem_korean=day_stem.korean,
            day_stem_yin_yang="양(陽)" if day_stem.is_yang else "음(陰)",
            pillar_stems_korean=pillar_stems_korean,
            pillar_branches_korean=pillar_branches_korean,
            pillar_elements=pillar_elements,
            element_stats={o.name: c for o, c in natal.element_stats.items()},
            strength_value=natal.strength,
            strength_label=natal.strength_label,
            my_element={"name": natal.my_main_element.name, "meaning": natal.my_main_element.meaning},
            yongshin_info={"name": natal.yongshin.name, "meaning": natal.yongshin.meaning},
            kisin_info={"name": kisin.name, "meaning": kisin.meaning},
            yongshin_guide=_YONGSHIN_GUIDE.get(natal.yongshin, {}),
            kisin_guide=_YONGSHIN_GUIDE.get(kisin, {}),
            sipsin=[{"char": ch, "sipsin_name": s.name, "domain": s.domain} for ch, s in natal.sipsin],
            sibi_unseong=[
                {
                    "pillar": p,
                    "unseong_name": u.name,
                    "unseong_korean": u.korean,
                    "meaning": u.meaning,
                    "strength": u.strength,
                }
                for p, u in natal.sibi_unseong
            ],
            sinsal=[{"branch": b.name, "sinsal_korean": s.korean, "meaning": s.meaning} for b, s in natal.sinsal],
            jizan_gan=[
                [
                    {
                        "stem": ch,
                        "stem_korean": Stem.from_char(ch).korean,
                        "sipsin_name": s.name,
                        "weight": w,
                        "role": role,
                        "role_hanja": JIZAN_ROLE_HANJA.get(role, ""),
                    }
                    for ch, s, w, role in pillar_jg
                ]
                for pillar_jg in natal.jizan_gan
            ],
            sibi_sinsal=natal.sibi_sinsal,
            gongmang=natal.gongmang,
            pillar_summary=self._build_pillar_summary(natal),
            narratives=NatalNarrativeInterpreter()(natal, name),
            personality=PersonalityInterpreter()(natal),
            element_balance=ElementBalanceInterpreter()(natal),
            feng_shui=FengShuiInterpreter()(natal, birth_year, is_male),
            zodiac=ZodiacInterpreter()(natal, name),
        )


class PostnatalService:
    """후천(後天) 해석 — NatalInfo + PostnatalInfo → PostnatalResult 조립."""

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

    def __init__(self, llm_port: LlmPort | None = None):
        self._llm_port = llm_port

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
            info = zodiac_info(branch_char)
            return {
                "year": year,
                "ganji": ganji,
                "branch": branch_char,
                "kor": info.korean,
                "relation": relation,
                "desc": _DESC_MAP.get(relation, ""),
                "info": asdict(info),
            }

        rows = [make_row(base_year + i) for i in range(4)]
        if not any(r["relation"] in ("삼합", "육합") for r in rows):
            for i in range(4, 14):
                r = make_row(base_year + i)
                if r["relation"] in ("삼합", "육합"):
                    rows[-1] = r
                    break
        return rows

    def _build_year_zodiac_narrative(self, rows: list[dict], name: str = "") -> str:
        body_map: dict[str, str] = {
            "삼합": "강한 기운이 합쳐지는 해, 도전과 확장에 좋은 타이밍",
            "육합": "협력과 관계 확장에 유리한 시기",
            "충":   "예상치 못한 변화와 이동이 많을 수 있는 시기",
            "원진": "대인관계에서 미묘한 갈등이나 오해가 생기기 쉬운 시기",
        }

        good = [r for r in rows if r["relation"] in ("삼합", "육합")]
        bad = [r for r in rows if r["relation"] in ("충", "원진")]
        bon = [r for r in rows if r["relation"] == "나"]

        if not good and not bad and not bon:
            return ""

        def fragment(group: list[dict]) -> str:
            if len(group) == 1:
                r = group[0]
                yy = r["year"] % 100
                return f"{yy}년 {r['kor']}띠와 {r['relation']}으로 {body_map[r['relation']]}"
            years = ", ".join(f"{r['year'] % 100}년" for r in group)
            rels = ", ".join(r["relation"] for r in group)
            bodies = ", ".join(body_map[r["relation"]] for r in group)
            return f"{years}은 {rels}으로 {bodies}"

        prefix = f"{name}님은 " if name else ""
        sentences: list[str] = []

        if good:
            sentences.append(f"{prefix}{fragment(good)}이에요.")

        if bad:
            head = "반면 " if good else prefix
            sentences.append(f"{head}{fragment(bad)}예요.")

        if bon:
            yy = bon[0]["year"] % 100
            if good or bad:
                sentences.append(f"{yy}년은 12년마다 돌아오는 본명년(本命年)이라 내실 다지기 좋은 해예요.")
            else:
                sentences.append(f"{prefix}{yy}년 본명년(本命年)을 맞아 내실 다지기 좋은 시기예요.")

        return " ".join(sentences)

    def _find_nearest_yongshin_year(self, base_year: int, seun_ganji: str, yongshin: Oheng) -> int | None:
        seun_stem = Stem.from_char(seun_ganji[0])
        seun_branch = Branch.from_char(seun_ganji[1])
        for offset in range(2, 16):
            stem = Stem.by_order(seun_stem.order + offset)
            branch = Branch.by_order(seun_branch.order + offset)
            if stem.element == yongshin or branch.element == yongshin:
                return base_year + offset
        return None

    def _build_month_badges(self, upcoming_months: list[dict]) -> dict[str, list[str]]:
        if not upcoming_months:
            return {}
        current = upcoming_months[0]
        badges: dict[str, list[str]] = {}
        for key in ("stem_sipsin", "branch_sipsin"):
            sipsin_dict = current.get(key) or {}
            name = sipsin_dict.get("sipsin_name")
            if not name:
                continue
            try:
                sipsin = Sipsin[name]
            except KeyError:
                continue
            domain = sipsin_domain(sipsin)
            label = sipsin_label(sipsin)
            badges.setdefault(domain, []).append(label)
        return badges

    def _build_core_summary(self, natal: NatalInfo, postnatal: PostnatalInfo, name: str = "") -> str:
        prefix = f"{name}님은" if name else "이 사주는"
        day_stem = natal.saju.stem_of_day_pillar
        my_el = natal.my_main_element
        yong = natal.yongshin
        kisin = NatalService.kisin(yong)

        sorted_els = sorted(natal.element_stats.items(), key=lambda x: x[1], reverse=True)
        strongest, top_count = sorted_els[0]
        missing = [o for o, c in natal.element_stats.items() if c == 0]

        sentences: list[str] = []

        sentences.append(
            f"{prefix} {day_stem.korean}({day_stem.name}) 일간으로 "
            f"{my_el.meaning}({my_el.name}) 기운이 중심인 {natal.strength_label} 사주예요."
        )

        if strongest is my_el:
            top_josa = NatalService.josa(strongest.meaning, "이", "가")
            top_clause = f"여덟 글자 중 주 오행인 {strongest.meaning}{top_josa} {top_count}개로 두텁게 자리잡고 있어요"
        else:
            my_josa = NatalService.josa(my_el.meaning, "이", "가")
            top_clause = (
                f"여덟 글자 중 {strongest.meaning}({strongest.name})의 기운이 {top_count}개로 가장 많고, "
                f"주 오행 {my_el.meaning}{my_josa} 받쳐주는 구성이에요"
            )
        if missing:
            miss_names = "·".join(o.meaning for o in missing)
            sentences.append(f"{top_clause}. 다만 {miss_names}의 기운이 비어 있어 이를 채워주는 흐름이 들어올 때 결이 부드러워져요.")
        else:
            sentences.append(f"{top_clause}. 다섯 기운이 모두 있어 비교적 균형 잡힌 구성이에요.")

        kisin_josa = NatalService.josa(kisin.meaning, "은", "는")
        sentences.append(
            f"균형을 잡아주는 처방은 용신 {yong.meaning}({yong.name}) — 색·방향·습관에서 가까이 두면 흐름이 가벼워지고, "
            f"기신 {kisin.meaning}({kisin.name}){kisin_josa} 가능한 멀리하면 좋아요."
        )

        if postnatal.samjae:
            stage = postnatal.samjae.get("type", "")
            if stage:
                sentences.append(
                    f"올해는 {stage} 흐름이라 큰 확장보다 내실 다지기에 집중하면 다음 도약의 발판이 돼요."
                )

        return " ".join(sentences)

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

    async def interpret_postnatal(self, natal: NatalInfo, postnatal: PostnatalInfo, name: str = "") -> PostnatalResult:
        current_ganji = postnatal.current_daeun.ganji if postnatal.current_daeun else None
        advice = AdviceInterpreter()(natal, postnatal)
        birth_branch_char = list(natal.saju.pillars.values())[0].branch.name
        me_yang = natal.saju.stem_of_day_pillar.is_yang

        seun_stem_char, seun_stem_sipsin = postnatal.seun_stem
        seun_branch_char, seun_branch_sipsin = postnatal.seun_branch
        seun_stem_dict = enrich_sipsin(
            seun_stem_sipsin, seun_stem_char, Stem.from_char(seun_stem_char).element.name,
            me_yang=me_yang, include_meaning=True,
        )
        seun_branch_dict = enrich_sipsin(
            seun_branch_sipsin, seun_branch_char, Branch.from_char(seun_branch_char).element.name,
            me_yang=me_yang, include_meaning=True,
        )
        daeun_sipsin = [
            enrich_sipsin(
                s, ch,
                (Stem.from_char(ch).element.name if i == 0 else Branch.from_char(ch).element.name),
                me_yang=me_yang, include_meaning=True,
            )
            for i, (ch, s) in enumerate(postnatal.daeun_sipsin)
        ]
        upcoming_months = postnatal.upcoming_months
        month_badges = self._build_month_badges(upcoming_months)
        year_zodiac_rows = self._build_year_zodiac_relations(birth_branch_char, postnatal.year)

        return PostnatalResult(
            year=postnatal.year,
            seun_ganji=year_to_ganji(postnatal.year),
            seun_stem=seun_stem_dict,
            seun_branch=seun_branch_dict,
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
            daeun_sipsin=daeun_sipsin,
            seun_clashes=postnatal.seun_clashes,
            seun_combines=postnatal.seun_combines,
            daeun_clashes=postnatal.daeun_clashes,
            daeun_combines=postnatal.daeun_combines,
            domain_scores=postnatal.domain_scores,
            samjae=postnatal.samjae,
            nearest_yongshin_year=self._find_nearest_yongshin_year(
                postnatal.year, year_to_ganji(postnatal.year), natal.yongshin
            ),
            upcoming_months=upcoming_months,
            month_badges=month_badges,
            year_zodiac_relations=year_zodiac_rows,
            year_zodiac_narrative=self._build_year_zodiac_narrative(year_zodiac_rows, name),
            core_summary=self._build_core_summary(natal, postnatal, name),
            yongshin=YongshinInterpreter()(natal, postnatal),
            fortune_by_domain=FortuneInterpreter()(postnatal),
            annual_fortune=SeunInterpreter()(natal, postnatal),
            samjae_fortune=SamjaeInterpreter()(natal, postnatal),
            major_fortune=DaeunInterpreter()(postnatal),
            relationships=RelationshipInterpreter()(natal, postnatal),
            advice=advice,
        )


class SajuService(InterpreterPort):
    """사주 분석 서비스 — Port를 주입받아 전체 분석 파이프라인을 수행한다."""

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

    def __init__(
        self,
        natal_port: NatalPort,
        postnatal_port: PostnatalPort,
        llm_port: LlmPort | None = None,
    ):
        self.natal_port = natal_port
        self.postnatal_port = postnatal_port
        self._llm_port = llm_port
        self._natal_svc = NatalService()
        self._postnatal_svc = PostnatalService(llm_port)

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

    def interpret_natal(self, natal: NatalInfo, birth_year: int = 0, is_male: bool = True, name: str = ""):
        return self._natal_svc.interpret_natal(natal, birth_year=birth_year, is_male=is_male, name=name)

    async def interpret_postnatal(self, natal: NatalInfo, postnatal: PostnatalInfo, name: str = ""):
        return await self._postnatal_svc.interpret_postnatal(natal, postnatal, name)

    async def interpret(
        self, natal: NatalInfo, postnatal: PostnatalInfo, user: User | None = None, name: str = ""
    ) -> Interpretation:
        birth_year = user.birth_dt.year if user else 0
        is_male = user.gender.is_male if user else True
        natal_result = self._natal_svc.interpret_natal(natal, birth_year=birth_year, is_male=is_male, name=name)
        postnatal_result = await self._postnatal_svc.interpret_postnatal(natal, postnatal, name)
        natal_result.narratives["yongshin_tip"] = build_yongshin_tip(natal, postnatal_result)
        return Interpretation(natal=natal_result, postnatal=postnatal_result)

    def build_chat_context(self, interpretation: Interpretation, user: User, name: str = "") -> str:
        natal = interpretation.natal
        post = interpretation.postnatal
        gender = "남" if user.gender.is_male else "여"
        birth = user.birth_dt.strftime("%Y-%m-%d %H:%M")

        pillar_str = " ".join(natal.pillars)
        yong = natal.yongshin_info
        kisin = natal.kisin_info
        elem_str = " ".join(f"{k}{v}" for k, v in natal.element_stats.items())

        lines: list[str] = [
            f"[{name or '?'} | {gender} | {birth} | {post.year}년 분석]",
            f"사주: {pillar_str} | 일간: {natal.day_stem}{natal.day_stem_korean}({natal.day_stem_yin_yang}) | {natal.strength_label}",
            f"오행: {elem_str} | 주오행: {natal.my_element.get('meaning', '')}",
            f"용신: {yong.get('meaning', '')}({yong.get('name', '')}) | 기신: {kisin.get('meaning', '')}({kisin.get('name', '')})",
        ]

        if natal.personality:
            desc = natal.personality[0].description
            lines.append(f"\n[성격] {desc[:120]}")

        _LEVEL_KOR = {"high": "좋음", "medium": "보통", "low": "주의"}
        if post.domain_scores:
            lines.append(f"\n[영역별 운] {post.year}년")
            for domain, info in post.domain_scores.items():
                score = info.get("score", 0)
                level = _LEVEL_KOR.get(info.get("level", ""), info.get("level", ""))
                reason = info.get("reason", "")
                lines.append(f"{domain} {score}({level}): {reason[:60]}")

        if post.samjae:
            samjae_type = post.samjae.get("type", "")
            sf_desc = post.samjae_fortune[0].description[:80] if post.samjae_fortune else ""
            lines.append(f"\n[삼재] {samjae_type}: {sf_desc}")
        else:
            lines.append("\n[삼재] 없음")

        daeun_line = "[대운] 없음"
        if post.current_daeun:
            d = post.current_daeun
            daeun_sip = ""
            if post.daeun_sipsin:
                names = "/".join(s.get("sipsin_korean", "") for s in post.daeun_sipsin[:2])
                daeun_sip = f" — {names}"
            daeun_line = f"[대운] {d['ganji']}({d['start_age']}~{d['end_age']}세){daeun_sip}"
        lines.append(daeun_line)

        seun_sip = f"{post.seun_stem.get('sipsin_korean', '')}/{post.seun_branch.get('sipsin_korean', '')}"
        seun_line = f"[세운] {post.seun_ganji} — {seun_sip}"
        if post.seun_clashes:
            clashes = " / ".join(c.get("narrative", "")[:40] for c in post.seun_clashes[:2])
            seun_line += f"\n  충: {clashes}"
        if post.seun_combines:
            combines = " / ".join(c.get("narrative", "")[:40] for c in post.seun_combines[:2])
            seun_line += f"\n  합: {combines}"
        lines.append(seun_line)

        if natal.zodiac and natal.zodiac.pillar_zodiacs:
            birth_z = natal.zodiac.pillar_zodiacs[0]
            z = birth_z.info
            compat = "·".join(z.compatible[:3]) if z.compatible else ""
            compat_str = f" {compat}와 잘 맞음" if compat else ""
            lines.append(f"\n[십이지신] {z.korean}({birth_z.branch}) — {z.keyword}.{compat_str}")
            if z.strength:
                lines.append(f"  강점: {z.strength[:60]}")
            if z.weakness:
                lines.append(f"  약점: {z.weakness[:60]}")

        if natal.sinsal:
            sinsal_str = " / ".join(s.get("sinsal_korean", "") for s in natal.sinsal)
            lines.append(f"신살: {sinsal_str}")

        return "\n".join(lines)

    async def build_report(self, user: User, year: int, name: str = "") -> dict[str, str]:
        natal_info, postnatal_info = self.analyze(user, year)
        interpretation = await self.interpret(natal_info, postnatal_info, user=user, name=name)
        report = LlmReportBuilder().build(interpretation.natal, interpretation.postnatal, user, name)
        result: dict[str, str] = {"report": report}
        if self._llm_port and self._llm_port.available:
            try:
                result["interpretation"] = await self._llm_port.interpret(report)
            except Exception:
                _log.exception("Ollama interpretation failed — report only")
        return result
