"use client";

import type { CompatibilityResult, DomainSignal, DomainSignalKind, PillarSnapshot } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import KkachiTip from "./KkachiTip";
import OhengPairDiagram from "./OhengPairDiagram";
import PillarPairDiagram from "./PillarPairDiagram";
import SectionHeader from "./SectionHeader";
import { SINSAL_INFO } from "./tabs/natal/data";

interface Props {
  data: CompatibilityResult;
  name1: string;
  name2: string;
}

const DOMAIN_ICONS: Record<string, string> = {
  연애: "💕",
  결혼: "💍",
  재물: "💰",
  직업: "🤝",
};

const ELEMENTS_ORDER = ["木", "火", "土", "金", "水"];

function elementsToKor(arr: string[]): string {
  return arr.map((e) => `${getElementInfo(e).korean}(${e})`).join(", ");
}

const DOMAIN_THEMES: Record<string, { intro: string; positive: string; negative: string }> = {
  연애: { intro: "연애 영역에서는", positive: "감정 교감과 끌림이", negative: "감정 기복이" },
  결혼: { intro: "결혼 영역에서는", positive: "안정적 호흡이", negative: "부부 사이 긴장이" },
  재물: { intro: "재물 영역에서는", positive: "재물 흐름이", negative: "금전 갈등이" },
  직업: { intro: "직업 영역에서는", positive: "사회적 조화가", negative: "역할 충돌이" },
};

const HARMONY_KEYWORDS = ["합", "삼합", "반합", "육합", "공유"];
const CLASH_KEYWORDS = ["충", "원진", "형", "해", "파", "갈등", "주의"];
const SINSAL_KEYWORDS = ["천을귀인", "월덕귀인", "도화살", "역마살", "화개살", "백호살", "장성살", "문창귀인", "천덕귀인"];
const SIPSIN_KEYWORDS = ["재성", "관성", "인성", "식상", "관인상생", "식상생재"];
const ELEMENT_KEYWORDS = ["오행", "용신", "기운", "보완"];
const FORTUNE_KEYWORDS = ["올해", "재능운", "재물운", "관록운", "인연운"];

function inferKind(text: string): DomainSignalKind {
  if (SINSAL_KEYWORDS.some((k) => text.includes(k))) return "sinsal";
  if (FORTUNE_KEYWORDS.some((k) => text.includes(k))) return "fortune";
  if (SIPSIN_KEYWORDS.some((k) => text.includes(k))) return "sipsin";
  if (ELEMENT_KEYWORDS.some((k) => text.includes(k))) return "element";
  if (CLASH_KEYWORDS.some((k) => text.includes(k))) return "clash";
  if (HARMONY_KEYWORDS.some((k) => text.includes(k))) return "harmony";
  return "harmony";
}

function normalizeSignal(s: string | DomainSignal): DomainSignal {
  if (typeof s === "string") return { kind: inferKind(s), text: s };
  return s;
}

function summarizeAllDomains(scores: Record<string, { score: number; level: string }>): string {
  const order = ["연애", "결혼", "재물", "직업"];
  const present = order.filter((n) => scores[n] != null);
  if (present.length === 0) return "";

  const strong: string[] = [];
  const ok: string[] = [];
  const weak: string[] = [];
  for (const name of present) {
    const lv = scores[name].level;
    if (lv === "최고" || lv === "좋음") strong.push(name);
    else if (lv === "보통") ok.push(name);
    else weak.push(name);
  }

  const avg = present.reduce((s, n) => s + scores[n].score, 0) / present.length;
  let intro: string;
  if (avg >= 70) intro = "네 영역 모두 두루 잘 맞는 인연이에요.";
  else if (avg >= 55) intro = "네 영역 흐름이 골고루 좋은 편이에요.";
  else if (avg >= 45) intro = "네 영역 흐름이 무난한 편이에요.";
  else intro = "네 영역에서 노력이 필요한 인연이에요.";

  const parts: string[] = [];
  if (strong.length > 0) parts.push(`${strong.join("·")} 쪽이 특히 호흡이 좋아요`);
  if (weak.length > 0) parts.push(`${weak.join("·")} 쪽은 조금 더 노력이 필요해요`);
  if (ok.length > 0 && parts.length === 0) parts.push("전반적으로 무난한 흐름이에요");
  else if (ok.length > 0) parts.push(`${ok.join("·")} 쪽은 평이한 흐름이에요`);

  return parts.length > 0 ? `${intro} ${parts.join(", ")}.` : intro;
}

