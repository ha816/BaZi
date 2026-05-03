from kkachi.domain.interpretation import PostnatalResult
from kkachi.domain.natal import NatalInfo


_STRENGTH_DESC: dict[str, str] = {
    "신강(身強)": "타고난 에너지가 강하고 자기 주도적인 성향이에요.",
    "신약(身弱)": "주변 환경의 영향을 잘 받고 협력에서 힘을 발휘해요.",
    "중화(中和)": "기운이 고르게 균형 잡혀 안정적인 사주예요.",
}

_STRENGTH_TIP: dict[str, str] = {
    "신강(身強)": "일간의 기운이 강한 편이에요. 에너지를 쏟을 방향을 잘 고르는 게 중요해요.",
    "신약(身弱)": "일간의 기운이 약한 편이에요. 나를 지지해주는 환경과 사람을 잘 고르면 훨씬 잘 발휘돼요.",
    "중화(中和)": "일간의 기운이 균형 잡힌 상태예요. 폭넓은 환경에서 두루 안정적인 성과를 낼 수 있는 타입입니다.",
}

_YONGSHIN_COLOR: dict[str, str] = {
    "木": "초록·청록", "火": "빨강·주황", "土": "노랑·갈색",
    "金": "흰색·은색", "水": "검정·남색",
}

_ELEMENT_TIP: dict[str, tuple[str, str, str]] = {
    "木": ("진취적인 추진력과 창의성", "성급함과 지속력 부족", "꾸준히 뿌리를 내리는 과정을 즐긴다면 큰 성장을 이룰 수 있어요."),
    "火": ("열정과 뛰어난 표현력", "감정 기복과 충동적인 결정", "열정을 유지하면서도 차분히 결과를 살피는 습관을 들이면 더욱 빛납니다."),
    "土": ("신중함과 책임감", "보수성과 변화에 대한 저항", "자신의 안정감을 바탕으로 타인을 배려하는 마음을 더한다면 더욱 발전할 수 있어요."),
    "金": ("결단력과 원칙에 대한 의지", "지나친 고집과 냉정함", "원칙을 지키면서도 유연하게 소통한다면 주변의 신뢰를 더욱 얻게 됩니다."),
    "水": ("뛰어난 지혜와 유연한 적응력", "우유부단함과 과도한 걱정", "깊은 통찰력을 믿고 흐름에 몸을 맡기면 자연스럽게 길이 열려요."),
}

_PILLAR_ERA: dict[str, tuple[str, str]] = {
    "년주": ("초년", "조상·뿌리·환경"),
    "월주": ("청년기", "사회·직장"),
    "일주": ("장년기", "자기 본성·배우자"),
    "시주": ("말년", "자녀·결실"),
}
_PILLAR_ORDER: list[str] = ["년주", "월주", "일주", "시주"]

_UNSEONG_KOREAN: dict[str, str] = {
    "長生": "장생", "沐浴": "목욕", "冠帶": "관대", "建祿": "건록",
    "帝旺": "제왕", "衰": "쇠", "病": "병", "死": "사",
    "墓": "묘", "絕": "절", "胎": "태", "養": "양",
}
_UNSEONG_VERB: dict[str, str] = {
    "長生": "갓 시작되는",
    "沐浴": "들떠 있는",
    "冠帶": "의욕이 폭발하는",
    "建祿": "단단히 자립하는",
    "帝旺": "절정을 찍는",
    "衰":   "노련하게 조율하는",
    "病":   "감수성이 깊어지는",
    "死":   "고요히 멈추는",
    "墓":   "내공을 쌓는",
    "絕":   "완전히 끊고 새로 시작하는",
    "胎":   "씨앗을 품는",
    "養":   "보호받으며 자라는",
}

