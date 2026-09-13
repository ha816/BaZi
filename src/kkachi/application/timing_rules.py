from kkachi.application.util.sipsin_meta import sipsin_label
from kkachi.domain.ganji import Branch, Sipsin, Stem
from kkachi.domain.natal import NatalInfo, Sinsal

TIMING_DOMAINS: list[str] = ["이직·직업", "연애·결혼", "이사·계약", "시험·공부", "투자·재물", "건강"]

# 영역별 십신 가중 — 월 천간·지지 십신에 각각 적용. 양수는 밀어주는 십신, 음수는 흔드는 십신.
_DOMAIN_SIPSIN: dict[str, dict[Sipsin, int]] = {
    "이직·직업": {Sipsin.正官: 10, Sipsin.偏官: 5, Sipsin.正印: 5, Sipsin.偏財: 3, Sipsin.傷官: -8, Sipsin.劫財: -4},
    "연애·결혼": {Sipsin.食神: 5, Sipsin.正印: 2, Sipsin.比肩: -3, Sipsin.劫財: -5, Sipsin.傷官: -4},
    "이사·계약": {Sipsin.正財: 6, Sipsin.正官: 6, Sipsin.正印: 4, Sipsin.偏官: -6, Sipsin.劫財: -5},
    "시험·공부": {Sipsin.正印: 10, Sipsin.偏印: 7, Sipsin.食神: 3, Sipsin.正官: 3, Sipsin.偏財: -6, Sipsin.傷官: -4, Sipsin.劫財: -3},
    "투자·재물": {Sipsin.偏財: 10, Sipsin.正財: 9, Sipsin.食神: 5, Sipsin.劫財: -10, Sipsin.比肩: -5, Sipsin.偏官: -4},
    "건강": {Sipsin.正印: 4, Sipsin.食神: 3, Sipsin.偏官: -8, Sipsin.傷官: -4, Sipsin.劫財: -3},
}
# 배우자 성(星): 남자는 재성(財星), 여자는 관성(官星) — 연애·결혼에만 가산
_SPOUSE_STAR: dict[bool, dict[Sipsin, int]] = {
    True: {Sipsin.正財: 10, Sipsin.偏財: 6},
    False: {Sipsin.正官: 10, Sipsin.偏官: 6},
}
# 5명 샘플 분포(p50 52·p75 60·p90 65)에서 좋음·피할 각 ~19%(영역당 연 2~3달)가 되도록 잡은 임계값
_LEVEL_GOOD, _LEVEL_AVOID = 62, 42

_TIPS: dict[str, dict[str, str]] = {
    "이직·직업": {
        "좋음": "면접·제안·연봉 협상처럼 나를 드러내는 일을 이 달에 잡으세요.",
        "보통": "결정은 서두르지 말고 포트폴리오·네트워크를 다듬는 달로 쓰세요.",
        "피할": "사직·이직 통보는 다음 좋은 달로 미루고 현재 자리를 지키세요.",
    },
    "연애·결혼": {
        "좋음": "소개·고백·상견례처럼 관계를 한 단계 옮기는 약속을 잡기 좋아요.",
        "보통": "새 인연보다 지금 관계의 대화 시간을 늘리는 달로 쓰세요.",
        "피할": "감정이 엇갈리기 쉬워요. 큰 결정과 다툼이 될 대화는 미루세요.",
    },
    "이사·계약": {
        "좋음": "계약·입주·개업 날짜를 이 달 안에서 고르세요. 손없는 날과 겹치면 더 좋아요.",
        "보통": "조건 비교와 서류 준비를 끝내 두고 실행은 좋은 달로 넘기세요.",
        "피할": "계약서 서명·이동은 피하고, 이미 잡혔다면 조항을 한 번 더 확인하세요.",
    },
    "시험·공부": {
        "좋음": "시험·자격 접수와 집중 학습을 이 달에 몰아 배치하세요.",
        "보통": "새 과정을 시작하기보다 복습·정리로 기반을 다지는 달이에요.",
        "피할": "집중이 흩어지기 쉬워요. 큰 시험은 피하고 컨디션 관리에 무게를 두세요.",
    },
    "투자·재물": {
        "좋음": "투자 결정·수입 협상·재무 계획 수립에 유리한 달이에요.",
        "보통": "현금 흐름을 점검하고 큰 지출은 한 박자 늦추세요.",
        "피할": "새 투자·보증·큰 지출은 피하세요. 지갑이 새기 쉬운 달이에요.",
    },
    "건강": {
        "좋음": "운동 시작·건강검진·생활 리듬 재정비에 좋은 달이에요.",
        "보통": "무리 없는 루틴 유지가 답이에요. 수면과 식사를 지키세요.",
        "피할": "과로·수술·위험한 활동은 피하고 몸 신호에 민감해지세요.",
    },
}


def _level(score: int) -> str:
    if score >= _LEVEL_GOOD:
        return "좋음"
    if score <= _LEVEL_AVOID:
        return "피할"
    return "보통"


