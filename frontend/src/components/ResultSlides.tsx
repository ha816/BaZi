"use client";

import type { AnalysisResult, SipsinInfo, ClashInfo, CombineInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import SlideCarousel from "./SlideCarousel";
import FortuneSummary from "./FortuneSummary";
import PillarDetail from "./PillarDetail";
import ElementRadar from "./ElementRadar";
import DaeunTimeline from "./DaeunTimeline";
import DomainBarChart from "./DomainBarChart";
import InterpretSection from "./InterpretSection";
import CounselorComment from "./CounselorComment";
import DetailToggle from "./DetailToggle";
import TermBadge from "./TermBadge";

const SIPSIN_YEAR_DESC: Record<string, string> = {
  "比肩": "나와 비슷한 기운이 들어와요. 경쟁이 늘거나 동료·친구와의 인연이 활발해지는 해예요.",
  "劫財": "경쟁과 지출이 늘기 쉬운 해예요. 투자나 보증은 신중하게, 대신 추진력은 강해져요.",
  "食神": "재능을 발휘하고 여유를 즐기기 좋은 해예요. 먹거리·취미·창작 활동에 복이 있어요.",
  "傷官": "표현욕이 강해지고 변화를 원하게 되는 해예요. 창의력은 높아지지만 말실수에 주의하세요.",
  "偏財": "활동적으로 돈을 벌 수 있는 해예요. 새로운 사업이나 투자 기회가 올 수 있어요.",
  "正財": "안정적인 수입과 재물 관리에 유리한 해예요. 꾸준한 노력이 보상받는 시기예요.",
  "偏官": "변화와 도전이 찾아오는 해예요. 승진이나 새 역할이 생길 수 있지만 스트레스도 커요.",
  "正官": "직장·사회적 지위가 안정되는 해예요. 인정받기 좋지만 책임도 무거워져요.",
  "偏印": "영감과 직감이 강해지는 해예요. 공부·연구·자격증에 유리하지만 생각이 많아지고 외로워질 수 있어요.",
  "正印": "학문적 지원과 안정이 들어오는 해예요. 어머니나 윗사람의 도움을 받기 좋은 시기예요.",
};

function buildSeunNarrative(stem: SipsinInfo, branch: SipsinInfo): string {
  const stemDesc = SIPSIN_YEAR_DESC[stem.sipsin_name] ?? "";
  if (stem.sipsin_name === branch.sipsin_name) {
    return stemDesc + " 하늘과 땅 모두 같은 기운이라 이 영향이 특히 강하게 나타나요.";
  }
  const branchDesc = SIPSIN_YEAR_DESC[branch.sipsin_name] ?? "";
  return `${stemDesc} 여기에 ${branchDesc}`;
}

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "태어난 해", "월주": "태어난 달",
  "일주": "태어난 날", "시주": "태어난 시간",
};

function buildClashNarrative(clashes: ClashInfo[]): string {
  if (clashes.length === 0) return "";
  const areas = [...new Set(clashes.map((c) => PILLAR_LABEL_MAP[c.pillar] ?? c.pillar))];
  return `올해 기운이 내 사주의 ${areas.join(", ")} 자리와 부딪혀요. 이 영역에서 갑작스러운 변화나 갈등이 생길 수 있으니 유연하게 대처하세요.`;
}

function buildCombineNarrative(combines: CombineInfo[]): string {
  if (combines.length === 0) return "";
  const areas = [...new Set(combines.map((c) => PILLAR_LABEL_MAP[c.pillar] ?? c.pillar))];
  return `올해 기운이 내 사주의 ${areas.join(", ")} 자리와 잘 어울려요. 이 영역에서 좋은 인연이나 기회가 자연스럽게 찾아올 수 있어요.`;
}

