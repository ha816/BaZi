from __future__ import annotations

import logging

from kkachi.application.interpreter.advice import AdviceInterpreter
from kkachi.application.interpreter.daeun import DaeunInterpreter
from kkachi.application.interpreter.fengshui import FengShuiInterpreter
from kkachi.application.interpreter.fortune import FortuneInterpreter
from kkachi.application.interpreter.natal import (
    core_summary as _core_summary,
    month_badges as _month_badges,
    pillar_summary as _pillar_summary,
    year_zodiac_narrative as _year_zodiac_narrative,
    year_zodiac_relations as _year_zodiac_relations,
    zodiac_relation as _zodiac_relation_text,
)
from kkachi.application.interpreter.yongshin import find_nearest_yongshin_year as _find_nearest_yongshin_year
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
from kkachi.application.util.sipsin_meta import enrich_sipsin
from kkachi.application.util.util import year_to_ganji
from kkachi.domain.ganji import JIZAN_ROLE_HANJA, OHENG_GUIDE, Branch, Stem
from kkachi.domain.interpretation import InterpretBlock, Interpretation, NatalResult, PostnatalResult
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User

_log = logging.getLogger(__name__)


class NatalService:
    """선천(先天) 해석 — NatalInfo → NatalResult 조립."""

    def interpret_natal(self, natal: NatalInfo, birth_year: int = 0, is_male: bool = True, name: str = "") -> NatalResult:
        day_stem = natal.saju.stem_of_day_pillar
        pillar_elements = [
            {"stem_element": sb.stem.element.name, "branch_element": sb.branch.element.name}
            for sb in natal.saju.pillars.values()
        ]
        pillar_stems_korean = [sb.stem.korean for sb in natal.saju.pillars.values()]
        pillar_branches_korean = [sb.branch.korean for sb in natal.saju.pillars.values()]
        kisin = natal.yongshin.overcome_by
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
            yongshin_guide=OHENG_GUIDE.get(natal.yongshin, {}),
            kisin_guide=OHENG_GUIDE.get(kisin, {}),
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
            pillar_summary=_pillar_summary(natal),
            narratives=NatalNarrativeInterpreter()(natal, name),
            personality=PersonalityInterpreter()(natal),
            element_balance=ElementBalanceInterpreter()(natal),
            feng_shui=FengShuiInterpreter()(natal, birth_year, is_male),
            zodiac=ZodiacInterpreter()(natal, name),
        )


class PostnatalService:
    """후천(後天) 해석 — NatalInfo + PostnatalInfo → PostnatalResult 조립."""

    def __init__(self, llm_port: LlmPort | None = None):
        self._llm_port = llm_port

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
        month_badges_result = _month_badges(upcoming_months)
        year_zodiac_rows = _year_zodiac_relations(birth_branch_char, postnatal.year)

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
            nearest_yongshin_year=_find_nearest_yongshin_year(
                postnatal.year, year_to_ganji(postnatal.year), natal.yongshin
            ),
            upcoming_months=upcoming_months,
            month_badges=month_badges_result,
            year_zodiac_relations=year_zodiac_rows,
            year_zodiac_narrative=_year_zodiac_narrative(year_zodiac_rows, name),
            core_summary=_core_summary(natal, postnatal, name),
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

    def basic_analyze(self, user: User, year: int) -> dict:
        natal = self.natal_port.analyze(user)
        birth_branch = list(natal.saju.pillars.values())[0].branch
        return {
            "pillars": [str(sb) for sb in natal.saju.pillars.values()],
            "day_stem": natal.saju.stem_of_day_pillar.name,
            "element_stats": {o.name: c for o, c in natal.element_stats.items()},
            "my_element": {"name": natal.my_main_element.name, "meaning": natal.my_main_element.meaning},
            "year_branch": birth_branch.name,
            "zodiac_relation": _zodiac_relation_text(birth_branch, year),
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