function summarizeDomain(domain: string, pros: DomainSignal[], cons: DomainSignal[]): string {
  const theme = DOMAIN_THEMES[domain];
  if (!theme) return "";
  if (pros.length === 0 && cons.length === 0) return "";
  const parts: string[] = [];
  if (pros.length > 0) {
    parts.push(`${pros.slice(0, 3).map((s) => s.text).join(", ")} 덕분에 ${theme.positive} 강해요.`);
  }
  if (cons.length > 0) {
    parts.push(`다만 ${cons.slice(0, 3).map((s) => s.text).join(", ")}로 ${theme.negative} 따라올 수 있어요.`);
  }
  return `${theme.intro} ${parts.join(" ")}`;
}

const SHARED_SINSAL_MEANING: Record<string, string> = {
  "천을귀인": "위기 순간 서로를 지켜주는 강력한 인연",
  "월덕귀인": "갈등 없이 평화롭게 흐르는 사이",
  "천덕귀인": "복이 두텁게 깃든 행운의 결합",
  "도화살": "이성적 매력이 강한 화려한 인연",
  "역마살": "함께 움직이고 변화를 즐기는 활동적 인연",
  "화개살": "예술·종교·학문 코드가 깊게 통하는 정신적 인연",
  "백호살": "에너지가 강해 함께 큰일을 도모하는 인연",
  "장성살": "리더십과 야망이 통하는 카리스마 커플",
  "문창귀인": "학문·문서 코드가 통해 함께 성장하는 인연",
};

const UNIQUE_SINSAL_ROLE: Record<string, string> = {
  "천을귀인": "위기 때 든든하게 지켜주는 자리",
  "월덕귀인": "갈등을 부드럽게 조율해주는 자리",
  "천덕귀인": "복을 끌어와 함께 누리게 하는 자리",
  "도화살": "이성적 매력을 더해주는 자리",
  "역마살": "새로운 기회·이동을 끌어오는 자리",
  "화개살": "예술·정신적 깊이를 더해주는 자리",
  "백호살": "강한 추진력으로 일을 밀어붙이는 자리",
  "장성살": "방향을 잡고 이끌어주는 리더 자리",
  "문창귀인": "공부·문서·전문성을 받쳐주는 자리",
};

const DOMAIN_RADAR_ORDER: { label: string; angleDeg: number }[] = [
  { label: "연애", angleDeg: -90 },
  { label: "결혼", angleDeg: 0 },
  { label: "재물", angleDeg: 90 },
  { label: "직업", angleDeg: 180 },
];