def compute_timing(natal: NatalInfo, months: list[dict], is_male: bool = True) -> dict[str, list[dict]]:
    """영역별 12개월 타이밍 점수 (ROADMAP R3).

    각 달은 50점에서 시작해 ① 월 천간·지지 십신의 영역 가중 ② 배우자 성(연애·결혼) ③ 용신/기신 오행
    ④ 월지와 내 일지의 육합·충 ⑤ 월지가 일지 기준 역마·도화, 일간 기준 문창귀인인지 를 더해 0~100으로 자른다.
    reason은 실제로 작동한 요인만 나열해 '왜 이 달인지'가 보이게 한다. months 각 항목은 year·month·ganji만 있으면 된다.
    """
    day_stem = natal.saju.stem_of_day_pillar
    day_branch = natal.saju.pillars[list(natal.saju.pillars)[2]].branch  # 일주는 항상 3번째
    yong = natal.yongshin
    kisin = yong.overcome_by
    spouse = _SPOUSE_STAR[is_male]

    result: dict[str, list[dict]] = {d: [] for d in TIMING_DOMAINS}
    for m in months:
        ganji = m["ganji"]
        stem, branch = Stem.from_char(ganji[0]), Branch.from_char(ganji[1])
        sipsins = [Sipsin.of(day_stem, stem), Sipsin.of(day_stem, branch)]
        elements = {stem.element, branch.element}
        combine = branch.combines == day_branch
        clash = branch.clashes == day_branch
        samhap_sinsal = {s for _, s in Sinsal.get_samhap(day_branch, [branch])}
        munchang = any(s is Sinsal.文昌貴人 for _, s in Sinsal.get_guiin(day_stem, [branch]))

        for domain in TIMING_DOMAINS:
            score = 50
            reasons: list[str] = []
            for s in sipsins:
                w = _DOMAIN_SIPSIN[domain].get(s, 0)
                if domain == "연애·결혼":
                    w += spouse.get(s, 0)
                if w:
                    score += w
                    reasons.append(f"{sipsin_label(s)} 월{'' if w > 0 else '(흔듦)'}")
            if yong in elements:
                score += 10
                reasons.append(f"용신 {yong.name}({yong.meaning}) 달")
            elif kisin in elements:
                score -= 8
                reasons.append(f"기신 {kisin.name}({kisin.meaning}) 달")
            if combine:
                score += 10 if domain == "연애·결혼" else 6
                reasons.append(f"월지 {branch.korean}({branch.name})·내 일지 육합(六合)")
            if clash:
                score -= 12 if domain == "이사·계약" else 8
                reasons.append(f"월지 {branch.korean}({branch.name})·내 일지 충(衝)")
            if Sinsal.驛馬 in samhap_sinsal and domain in ("이사·계약", "이직·직업"):
                score += 8 if domain == "이사·계약" else 4
                reasons.append("역마살(驛馬殺) 달 — 이동 기운")
            if Sinsal.桃花 in samhap_sinsal and domain == "연애·결혼":
                score += 6
                reasons.append("도화살(桃花殺) 달 — 매력 기운")
            if munchang and domain == "시험·공부":
                score += 8
                reasons.append("문창귀인(文昌貴人) 달 — 문서·시험 기운")

            score = max(0, min(100, score))
            level = _level(score)
            result[domain].append({
                "year": m["year"],
                "month": m["month"],
                "ganji": ganji,
                "ganji_korean": stem.korean + branch.korean,
                "score": score,
                "level": level,
                "reason": " · ".join(dict.fromkeys(reasons)) or "특별한 작용 없이 잔잔한 달",
                "tip": _TIPS[domain][level],
            })
    return result


def timing_digest(timing: dict[str, list[dict]]) -> list[str]:
    """LLM 컨텍스트·리포트용 한 줄 요약 — 영역: 좋음 N월·M월 / 피할 K월."""
    lines: list[str] = []
    for domain, months in timing.items():
        good = [f"{x['month']}월" for x in months if x["level"] == "좋음"]
        avoid = [f"{x['month']}월" for x in months if x["level"] == "피할"]
        lines.append(f"{domain}: 좋음 {'·'.join(good) or '없음'} / 피할 {'·'.join(avoid) or '없음'}")
    return lines


def timing_highlight(timing: dict[str, list[dict]]) -> str:
    """한눈에 허브용 택시 한 줄 — 좋은 달이 있는 영역 몇 개만 골라 요약."""
    picks: list[str] = []
    for domain, months in timing.items():
        good = [f"{m['month']}월" for m in months if m["level"] == "좋음"]
        if good:
            picks.append(f"{domain} {'·'.join(good[:3])}")
        if len(picks) >= 3:
            break
    if not picks:
        return "앞으로 12개월엔 크게 밀어주는 달이 도드라지진 않아요. 무난한 달에 차분히 진행하세요."
    return "좋은 달 — " + ", ".join(picks) + " 등. 영역별 12개월 흐름을 눌러 확인해 보세요."
