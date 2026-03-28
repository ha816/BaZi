from __future__ import annotations

from pydantic import BaseModel, Field

from bazi.application.interpret import DOMAIN_MAP, Interpretation
from bazi.domain.ganji import Stem, Branch
from bazi.domain.natal import NatalInfo, PostnatalInfo


class AnalysisRequest(BaseModel):
    birth_year: int
    birth_month: int
    birth_day: int
    birth_hour: int
    birth_minute: int = 0
    gender: str = Field(pattern=r"^(male|female)$")
    analysis_year: int = 2026
    city: str = "Seoul"


class OhengInfo(BaseModel):
    name: str
    meaning: str


class SipsinInfo(BaseModel):
    char: str
    sipsin_name: str
    domain: str


class SibiUnseongInfo(BaseModel):
    pillar: str
    unseong_name: str
    meaning: str


class SinsalInfo(BaseModel):
    branch: str
    sinsal_korean: str
    meaning: str


class StrengthInfo(BaseModel):
    value: int
    label: str


class SajuResponse(BaseModel):
    pillars: list[str]
    day_stem: str


class NatalResponse(BaseModel):
    my_main_element: OhengInfo
    element_stats: dict[str, int]
    strength: StrengthInfo
    yongshin: OhengInfo
    personality: str
    sipsin: list[SipsinInfo]
    sibi_unseong: list[SibiUnseongInfo]
    sinsal: list[SinsalInfo]


class DaeunPeriodResponse(BaseModel):
    ganji: str
    start_age: int
    end_age: int
    has_yongshin: bool
    is_current: bool


class ClashInfo(BaseModel):
    incoming: str
    target: str
    pillar: str


class CombineInfo(BaseModel):
    incoming: str
    target: str
    pillar: str
    type: str


class DomainScoreInfo(BaseModel):
    score: int
    level: str


class PostnatalResponse(BaseModel):
    year: int
    seun_ganji: str
    seun_stem: SipsinInfo
    seun_branch: SipsinInfo
    yongshin_in_seun: bool
    yongshin_in_daeun: bool
    current_daeun: DaeunPeriodResponse | None
    daeun_sipsin: list[SipsinInfo]
    daeun: list[DaeunPeriodResponse]
    seun_clashes: list[ClashInfo]
    seun_combines: list[CombineInfo]
    daeun_clashes: list[ClashInfo]
    daeun_combines: list[CombineInfo]
    domain_scores: dict[str, DomainScoreInfo]


class InterpretationResponse(BaseModel):
    personality: list[str]
    element_balance: list[str]
    yongshin: list[str]
    fortune_by_domain: list[str]
    annual_fortune: list[str]
    major_fortune: list[str]
    relationships: list[str]
    advice: list[str]


class AnalysisResponse(BaseModel):
    saju: SajuResponse
    natal: NatalResponse
    postnatal: PostnatalResponse
    interpretation: InterpretationResponse


def build_response(
    natal: NatalInfo,
    postnatal: PostnatalInfo,
    interpretation: Interpretation,
) -> AnalysisResponse:
    """도메인 객체를 API 응답 스키마로 변환한다."""

    def _oheng(o) -> OhengInfo:
        return OhengInfo(name=o.name, meaning=o.meaning)

    def _sipsin(char, s) -> SipsinInfo:
        return SipsinInfo(char=char, sipsin_name=s.name, domain=s.domain)

    def _strength_label(v: int) -> str:
        if v > 0:
            return "신강(身強)"
        elif v < 0:
            return "신약(身弱)"
        return "중화(中和)"

    # 대운 용신/현재 계산
    yongshin = natal.yongshin
    current_ganji = postnatal.current_daeun.ganji if postnatal.current_daeun else None

    def _daeun_period(d) -> DaeunPeriodResponse:
        has_yongshin = yongshin in (
            Stem.from_char(d.ganji[0]).element,
            Branch.from_char(d.ganji[1]).element,
        )
        return DaeunPeriodResponse(
            ganji=d.ganji,
            start_age=d.start_age,
            end_age=d.end_age,
            has_yongshin=has_yongshin,
            is_current=d.ganji == current_ganji,
        )

    # 영역별 점수 계산
    seun_sipsins = [postnatal.seun_stem[1], postnatal.seun_branch[1]]
    daeun_sipsins = [s for _, s in postnatal.daeun_sipsin]
    domain_scores = {}
    for domain_name, domain_sipsins in DOMAIN_MAP.items():
        seun_hit = sum(1 for s in seun_sipsins if s in domain_sipsins)
        daeun_hit = sum(1 for s in daeun_sipsins if s in domain_sipsins)
        score = seun_hit * 2 + daeun_hit
        level = "high" if score >= 3 else "medium" if score >= 1 else "low"
        domain_scores[domain_name] = DomainScoreInfo(score=score, level=level)

    # 세운 간지
    from bazi.domain.util import year_to_ganji
    seun_ganji = year_to_ganji(postnatal.year)

    return AnalysisResponse(
        saju=SajuResponse(
            pillars=natal.saju.pillars,
            day_stem=natal.saju.day_stem,
        ),
        natal=NatalResponse(
            my_main_element=_oheng(natal.my_main_element),
            element_stats={o.name: c for o, c in natal.element_stats.items()},
            strength=StrengthInfo(value=natal.strength, label=_strength_label(natal.strength)),
            yongshin=_oheng(natal.yongshin),
            personality=natal.personality,
            sipsin=[_sipsin(ch, s) for ch, s in natal.sipsin],
            sibi_unseong=[
                SibiUnseongInfo(pillar=p, unseong_name=u.name, meaning=u.meaning)
                for p, u in natal.sibi_unseong
            ],
            sinsal=[
                SinsalInfo(branch=b.name, sinsal_korean=s.korean, meaning=s.meaning)
                for b, s in natal.sinsal
            ],
        ),
        postnatal=PostnatalResponse(
            year=postnatal.year,
            seun_ganji=seun_ganji,
            seun_stem=_sipsin(*postnatal.seun_stem),
            seun_branch=_sipsin(*postnatal.seun_branch),
            yongshin_in_seun=postnatal.yongshin_in_seun,
            yongshin_in_daeun=postnatal.yongshin_in_daeun,
            current_daeun=_daeun_period(postnatal.current_daeun) if postnatal.current_daeun else None,
            daeun_sipsin=[_sipsin(ch, s) for ch, s in postnatal.daeun_sipsin],
            daeun=[_daeun_period(d) for d in postnatal.daeun],
            seun_clashes=[ClashInfo(**c) for c in postnatal.seun_clashes],
            seun_combines=[CombineInfo(**c) for c in postnatal.seun_combines],
            daeun_clashes=[ClashInfo(**c) for c in postnatal.daeun_clashes],
            daeun_combines=[CombineInfo(**c) for c in postnatal.daeun_combines],
            domain_scores=domain_scores,
        ),
        interpretation=InterpretationResponse(
            personality=interpretation.personality,
            element_balance=interpretation.element_balance,
            yongshin=interpretation.yongshin,
            fortune_by_domain=interpretation.fortune_by_domain,
            annual_fortune=interpretation.annual_fortune,
            major_fortune=interpretation.major_fortune,
            relationships=interpretation.relationships,
            advice=interpretation.advice,
        ),
    )
