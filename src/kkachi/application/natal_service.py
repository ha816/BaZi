from __future__ import annotations

from kkachi.application.interpreter.fengshui import FengShuiInterpreter
from kkachi.application.interpreter.narrative import NatalNarrativeInterpreter
from kkachi.application.interpreter.personality import ElementBalanceInterpreter, PersonalityInterpreter
from kkachi.application.interpreter.zodiac import ZodiacInterpreter
from kkachi.domain.ganji import JIZAN_ROLE_HANJA, Branch, Oheng, Stem
from kkachi.domain.interpretation import NatalResult
from kkachi.domain.natal import NatalInfo


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