_SIBI_SINSAL_HANJA: dict[str, str] = {
    "겁살": "劫殺", "재살": "災殺", "천살": "天殺", "지살": "地殺",
    "년살": "年殺", "월살": "月殺", "망신살": "亡身殺", "장성살": "將星殺",
    "반안살": "攀鞍殺", "역마살": "驛馬殺", "육해살": "六害殺", "화개살": "華蓋殺",
}
_SIBI_SINSAL_MEANING: dict[str, str] = {
    "겁살": "빼앗김·사고·도난 주의",
    "재살": "재앙·갈등의 기운",
    "천살": "하늘이 내리는 변고",
    "지살": "이동·변동·출장",
    "년살": "매력·인기·도화",
    "월살": "어두운 그림자·우울",
    "망신살": "체면 손상·구설",
    "장성살": "리더십·권위·결단력",
    "반안살": "출세·승진·명예",
    "역마살": "이동·변화·해외",
    "육해살": "방해·갈등·장애물",
    "화개살": "예술·학문·고독",
}

_SIPSIN_CATEGORIES: list[tuple[str, str, str, list[str]]] = [
    ("자아", "自我", "주체성, 경쟁력", ["比肩", "劫財"]),
    ("출력", "出力", "자기표현, 재능", ["食神", "傷官"]),
    ("재물", "財物", "성과, 결과", ["正財", "偏財"]),
    ("권위", "權威", "체계, 책임", ["正官", "偏官"]),
    ("입력", "入力", "수용, 학습", ["正印", "偏印"]),
]


def _first_keyword(keyword: str) -> str:
    return keyword.split(",")[0].strip()


def _josa_neun(text: str) -> str:
    """은/는 자동 선택 — 마지막 글자 받침 유무로 판별."""
    if not text:
        return "은"
    code = ord(text[-1])
    has_jongseong = 0xAC00 <= code <= 0xD7A3 and (code - 0xAC00) % 28 != 0
    return "은" if has_jongseong else "는"


_UNSEONG_ENDINGS: list[str] = ["시기예요", "단계예요", "흐름이에요"]
_SINSAL_ENDINGS: list[str] = ["결이 짙어요", "기운이 강해요", "흐름이 두드러져요"]


def build_yongshin_tip(natal: NatalInfo, postnatal_result: PostnatalResult | None = None) -> str:
    """용신 까치 툴팁 — 정적 부분(일간·강약·색깔) + postnatal 있으면 시점 정보(이번달/올해 매칭, 가까운 용신 달·해)."""
    day_stem = natal.saju.stem_of_day_pillar
    ys = natal.yongshin
    color = _YONGSHIN_COLOR.get(ys.name, "")

    parts: list[str] = [
        f"나의 기운({day_stem.korean}({day_stem.name}))은 "
        f"{natal.strength_label}으로, {ys.meaning}({ys.name}) 기운이 가장 잘 도와줘요."
    ]
    if color:
        parts.append(f"{color} 같은 색을 일상에 가까이 두면 그 결이 자연스럽게 들어와요.")

    if postnatal_result is None:
        return " ".join(parts)

    months = postnatal_result.upcoming_months or []
    current = months[0] if months else None
    current_match = bool(current and current.get("matches_yongshin"))
    upcoming_match = [m for m in months[1:] if m.get("matches_yongshin")]

    if current_match and current is not None:
        parts.append(
            f"마침 **이번 달({current['month']}월)**이 용신 기운이 들어오는 시기라 흐름이 가벼워질 거예요."
        )
    elif postnatal_result.yongshin_in_seun:
        parts.append(f"**올해({postnatal_result.year}년)**는 용신의 해라 큰 흐름이 좋아요.")

    timing: list[str] = []
    if upcoming_match:
        m_strs = "·".join(f"{m['month']}월" for m in upcoming_match[:2])
        prefix = "다음" if current_match else "가까운"
        timing.append(f"{prefix} 용신의 달은 **{m_strs}**이에요.")
    if postnatal_result.nearest_yongshin_year:
        timing.append(f"가까운 용신의 해는 **{postnatal_result.nearest_yongshin_year}년**이에요.")
    if timing:
        parts.append(" ".join(timing))

    return " ".join(parts)


