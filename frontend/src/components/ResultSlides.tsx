"use client";

import Link from "next/link";
import type { AnalysisResult, SipsinInfo, ClashInfo, CombineInfo } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import PillarDetail from "./PillarDetail";
import ElementRadar from "./ElementRadar";
import DaeunTimeline from "./DaeunTimeline";
import DomainBarChart from "./DomainBarChart";
import InterpretSection from "./InterpretSection";
import DetailToggle from "./DetailToggle";
import TermBadge from "./TermBadge";
import SectionHeader from "./SectionHeader";

// ── 올해 년지 계산 ──────────────────────────────────────────────────────────
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
function yearBranch(year: number): string {
  return BRANCHES[(year - 4) % 12];
}

// ── 12지신 데이터 ────────────────────────────────────────────────────────────
const ZODIAC: Record<string, { kor: string; emoji: string; keywords: string[] }> = {
  "子": { kor: "쥐", emoji: "🐭", keywords: ["영민함", "민첩함", "사교성"] },
  "丑": { kor: "소", emoji: "🐂", keywords: ["성실함", "인내", "신뢰"] },
  "寅": { kor: "호랑이", emoji: "🐯", keywords: ["용기", "리더십", "열정"] },
  "卯": { kor: "토끼", emoji: "🐰", keywords: ["온화함", "직관", "예술성"] },
  "辰": { kor: "용", emoji: "🐲", keywords: ["카리스마", "야망", "창의"] },
  "巳": { kor: "뱀", emoji: "🐍", keywords: ["지혜", "신중함", "통찰"] },
  "午": { kor: "말", emoji: "🐴", keywords: ["자유", "활동성", "독립"] },
  "未": { kor: "양", emoji: "🐑", keywords: ["평화", "온순", "예술감"] },
  "申": { kor: "원숭이", emoji: "🐒", keywords: ["기지", "유머", "적응력"] },
  "酉": { kor: "닭", emoji: "🐓", keywords: ["꼼꼼함", "성실", "완벽주의"] },
  "戌": { kor: "개", emoji: "🐕", keywords: ["충직함", "의리", "정직"] },
  "亥": { kor: "돼지", emoji: "🐗", keywords: ["복", "너그러움", "성실"] },
};

const CLASH_PAIRS: [string, string][] = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];
const SAMHAP: [string[], string][] = [
  [["寅", "午", "戌"], "火"], [["亥", "卯", "未"], "木"],
  [["申", "子", "辰"], "水"], [["巳", "酉", "丑"], "金"],
];

function getZodiacRelation(myBranch: string, thisYear: number): string {
  const yb = yearBranch(thisYear);
  if (myBranch === yb) return `올해(${yb}年)와 같은 해예요. 본명년(本命年)으로 변화가 많은 해입니다.`;
  const clash = CLASH_PAIRS.find(([a, b]) => (a === myBranch && b === yb) || (b === myBranch && a === yb));
  if (clash) return `올해(${yb}年)와 충(衝)이 있어요. 예상치 못한 변화에 유연하게 대처하세요.`;
  const samhap = SAMHAP.find(([group]) => group.includes(myBranch) && group.includes(yb));
  if (samhap) return `올해(${yb}年)와 삼합(${samhap[1]}気)이 맞아요. 좋은 기운이 따릅니다.`;
  return `올해(${yb}年)와 특별한 충·합은 없어요. 꾸준히 나아가기 좋은 해예요.`;
}

// ── 세운 해석 헬퍼 ──────────────────────────────────────────────────────────
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

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "태어난 해", "월주": "태어난 달", "일주": "태어난 날", "시주": "태어난 시간",
};

function buildSeunNarrative(stem: SipsinInfo, branch: SipsinInfo): string {
  const stemDesc = SIPSIN_YEAR_DESC[stem.sipsin_name] ?? "";
  if (stem.sipsin_name === branch.sipsin_name) {
    return stemDesc + " 하늘과 땅 모두 같은 기운이라 이 영향이 특히 강하게 나타나요.";
  }
  return `${stemDesc} 여기에 ${SIPSIN_YEAR_DESC[branch.sipsin_name] ?? ""}`;
}

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

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  data: AnalysisResult;
  mode?: "free" | "full";
}