const DETAIL_SLIDES = [
  { key: "personality", label: "성격", icon: "\uD83E\uDDE0", title: "성격과 기질", desc: "타고난 성격과 대인관계 스타일", color: "var(--color-water)", variant: "info" as const, comment: "타고난 성격과 대인관계 스타일을 살펴볼게요." },
  { key: "element_balance", label: "균형", icon: "\u2696\uFE0F", title: "다섯 기운의 균형", desc: "오행 분포로 보는 강점과 약점", color: "var(--color-earth)", variant: "default" as const, comment: "다섯 가지 기운이 어떻게 분포되어 있는지, 강점과 약점을 짚어드릴게요." },
  { key: "yongshin", label: "용신", icon: "\uD83C\uDF3F", title: "도움이 되는 기운 분석", desc: "나에게 필요한 기운과 활용법", color: "var(--color-wood)", variant: "default" as const, comment: "나에게 부족한 기운을 채워주는 용신에 대해 자세히 알아볼게요." },
  { key: "major_fortune", label: "흐름 상세", icon: "\uD83D\uDCC5", title: "인생 흐름 상세", desc: "10년 주기별 상세 해석", color: "var(--color-gold)", variant: "default" as const, comment: "10년 주기별로 어떤 변화가 있는지 상세하게 풀어볼게요." },
  { key: "relationships", label: "충돌/조화", icon: "\u26A1", title: "기운의 충돌과 조화", desc: "올해 충/합으로 보는 변화 포인트", color: "var(--color-fire)", variant: "warning" as const, comment: "올해 사주와 부딪히거나 어울리는 기운을 정리했어요." },
] as const;

interface Props {
  data: AnalysisResult;
  gated?: boolean;
}