class NatalNarrativeInterpreter:
    """사주별 동적 풀이 텍스트 생성기 — 카드 인트로·스토리를 plain text로 합성."""

    def __call__(self, natal: NatalInfo, name: str = "") -> dict[str, str]:
        return {
            "pillar_tip": self._pillar_tip(natal, name),
            "ohaeng_tip": self._ohaeng_tip(natal, name),
            "sipsin_story": self._sipsin_story(natal, name),
            "unseong_story": self._unseong_story(natal, name),
            "sibi_sinsal_story": self._sibi_sinsal_story(natal, name),
            "sinsal_narrative": self._sinsal_narrative(natal, name),
            "strength_tip": self._strength_tip(natal),
            "yongshin_tip": self._yongshin_tip(natal, name),
        }

    def _strength_tip(self, natal: NatalInfo) -> str:
        return _STRENGTH_TIP.get(natal.strength_label, _STRENGTH_TIP["중화(中和)"])

    def _yongshin_tip(self, natal: NatalInfo, name: str) -> str:
        return build_yongshin_tip(natal, postnatal_result=None)

    def _pillar_tip(self, natal: NatalInfo, name: str) -> str:
        day_stem = natal.saju.stem_of_day_pillar
        prefix = f"{name}님을 " if name else "이 사주를 "
        personal = f"{prefix}나타내는 글자는 {day_stem.korean}({day_stem.name})이에요."
        concept = "태어난 날(日柱)의 천간(天干)이 자신을 나타냅니다."
        strength = _STRENGTH_DESC.get(natal.strength_label, "")
        return " ".join(s for s in (personal, concept, strength) if s)

    def _ohaeng_tip(self, natal: NatalInfo, name: str) -> str:
        elem = natal.my_main_element.name
        meaning = natal.my_main_element.meaning
        tip = _ELEMENT_TIP.get(elem)
        if not tip:
            return ""
        strength, caution, advice = tip
        prefix = f"{name}님은 " if name else ""
        return f"{prefix}{meaning}({elem}) 기운으로서 {strength}을 잘 발휘하시되, {caution}에 주의하세요. {advice}"

    def _sipsin_story(self, natal: NatalInfo, name: str) -> str:
        if not natal.sipsin:
            return ""
        cat_counts: list[tuple[str, str, str, int]] = []
        for label, hanja, keyword, members in _SIPSIN_CATEGORIES:
            count = sum(1 for _, s in natal.sipsin if s.name in members)
            cat_counts.append((label, hanja, keyword, count))

        strong = [c for c in cat_counts if c[3] >= 2]
        missing = [c for c in cat_counts if c[3] == 0]
        prefix = f"{name}님 사주는 " if name else "이 사주는 "

        if len(strong) >= 2:
            labels = "·".join(c[0] for c in strong)
            keywords = "과 ".join(_first_keyword(c[2]) for c in strong)
            core = f"{labels}이(가) 두드러지는 사주예요. {keywords}이 동시에 살아 있어 자기 페이스로 영역을 끌어가는 흐름입니다."
        elif len(strong) == 1:
            label, hanja, keyword, _ = strong[0]
            core = f"{label}({hanja})이 가장 두드러지는 사주예요. {_first_keyword(keyword)} 영역에서 자기 색이 가장 잘 살아납니다."
        else:
            core = "다섯 카테고리에 한 글자씩 골고루 들어 있는 균형형이에요. 어느 한쪽으로 치우치지 않고 다양한 영역을 두루 경험하는 흐름입니다."

        if 0 < len(missing) < 5:
            missing_labels = "·".join(c[0] for c in missing)
            missing_keywords = "·".join(_first_keyword(c[2]) for c in missing)
            tail = f" 단, {missing_labels} 자리는 비어 있어, {missing_keywords} 영역에선 환경·사람의 도움을 활용하면 좋아요."
        else:
            tail = ""
        return f"{prefix}{core}{tail}"

    def _unseong_story(self, natal: NatalInfo, name: str) -> str:
        segments: list[tuple[str, str, str, str, str]] = []  # (era, realm, hanja, korean, verb)
        unseong_by_pillar = {p: u for p, u in natal.sibi_unseong}
        for pillar in _PILLAR_ORDER:
            u = unseong_by_pillar.get(pillar)
            if u is None:
                continue
            era, realm = _PILLAR_ERA.get(pillar, (pillar, ""))
            segments.append((
                era, realm, u.name,
                _UNSEONG_KOREAN.get(u.name, u.name),
                _UNSEONG_VERB.get(u.name, ""),
            ))
        if not segments:
            return ""

        groups: list[dict] = []
        for era, realm, hanja, korean, verb in segments:
            if groups and groups[-1]["hanja"] == hanja:
                groups[-1]["eras"].append(era)
                groups[-1]["realms"].append(realm)
            else:
                groups.append({"eras": [era], "realms": [realm], "hanja": hanja, "korean": korean, "verb": verb})

        parts: list[str] = []
        for i, g in enumerate(groups):
            is_first = i == 0
            is_last = i == len(groups) - 1 and len(groups) > 1
            linker = "" if is_first else (" 그러다 " if is_last else " 이어서 ")
            era_text = "·".join(g["eras"])
            realm_text = "·".join(dict.fromkeys(seg for r in g["realms"] for seg in r.split("·")))
            josa = "는 모두" if len(g["eras"]) > 1 else _josa_neun(era_text)
            ending = _UNSEONG_ENDINGS[i % len(_UNSEONG_ENDINGS)]
            realm_part = f"{realm_text} 영역에서 " if realm_text else ""
            parts.append(f"{linker}{era_text}{josa} {g['korean']}({g['hanja']}) — {realm_part}{g['verb']} {ending}.")
        return "".join(parts)

    def _sibi_sinsal_story(self, natal: NatalInfo, name: str) -> str:
        order: list[tuple[int, str, str]] = [
            (0, "초년", "조상·뿌리·환경"),
            (1, "청년기", "사회·직장"),
            (2, "장년기", "자기 본성·배우자"),
            (3, "말년", "자녀·결실"),
        ]
        segments: list[tuple[str, str, str, str, str]] = []  # (era, realm, sName, hanja, meaning)
        for idx, era, realm in order:
            if idx >= len(natal.sibi_sinsal):
                continue
            s_name = natal.sibi_sinsal[idx]
            if not s_name:
                continue
            segments.append((
                era, realm, s_name,
                _SIBI_SINSAL_HANJA.get(s_name, ""),
                _SIBI_SINSAL_MEANING.get(s_name, ""),
            ))
        if not segments:
            return ""

        groups: list[dict] = []
        for era, realm, s_name, hanja, meaning in segments:
            if groups and groups[-1]["sName"] == s_name:
                groups[-1]["eras"].append(era)
                groups[-1]["realms"].append(realm)
            else:
                groups.append({
                    "eras": [era], "realms": [realm],
                    "sName": s_name, "hanja": hanja, "meaning": meaning,
                })

        parts: list[str] = []
        for i, g in enumerate(groups):
            is_first = i == 0
            is_last = i == len(groups) - 1 and len(groups) > 1
            linker = "" if is_first else (" 그러다 " if is_last else " 이어서 ")
            era_text = "·".join(g["eras"])
            realm_text = "·".join(dict.fromkeys(seg for r in g["realms"] for seg in r.split("·")))
            josa = "는 모두" if len(g["eras"]) > 1 else _josa_neun(era_text)
            hanja_part = f"({g['hanja']})" if g["hanja"] else ""
            ending = _SINSAL_ENDINGS[i % len(_SINSAL_ENDINGS)]
            realm_part = f"{realm_text} 영역에서 " if realm_text else ""
            parts.append(f"{linker}{era_text}{josa} {g['sName']}{hanja_part} — {realm_part}{g['meaning']}의 {ending}.")
        return "".join(parts)

    def _sinsal_narrative(self, natal: NatalInfo, name: str) -> str:
        if not natal.sinsal:
            return ""
        unique_names = list(dict.fromkeys(s.korean for _, s in natal.sinsal))
        names_text = ", ".join(unique_names)
        subject = f"{name}님" if name else "이 사주"
        return f"{subject} 사주에 {names_text}이 있어요. 이 특별한 기운을 잘 활용하면 타고난 캐릭터성을 살릴 수 있어요."
