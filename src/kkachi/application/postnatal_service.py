from __future__ import annotations

import logging
from dataclasses import asdict

from kkachi.application.interpreter.advice import AdviceInterpreter
from kkachi.application.interpreter.daeun import DaeunInterpreter
from kkachi.application.interpreter.fortune import FortuneInterpreter
from kkachi.application.interpreter.relationship import RelationshipInterpreter
from kkachi.application.interpreter.samjae import SamjaeInterpreter
from kkachi.application.interpreter.seun import SeunInterpreter
from kkachi.application.interpreter.yongshin import YongshinInterpreter
from kkachi.application.natal_service import NatalService
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.util.sipsin_meta import enrich_sipsin, sipsin_domain, sipsin_label
from kkachi.application.util.util import year_to_ganji
from kkachi.application.util.zodiac_meta import zodiac_info
from kkachi.domain.ganji import Branch, Oheng, Sipsin, Stem
from kkachi.domain.interpretation import InterpretBlock, PostnatalResult
from kkachi.domain.natal import NatalInfo, PostnatalInfo

_log = logging.getLogger(__name__)


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
