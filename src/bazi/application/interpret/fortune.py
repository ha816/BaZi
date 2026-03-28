from bazi.application.constant import (
    DOMAIN_MAP,
    MODERN_CAREER,
    MODERN_INVEST,
    MODERN_LIFESTYLE,
    SIPSIN_DETAIL,
)
from bazi.domain.natal import PostnatalInfo


def get_fortune_by_domain(postnatal: PostnatalInfo) -> list[str]:
    lines = []

    seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]
    daeun_sipsins = [sipsin for _, sipsin in postnatal.daeun_sipsin]

    for domain_name, domain_sipsins in DOMAIN_MAP.items():
        seun_match = [sipsin for sipsin in seun_sipsins if sipsin in domain_sipsins]
        daeun_match = [sipsin for sipsin in daeun_sipsins if sipsin in domain_sipsins]

        key_sipsin = (seun_match or daeun_match or [None])[0]
        if key_sipsin is None:
            continue

        influence = "세운과 대운 모두 영향" if seun_match and daeun_match \
            else "올해의 키워드" if seun_match \
            else "대운의 흐름"

        lines.append(f"[{domain_name}] {influence} — {key_sipsin.name}: {SIPSIN_DETAIL[key_sipsin]}")

        if domain_name == "재물운":
            lines.append(f"  💼 투자: {MODERN_INVEST[key_sipsin]}")
        elif domain_name == "직장·사회운":
            lines.append(f"  💼 커리어: {MODERN_CAREER[key_sipsin]}")
        elif domain_name == "학업·자격운":
            lines.append(f"  💼 커리어: {MODERN_CAREER[key_sipsin]}")
        elif domain_name in ("표현·건강운", "대인관계"):
            lines.append(f"  🌿 라이프: {MODERN_LIFESTYLE[key_sipsin]}")

    return lines
