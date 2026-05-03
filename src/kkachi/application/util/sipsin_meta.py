from kkachi.domain.ganji import Sipsin


_SIPSIN_KOREAN: dict[Sipsin, str] = {
    Sipsin.比肩: "비견", Sipsin.劫財: "겁재", Sipsin.食神: "식신", Sipsin.傷官: "상관",
    Sipsin.偏財: "편재", Sipsin.正財: "정재", Sipsin.偏官: "편관", Sipsin.正官: "정관",
    Sipsin.偏印: "편인", Sipsin.正印: "정인",
}

_SIPSIN_REL: dict[Sipsin, tuple[str, str, str]] = {
    # (rel, rel_kind, yinyang)
    Sipsin.比肩: ("같은 오행", "same",         "일치"),
    Sipsin.劫財: ("같은 오행", "same",         "다름"),
    Sipsin.食神: ("내가 도움", "help_out",     "일치"),
    Sipsin.傷官: ("내가 도움", "help_out",     "다름"),
    Sipsin.偏財: ("내가 억제", "restrain_out", "일치"),
    Sipsin.正財: ("내가 억제", "restrain_out", "다름"),
    Sipsin.偏官: ("나를 억제", "restrain_in",  "일치"),
    Sipsin.正官: ("나를 억제", "restrain_in",  "다름"),
    Sipsin.偏印: ("나를 도움", "help_in",      "일치"),
    Sipsin.正印: ("나를 도움", "help_in",      "다름"),
}

_SIPSIN_TIMING_MEANING: dict[Sipsin, str] = {
    Sipsin.比肩: "나와 같은 에너지가 들어오는 시기예요. 독립심과 자아가 강해지고, 주체적으로 길을 개척하게 돼요.",
    Sipsin.劫財: "경쟁과 나눔의 기운이에요. 협력하면 힘이 되지만, 재물이 새는 흐름도 있으니 지출을 점검해 봐요.",
    Sipsin.食神: "재능이 빛나고 먹을 복이 따르는 시기예요. 하고 싶은 것을 표현하고 베풀수록 더 많이 돌아와요.",
    Sipsin.傷官: "창의력과 개성이 폭발하는 시기예요. 틀을 깨는 에너지가 강하지만, 조직 내 마찰은 주의해야 해요.",
    Sipsin.偏財: "적극적인 재물 운이 따르는 시기예요. 투자·사업·새로운 기회에 민감하게 반응하면 좋아요.",
    Sipsin.正財: "안정적인 수입과 저축의 기운이에요. 꾸준히 성실하게 쌓아가면 재물이 단단해져요.",
    Sipsin.偏官: "강한 자극과 도전이 오는 시기예요. 압박감이 있지만 그 안에 성장의 기회가 숨어 있어요.",
    Sipsin.正官: "명예와 책임의 기운이에요. 사회적 인정을 받거나 직책·역할의 변화가 찾아올 수 있어요.",
    Sipsin.偏印: "직관과 학문의 기운이에요. 공부·연구·자기계발에 집중하기 좋고, 전문성이 쌓이는 시기예요.",
    Sipsin.正印: "배움과 보호의 기운이에요. 어른이나 스승의 도움을 받을 수 있고, 마음이 안정되는 시기예요.",
}

_SIPSIN_DOMAIN: dict[Sipsin, str] = {
    Sipsin.偏財: "재물운", Sipsin.正財: "재물운",
    Sipsin.偏官: "직장·사회운", Sipsin.正官: "직장·사회운",
    Sipsin.偏印: "학업·자격운", Sipsin.正印: "학업·자격운",
    Sipsin.食神: "표현·건강운", Sipsin.傷官: "표현·건강운",
    Sipsin.比肩: "대인관계", Sipsin.劫財: "대인관계",
}


def sipsin_korean(sipsin: Sipsin) -> str:
    return _SIPSIN_KOREAN[sipsin]


def sipsin_label(sipsin: Sipsin) -> str:
    """한국음(한자) 형태 — 예: 편재(偏財)."""
    return f"{_SIPSIN_KOREAN[sipsin]}({sipsin.name})"


def sipsin_timing_meaning(sipsin: Sipsin) -> str:
    return _SIPSIN_TIMING_MEANING[sipsin]


def sipsin_domain(sipsin: Sipsin) -> str:
    """이 십신이 영향을 미치는 영역명 (DomainBarChart 키와 일치)."""
    return _SIPSIN_DOMAIN[sipsin]


def enrich_sipsin(
    sipsin: Sipsin,
    char: str,
    element: str,
    *,
    me_yang: bool,
    include_meaning: bool = False,
) -> dict:
    """SipsinInfo dict에 한국음·관계·음양·시기 의미를 채워 반환한다."""
    rel, rel_kind, yinyang = _SIPSIN_REL[sipsin]
    same = yinyang == "일치"
    target_yang = me_yang if same else not me_yang
    payload = {
        "char": char,
        "sipsin_name": sipsin.name,
        "sipsin_korean": _SIPSIN_KOREAN[sipsin],
        "domain": sipsin.domain,
        "element": element,
        "rel": rel,
        "rel_kind": rel_kind,
        "yinyang": yinyang,
        "target_yin_yang": "양" if target_yang else "음",
    }
    if include_meaning:
        payload["timing_meaning"] = _SIPSIN_TIMING_MEANING[sipsin]
    return payload
