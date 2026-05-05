from __future__ import annotations

import logging

from kkachi.application.interpreter.narrative import build_yongshin_tip
from kkachi.application.natal_service import NatalService
from kkachi.application.port.llm_port import LlmPort
from kkachi.application.port.saju_port import InterpreterPort, NatalPort, PostnatalPort
from kkachi.application.postnatal_service import PostnatalService
from kkachi.application.report_builder import LlmReportBuilder
from kkachi.application.util.util import year_to_ganji
from kkachi.domain.ganji import Branch
from kkachi.domain.interpretation import Interpretation
from kkachi.domain.natal import NatalInfo, PostnatalInfo
from kkachi.domain.user import User

_log = logging.getLogger(__name__)


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

        # 성격
        if natal.personality:
            desc = natal.personality[0].description
            lines.append(f"\n[성격] {desc[:120]}")

        # 영역별 운
        _LEVEL_KOR = {"high": "좋음", "medium": "보통", "low": "주의"}
        if post.domain_scores:
            lines.append(f"\n[영역별 운] {post.year}년")
            for domain, info in post.domain_scores.items():
                score = info.get("score", 0)
                level = _LEVEL_KOR.get(info.get("level", ""), info.get("level", ""))
                reason = info.get("reason", "")
                lines.append(f"{domain} {score}({level}): {reason[:60]}")

        # 삼재
        if post.samjae:
            samjae_type = post.samjae.get("type", "")
            sf_desc = post.samjae_fortune[0].description[:80] if post.samjae_fortune else ""
            lines.append(f"\n[삼재] {samjae_type}: {sf_desc}")
        else:
            lines.append("\n[삼재] 없음")

        # 대운·세운
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

        # 십이지신
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

        # 신살
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