export default function ResultSlides({ data, mode = "full" }: Props) {
  const { natal, postnatal } = data;
  const meInfo = getElementInfo(natal.my_element.name);
  const yongInfo = getElementInfo(natal.yongshin_info.name);

  const yearBranch_ = natal.pillars[0]?.[1] ?? "";
  const zodiac = ZODIAC[yearBranch_];
  const zodiacRelation = zodiac ? getZodiacRelation(yearBranch_, postnatal.year) : "";

  const allClashes = [...postnatal.seun_clashes, ...postnatal.daeun_clashes];
  const allCombines = [...postnatal.seun_combines, ...postnatal.daeun_combines];

  return (
    <div className="space-y-8">

      {/* ── 섹션 1: 기초 (무료) ───────────────────────────────────── */}
      <section>
        <SectionHeader emoji="🌱" title="타고난 사주팔자" free />
        <div className="space-y-4">
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">나의 팔자</h3>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                당신은 <strong>{meInfo.korean}</strong>의 기운을 타고났어요
              </p>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <PillarDetail
                pillars={natal.pillars}
                sipsin={natal.sipsin}
                sibiUnseong={natal.sibi_unseong}
                sinsal={natal.sinsal}
                dayStem={natal.day_stem}
                basic={mode === "free"}
              />
            </div>
          </div>
          <div className="slide-card">
            <div className="slide-card__header">
              <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행(五行) 분포</h3>
            </div>
            <div className="divider" />
            <div className="slide-card__body">
              <ElementRadar stats={natal.element_stats} />
            </div>
          </div>
          {mode === "full" && (
            <div className="slide-card">
              <div className="slide-card__header">
                <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">성격과 기질</h3>
              </div>
              <div className="divider" />
              <div className="slide-card__body">
                <InterpretSection title="" blocks={natal.personality} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 섹션 2: 12지신 (무료) ─────────────────────────────────── */}
      {zodiac && (
        <section>
          <SectionHeader emoji={zodiac.emoji} title="나의 띠 · 12지신" free />
          <div className="slide-card">
            <div className="slide-card__body">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[var(--color-ivory-warm)] flex items-center justify-center text-4xl">
                  {zodiac.emoji}
                </div>
                <div>
                  <p className="font-heading text-xl font-bold text-[var(--color-ink)]">{zodiac.kor}띠</p>
                  <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{yearBranch_}年 생</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {zodiac.keywords.map((kw) => (
                      <span key={kw} className="text-xs bg-[var(--color-ivory)] border border-[var(--color-border-light)] rounded-full px-2.5 py-0.5 text-[var(--color-ink-muted)]">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mt-4 pt-4 border-t border-[var(--color-border-light)]">
                {zodiacRelation}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 심층분석 CTA (free 모드) ──────────────────────────────── */}
      {mode === "free" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-center space-y-1">
            <p className="font-heading text-base font-bold text-[var(--color-ink)]">올해 운세 · 인생 흐름 · 종합 조언이 준비됐어요</p>
            <p className="text-sm text-[var(--color-ink-muted)]">심층분석으로 더 자세한 내용을 확인하세요</p>
          </div>
          <Link
            href="/analysis/deep"
            className="px-8 py-3.5 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-xl text-sm font-semibold hover:bg-[var(--color-ink-light)] transition-colors shadow-md"
          >
            심층분석 시작하기 →
          </Link>
        </div>
      )}

      {/* ── 프리미엄 섹션 (full 모드) ────────────────────────────── */}
      {mode === "full" && (
        <>
          {/* ── 섹션 3: 올해의 운세 ────────────────────────────────── */}
          <section>
            <SectionHeader emoji="⭐" title={`올해의 운세 · ${postnatal.year}`} free={false} />
            <div className="space-y-4">
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">{postnatal.year}년 운세 요약</h3>
                  <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                    용신 <strong>{yongInfo.korean}</strong>이 올해 운에 {postnatal.yongshin_in_seun ? "들어와 있어요 ✓" : "직접 오지 않았어요"}
                  </p>
                </div>
                <div className="divider" />
                <div className="slide-card__body space-y-4">
                  <p className="text-sm text-[var(--color-ink-light)] leading-relaxed">
                    {buildSeunNarrative(postnatal.seun_stem, postnatal.seun_branch)}
                  </p>

                  {allClashes.length > 0 && (
                    <div className="rounded-lg px-4 py-3 text-sm leading-relaxed bg-[var(--color-ivory)]" style={{ borderLeft: "3px solid var(--color-fire)" }}>
                      <span className="font-medium text-[var(--color-fire)]">주의할 점</span>
                      <span className="text-[var(--color-ink-light)] ml-2">{buildClashNarrative(allClashes)}</span>
                    </div>
                  )}
                  {allCombines.length > 0 && (
                    <div className="rounded-lg px-4 py-3 text-sm leading-relaxed bg-[var(--color-ivory)]" style={{ borderLeft: "3px solid var(--color-wood)" }}>
                      <span className="font-medium text-[var(--color-wood)]">좋은 신호</span>
                      <span className="text-[var(--color-ink-light)] ml-2">{buildCombineNarrative(allCombines)}</span>
                    </div>
                  )}

                  <DetailToggle>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ label: "하늘 기운", term: "천간", info: postnatal.seun_stem }, { label: "땅 기운", term: "지지", info: postnatal.seun_branch }].map(({ label, term, info }) => (
                        <div key={term} className="rounded-lg p-4 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
                          <div className="text-xs text-[var(--color-ink-faint)] mb-1">{label} <TermBadge term={term} /></div>
                          <div className="font-heading text-2xl font-bold text-[var(--color-ink)]">{info.char}</div>
                          <div className="text-xs text-[var(--color-ink-muted)] mt-1">{info.sipsin_name} — {info.domain}</div>
                        </div>
                      ))}
                    </div>
                  </DetailToggle>
                </div>
              </div>

              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">영역별 운세</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <DomainBarChart scores={postnatal.domain_scores} />
                  <InterpretSection title="" blocks={postnatal.fortune_by_domain} />
                </div>
              </div>
            </div>
          </section>

          {/* ── 섹션 4: 큰 흐름 ────────────────────────────────────── */}
          <section>
            <SectionHeader emoji="🌊" title="큰 흐름 · 대운" free={false} />
            <div className="space-y-4">
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">
                    인생의 큰 흐름
                    <span className="text-xs font-normal text-[var(--color-ink-faint)] ml-2">10년 주기</span>
                  </h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <DaeunTimeline daeun={postnatal.daeun} />
                </div>
              </div>
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">올해 세운</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <InterpretSection title="" blocks={postnatal.annual_fortune} />
                </div>
              </div>
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">인생 흐름 상세</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <InterpretSection title="" blocks={postnatal.major_fortune} />
                </div>
              </div>
            </div>
          </section>

          {/* ── 섹션 5: 종합 조언 ──────────────────────────────────── */}
          <section>
            <SectionHeader emoji="💬" title="종합 조언" free={false} />
            <div className="space-y-4">
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">종합 조언 및 개운법</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <InterpretSection title="" blocks={postnatal.advice} variant="success" />
                </div>
              </div>
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">오행 균형</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <InterpretSection title="" blocks={natal.element_balance} />
                </div>
              </div>
              <div className="slide-card">
                <div className="slide-card__header">
                  <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">도움이 되는 기운 · 용신</h3>
                </div>
                <div className="divider" />
                <div className="slide-card__body">
                  <InterpretSection title="" blocks={postnatal.yongshin} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

    </div>
  );
}