export default function ResultSlides({ data, gated = false }: Props) {
  const { natal, postnatal } = data;
  const meInfo = getElementInfo(natal.my_element.name);
  const yongInfo = getElementInfo(natal.yongshin_info.name);

  const domainEntries = Object.entries(postnatal.domain_scores);
  const bestDomain = domainEntries.reduce((a, b) => (b[1].score > a[1].score ? b : a));
  const worstDomain = domainEntries.reduce((a, b) => (b[1].score < a[1].score ? b : a));

  const detailDataMap: Record<string, string[]> = {
    personality: natal.personality,
    element_balance: natal.element_balance,
    yongshin: postnatal.yongshin,
    major_fortune: postnatal.major_fortune,
    relationships: postnatal.relationships,
  };

  const detailSlides = DETAIL_SLIDES.map((sec) => ({
    label: sec.label,
    icon: sec.icon,
    content: (
      <div className="space-y-5">
        <CounselorComment>{sec.comment}</CounselorComment>
        <div
          className="slide-card"
          style={{ borderLeftWidth: 3, borderLeftColor: sec.color }}
        >
          <div className="slide-card__header">
            <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">
              {sec.title}
            </h3>
            <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{sec.desc}</p>
          </div>
          <div className="divider" />
          <div className="slide-card__body">
            <InterpretSection title="" lines={detailDataMap[sec.key]} variant={sec.variant} />
          </div>
        </div>
      </div>
    ),
  }));

  const slides = [
    {
      label: "결과 요약",
      icon: "\u2728",
      content: (
        <div className="space-y-5">
          <CounselorComment pose="greeting">
            사주를 풀어봤어요. 먼저 전체적인 요약부터 보여드릴게요.
          </CounselorComment>
          <FortuneSummary data={data} />
        </div>
      ),
    },

    {
      label: "타고난 사주",
      icon: "\u2600",
      content: (
        <div className="space-y-5">
          <CounselorComment>
            이제 태어난 시간으로 뽑은 사주 여덟 글자를 하나씩 살펴볼게요.
            당신은 <strong>{meInfo.korean}</strong>의 기운을 타고났어요.
          </CounselorComment>
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">나의 타고난 사주</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <PillarDetail
                pillars={natal.pillars}
                sipsin={natal.sipsin}
                sibiUnseong={natal.sibi_unseong}
                sinsal={natal.sinsal}
                dayStem={natal.day_stem}
              />
            </div>
          </div>
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">다섯 가지 기운 분포</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <ElementRadar stats={natal.element_stats} />
            </div>
          </div>
        </div>
      ),
    },

    {
      label: "올해의 운세",
      icon: "\u2B50",
      content: (
        <div className="space-y-5">
          <CounselorComment>
            {postnatal.year}년 올해의 운세를 자세히 볼게요.
            당신에게 도움이 되는 <strong>{yongInfo.korean}</strong>의 기운이
            {postnatal.yongshin_in_seun ? " 올해 운에 들어와 있어서 좋은 흐름이에요." : " 올해 운에는 직접 오지 않았지만, 아래에서 어떤 영향이 있는지 살펴볼게요."}
          </CounselorComment>

          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">{postnatal.year}년 올해의 운세 상세</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body space-y-5">
              <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                {buildSeunNarrative(postnatal.seun_stem, postnatal.seun_branch)}
              </p>

              {(postnatal.seun_clashes.length > 0 || postnatal.daeun_clashes.length > 0) && (
                <div
                  className="rounded-lg px-5 py-4 text-sm leading-relaxed bg-[var(--color-ivory)]"
                  style={{ borderLeft: "3px solid var(--color-fire)" }}
                >
                  <span className="font-medium text-[var(--color-fire)]">주의할 점</span>
                  <span className="text-[var(--color-ink-light)] ml-2">
                    {buildClashNarrative([...postnatal.seun_clashes, ...postnatal.daeun_clashes])}
                  </span>
                </div>
              )}

              {(postnatal.seun_combines.length > 0 || postnatal.daeun_combines.length > 0) && (
                <div
                  className="rounded-lg px-5 py-4 text-sm leading-relaxed bg-[var(--color-ivory)]"
                  style={{ borderLeft: "3px solid var(--color-wood)" }}
                >
                  <span className="font-medium text-[var(--color-wood)]">좋은 신호</span>
                  <span className="text-[var(--color-ink-light)] ml-2">
                    {buildCombineNarrative([...postnatal.seun_combines, ...postnatal.daeun_combines])}
                  </span>
                </div>
              )}

              <DetailToggle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg p-5 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                    <div className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wider mb-2">
                      하늘 기운 <span className="normal-case">(<TermBadge term="천간" />)</span>
                    </div>
                    <div className="font-heading text-2xl font-bold text-[var(--color-ink)]">
                      {postnatal.seun_stem.char}
                    </div>
                    <div className="text-sm text-[var(--color-ink-muted)] mt-2">
                      {postnatal.seun_stem.sipsin_name} — {postnatal.seun_stem.domain}
                    </div>
                  </div>
                  <div className="rounded-lg p-5 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                    <div className="text-xs text-[var(--color-ink-faint)] uppercase tracking-wider mb-2">
                      땅 기운 <span className="normal-case">(<TermBadge term="지지" />)</span>
                    </div>
                    <div className="font-heading text-2xl font-bold text-[var(--color-ink)]">
                      {postnatal.seun_branch.char}
                    </div>
                    <div className="text-sm text-[var(--color-ink-muted)] mt-2">
                      {postnatal.seun_branch.sipsin_name} — {postnatal.seun_branch.domain}
                    </div>
                  </div>
                </div>

                {(postnatal.seun_clashes.length > 0 || postnatal.daeun_clashes.length > 0) && (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-heading text-sm font-semibold text-[var(--color-ink)]">
                      부딪히는 기운
                      <span className="font-normal text-[var(--color-ink-faint)] ml-1">(<TermBadge term="충" />)</span>
                    </h4>
                    {[...postnatal.seun_clashes, ...postnatal.daeun_clashes].map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg px-5 py-3 text-sm bg-[var(--color-ivory)]"
                        style={{ borderLeft: "3px solid var(--color-fire)", color: "var(--color-fire)" }}
                      >
                        {c.incoming} ↔ {c.target} ({c.pillar})
                      </div>
                    ))}
                  </div>
                )}

                {(postnatal.seun_combines.length > 0 || postnatal.daeun_combines.length > 0) && (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-heading text-sm font-semibold text-[var(--color-ink)]">
                      어울리는 기운
                      <span className="font-normal text-[var(--color-ink-faint)] ml-1">(<TermBadge term="합" />)</span>
                    </h4>
                    {[...postnatal.seun_combines, ...postnatal.daeun_combines].map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg px-5 py-3 text-sm bg-[var(--color-ivory)]"
                        style={{ borderLeft: "3px solid var(--color-wood)", color: "var(--color-wood)" }}
                      >
                        {c.incoming} ↔ {c.target} ({c.pillar}, {c.type})
                      </div>
                    ))}
                  </div>
                )}
              </DetailToggle>
            </div>
          </div>

          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">영역별 운세</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <DomainBarChart scores={postnatal.domain_scores} />
              <InterpretSection title="" lines={postnatal.fortune_by_domain} />
            </div>
          </div>
        </div>
      ),
    },

    {
      label: "큰 흐름",
      icon: "\uD83C\uDF0A",
      content: (
        <div className="space-y-5">
          <CounselorComment>
            영역별로 보면 <strong>{bestDomain[0]}</strong> 쪽 운이 {bestDomain[1].score}점으로 가장 좋고,
            {worstDomain[0] !== bestDomain[0] && <> <strong>{worstDomain[0]}</strong> 쪽은 {worstDomain[1].score}점으로 조금 아쉬워요.</>}
            {" "}이제 인생 전체의 큰 흐름도 한번 살펴볼게요.
          </CounselorComment>

          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">
                인생의 큰 흐름 <span className="text-sm font-normal text-[var(--color-ink-faint)] ml-2">10년 주기</span>
              </h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <DaeunTimeline daeun={postnatal.daeun} />
            </div>
          </div>

          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">올해 운세</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <InterpretSection title="" lines={postnatal.annual_fortune} />
            </div>
          </div>
        </div>
      ),
    },

    {
      label: "종합 조언",
      icon: "\uD83D\uDCAC",
      content: (
        <div className="space-y-5">
          <CounselorComment pose="greeting">
            마지막으로 종합 조언을 드릴게요. 가장 중요한 부분이니 꼭 읽어보세요.
          </CounselorComment>
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">종합 조언</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <InterpretSection title="" lines={postnatal.advice} variant="success" />
            </div>
          </div>
        </div>
      ),
    },

    ...detailSlides,
  ];

  if (gated) {
    const basicSlide = {
      label: "기초",
      icon: "🌱",
      content: (
        <div className="space-y-5">
          <CounselorComment pose="greeting">
            사주를 풀어봤어요. 태어난 시간으로 뽑은 여덟 글자와 오행 분포를 보여드릴게요.
            당신은 <strong>{meInfo.korean}</strong>의 기운을 타고났어요.
          </CounselorComment>
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">나의 팔자</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <PillarDetail
                pillars={natal.pillars}
                sipsin={natal.sipsin}
                sibiUnseong={natal.sibi_unseong}
                sinsal={natal.sinsal}
                dayStem={natal.day_stem}
                basic
              />
            </div>
          </div>
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">다섯 가지 기운 분포</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <ElementRadar stats={natal.element_stats} />
            </div>
          </div>
        </div>
      ),
    };
    const gateSlide = {
      label: "전체 보기",
      icon: "🔒",
      content: (
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none opacity-60 space-y-5">
            <CounselorComment>
              {postnatal.year}년 올해의 운세를 자세히 볼게요.
              당신에게 도움이 되는 <strong>{yongInfo.korean}</strong>의 기운이
              {postnatal.yongshin_in_seun ? " 올해 운에 들어와 있어요." : " 올해 운에는 직접 오지 않았어요."}
            </CounselorComment>
            <div className="slide-card">
              <div className="slide-card__header">
                <h3 className="font-heading text-lg font-semibold text-[var(--color-ink)]">{postnatal.year}년 올해의 운세</h3>
              </div>
              <div className="divider" />
              <div className="slide-card__body">
                <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                  {buildSeunNarrative(postnatal.seun_stem, postnatal.seun_branch)}
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-transparent via-[var(--color-parchment)]/80 to-[var(--color-parchment)]">
            <div className="text-center space-y-2 px-4">
              <p className="font-heading text-xl font-bold text-[var(--color-ink)]">올해의 운세 · 인생 흐름 · 종합 조언</p>
              <p className="text-sm text-[var(--color-ink-muted)]">프로필을 저장하면 전체 분석 결과를 매번 볼 수 있어요</p>
            </div>
            <a
              href="/join"
              className="px-8 py-3 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-xl text-sm font-semibold hover:bg-[var(--color-ink-light)] transition-colors shadow-md"
            >
              무료로 시작하기 →
            </a>
          </div>
        </div>
      ),
    };
    return <SlideCarousel slides={[basicSlide, gateSlide]} />;
  }

  return <SlideCarousel slides={slides} />;
}