function DomainRadar({ scores }: { scores: Record<string, { score: number }> }) {
  const cx = 70, cy = 70, maxR = 50;
  const labelOff = 14;

  const points = DOMAIN_RADAR_ORDER.map(({ label, angleDeg }) => {
    const score = scores[label]?.score ?? 0;
    const r = (score / 100) * maxR;
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), label, score };
  });

  return (
    <svg viewBox="-30 -10 200 160" className="w-full max-w-[260px] mx-auto block">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const r = maxR * ratio;
        const pts = DOMAIN_RADAR_ORDER.map(({ angleDeg }) => {
          const rad = (angleDeg * Math.PI) / 180;
          return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
        }).join(" ");
        return (
          <polygon key={i} points={pts} fill="none"
            stroke="var(--color-border-light)" strokeWidth={0.6} />
        );
      })}
      {/* Axes */}
      <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="var(--color-border-light)" strokeWidth={0.5} />
      <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="var(--color-border-light)" strokeWidth={0.5} />
      {/* Score polygon */}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="var(--color-gold)" fillOpacity={0.22}
        stroke="var(--color-gold)" strokeWidth={1.5}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--color-gold)" />
      ))}
      {/* Labels */}
      {DOMAIN_RADAR_ORDER.map(({ label, angleDeg }, i) => {
        const rad = (angleDeg * Math.PI) / 180;
        const lx = cx + (maxR + labelOff) * Math.cos(rad);
        const ly = cy + (maxR + labelOff) * Math.sin(rad);
        const score = points[i].score;
        return (
          <g key={label}>
            <text x={lx} y={ly - 4} textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fontWeight={600} fill="var(--color-ink)">
              {DOMAIN_ICONS[label]} {label}
            </text>
            <text x={lx} y={ly + 6} textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fill="var(--color-gold)">
              {score}점
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 70 ? "var(--color-gold)" : score >= 45 ? "var(--color-earth)" : "var(--color-water)";

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="10" stroke="var(--color-parchment)" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        strokeWidth="10"
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

interface SinsalCardProps {
  name: string;
  badge: string;
  accent: { bg: string; border: string; badgeBg: string; badgeColor: string; footColor: string };
  footer?: string;
}

function SinsalCard({ name, badge, accent, footer }: SinsalCardProps) {
  const info = SINSAL_INFO[name];
  return (
    <div
      className="rounded-lg border p-2.5 flex gap-2.5"
      style={{ background: accent.bg, borderColor: accent.border }}
    >
      <img
        src={`/kkachi/sinsal/sinsal_${name}.png`}
        alt={name}
        className="w-24 h-24 rounded-md object-cover flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: accent.badgeBg, color: accent.badgeColor }}
          >
            {badge}
          </span>
          <span className="text-xs font-bold text-[var(--color-ink)]">
            {name}
            {info?.hanja && (
              <span className="font-normal text-[var(--color-ink-faint)] ml-1">({info.hanja})</span>
            )}
          </span>
        </div>
        {info?.tagline && (
          <p className="text-[10px] font-medium text-[var(--color-ink-muted)] leading-snug">
            {info.tagline}
          </p>
        )}
        {info?.desc && (
          <p className="text-[10px] text-[var(--color-ink-muted)] leading-snug">{info.desc}</p>
        )}
        {footer && (
          <p className="text-[10px] font-semibold leading-snug" style={{ color: accent.footColor }}>
            → {footer}
          </p>
        )}
      </div>
    </div>
  );
}

const SHARED_ACCENT = {
  bg: "#dcfce7",
  border: "#86efac",
  badgeBg: "#15803d",
  badgeColor: "#ffffff",
  footColor: "#15803d",
};

const PERSON1_ACCENT = {
  bg: "#fef3c7",
  border: "#fbbf24",
  badgeBg: "#f59e0b",
  badgeColor: "#ffffff",
  footColor: "#b45309",
};

const PERSON2_ACCENT = {
  bg: "#ccfbf1",
  border: "#5eead4",
  badgeBg: "#14b8a6",
  badgeColor: "#ffffff",
  footColor: "#0f766e",
};

function ElementBar({ snapshot, label }: { snapshot: PillarSnapshot; label: string }) {
  const total = Math.max(1, Object.values(snapshot.element_stats).reduce((a, b) => a + b, 0));
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[var(--color-ink-muted)]">{label}</p>
      <div className="space-y-1.5">
        {ELEMENTS_ORDER.map((el) => {
          const count = snapshot.element_stats[el] ?? 0;
          const pct = (count / total) * 100;
          const info = getElementInfo(el);
          return (
            <div key={el} className="flex items-center gap-2">
              <span className="w-7 text-xs font-bold" style={{ color: info.color }}>
                {info.korean}
              </span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--color-parchment)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: info.color }}
                />
              </div>
              <span className="w-5 text-right text-[10px] font-medium text-[var(--color-ink-faint)]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompatibilityResultView({ data, name1, name2 }: Props) {
  // 신규 필드는 이전 캐시(JSONB) 에 없을 수 있으므로 안전한 기본값 적용
  const {
    total_score, label, domain_scores, description,
    pillar1_snapshot = null, pillar2_snapshot = null,
    pillar_relations = [],
    element_complement = { p1_lacks: [], p1_provides: [], p2_lacks: [], p2_provides: [], overlap_strong: [], score: 0 },
    shared_sinsal = [], unique_sinsal_1 = [], unique_sinsal_2 = [],
    samhap_completions = [],
    narrative = null,
  } = data;

  return (
    <div className="space-y-4">
      {/* ── 1. 종합 궁합 + 사주 한눈 비교 ── */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader title="종합 궁합" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-5">
          <KkachiTip>
            {name1}님과 {name2}님은 {label}이에요. 카드를 하나씩 펼치며 두 분의 관계를 풀어드릴게요.
          </KkachiTip>

          <div className="flex flex-col md:flex-row items-center gap-7">
            <div className="relative flex-shrink-0">
              <ScoreRing score={total_score} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-4xl font-bold text-[var(--color-ink)]">
                  {total_score}
                </span>
                <span className="text-xs text-[var(--color-ink-faint)]">점</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{label}</h2>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{description}</p>
            </div>
          </div>

          {pillar1_snapshot && pillar2_snapshot && (
            <div className="space-y-4">
              {samhap_completions.length > 0 && (
              <div className="space-y-2">
                {samhap_completions.map((c, i) => {
                  const info = getElementInfo(c.element);
                  return (
                    <div
                      key={i}
                      className="rounded-xl px-4 py-3 border flex items-center gap-3"
                      style={{ background: info.bgColor, borderColor: info.borderColor }}
                    >
                      <span className="font-heading text-2xl font-bold" style={{ color: info.color }}>
                        {c.branches.join("")}
                      </span>
                      <div className="flex-1 text-xs leading-relaxed" style={{ color: info.color }}>
                        <p className="font-semibold">
                          삼합 완성 — {info.label}({info.korean})국
                        </p>
                        <p className="opacity-80 mt-0.5">
                          {name1}님 {c.p1_branches.join("")} + {name2}님 {c.p2_branches.join("")} → 운명적 호흡
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <PillarPairDiagram
              p1={pillar1_snapshot}
              p2={pillar2_snapshot}
              relations={pillar_relations}
              name1={name1}
              name2={name2}
            />

            {/* ── 오행 보완 sub-section ── */}
            <div className="pt-2 mt-2 border-t border-[var(--color-border-light)] space-y-4">
              <h4 className="font-heading text-sm font-semibold text-[var(--color-ink)]">
                오행 보완
              </h4>
              <KkachiTip>
                한쪽에 부족한 오행을 상대가 가지고 있으면 서로를 채워주는 사이가 돼요. 반대로 같은 오행이 둘 다 강하면 충돌이 잦을 수 있어요.
              </KkachiTip>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ElementBar snapshot={pillar1_snapshot} label={`${name1}님`} />
                <ElementBar snapshot={pillar2_snapshot} label={`${name2}님`} />
              </div>

              <OhengPairDiagram
                p1={pillar1_snapshot}
                p2={pillar2_snapshot}
                name1={name1}
                name2={name2}
              />

              <div className="space-y-2">
                {element_complement.p2_provides.length > 0 && (
                  <KkachiTip>
                    {name2}님이 {elementsToKor(element_complement.p2_provides)} 기운으로 {name1}님의 부족함을 채워줘요.
                  </KkachiTip>
                )}
                {element_complement.p1_provides.length > 0 && (
                  <KkachiTip>
                    {name1}님이 {elementsToKor(element_complement.p1_provides)} 기운으로 {name2}님의 부족함을 채워줘요.
                  </KkachiTip>
                )}
                {element_complement.overlap_strong.length > 0 && (
                  <KkachiTip>
                    두 분 모두 {elementsToKor(element_complement.overlap_strong)} 기운이 과중해 충돌이 생길 수 있어요.
                  </KkachiTip>
                )}
                {element_complement.p1_provides.length === 0 &&
                  element_complement.p2_provides.length === 0 &&
                  element_complement.overlap_strong.length === 0 && (
                    <KkachiTip>오행 구성이 비슷한 균형 관계예요.</KkachiTip>
                  )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* ── 4. 영역별 궁합 카드 ── */}
      <div className="slide-card">
        <div className="slide-card__header">
          <SectionHeader title="영역별 궁합" noMargin />
        </div>
        <div className="divider" />
        <div className="slide-card__body space-y-5">
          <KkachiTip>{summarizeAllDomains(domain_scores)}</KkachiTip>

          <DomainRadar scores={domain_scores} />

          <div className="space-y-3">
            {Object.entries(domain_scores).map(([domain, info]) => {
              const pros = (info.pros ?? []).map(normalizeSignal);
              const cons = (info.cons ?? []).map(normalizeSignal);
              const summary =
                info.narrative ??
                [summarizeDomain(domain, pros, cons), info.advice].filter(Boolean).join(" ");
              return (
                <div
                  key={domain}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{DOMAIN_ICONS[domain] ?? "◎"}</span>
                    <span className="font-heading text-base font-bold text-[var(--color-ink)]">
                      {domain} {info.score}점
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: "var(--color-gold-faint)", color: "var(--color-gold)" }}
                    >
                      {info.level}
                    </span>
                  </div>

                  {summary && <KkachiTip>{summary}</KkachiTip>}
                </div>
              );
            })}
          </div>

          {/* ── 공유·고유 신살 sub-section ── */}
          {(shared_sinsal.length > 0 || unique_sinsal_1.length > 0 || unique_sinsal_2.length > 0) && (
            <div className="pt-2 mt-2 border-t border-[var(--color-border-light)] space-y-4">
              <h4 className="font-heading text-sm font-semibold text-[var(--color-ink)]">
                공유·고유 신살
              </h4>
              <KkachiTip>
                신살(神殺)은 사주에 깃든 특별한 기운으로, 옛날에는 길흉으로 봤지만 현대에는 <strong>개인의 캐릭터·역량</strong>으로 풀이해요. <strong>함께 가진 신살</strong>은 두 분이 같은 코드를 공유한다는 뜻이고, <strong>한쪽만 가진 신살</strong>은 그 분이 그 영역에서 상대를 받쳐주는 자리예요.
              </KkachiTip>

              {shared_sinsal.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                    함께 가진 신살 <span className="font-normal text-[var(--color-ink-faint)] ml-1">두 분의 공통 코드</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {shared_sinsal.map((s) => (
                      <SinsalCard
                        key={s}
                        name={s}
                        badge="★ 함께"
                        accent={SHARED_ACCENT}
                        footer={SHARED_SINSAL_MEANING[s]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {unique_sinsal_1.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                    {name1}님만 가진 신살
                    <span className="font-normal text-[var(--color-ink-faint)] ml-1">{name2}님을 받쳐주는 자리</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unique_sinsal_1.map((s) => {
                      const role = UNIQUE_SINSAL_ROLE[s];
                      return (
                        <SinsalCard
                          key={s}
                          name={s}
                          badge={`${name1}님`}
                          accent={PERSON1_ACCENT}
                          footer={role ? `${name1}님이 ${name2}님에게 ${role}` : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {unique_sinsal_2.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                    {name2}님만 가진 신살
                    <span className="font-normal text-[var(--color-ink-faint)] ml-1">{name1}님을 받쳐주는 자리</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {unique_sinsal_2.map((s) => {
                      const role = UNIQUE_SINSAL_ROLE[s];
                      return (
                        <SinsalCard
                          key={s}
                          name={s}
                          badge={`${name2}님`}
                          accent={PERSON2_ACCENT}
                          footer={role ? `${name2}님이 ${name1}님에게 ${role}` : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 6. AI 해석 카드 ── */}
      {narrative && (
        <div className="slide-card">
          <div className="slide-card__header">
            <SectionHeader title="까치의 종합 해석" noMargin />
          </div>
          <div className="divider" />
          <div className="slide-card__body space-y-3">
            <KkachiTip>
              앞에서 본 데이터를 까치가 한 편의 글로 정리했어요. 강점·약점·실천 조언이 담겨 있어요.
            </KkachiTip>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-line">
              {narrative}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
