import type { DomainSignal, DomainSignalKind } from "@/types/analysis";
import { RELATION_TYPE_LABEL } from "@/lib/constants";
import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";
import type { CompatTabProps } from "./types";

const DOMAIN_ICONS: Record<string, string> = {
  연애: "💕",
  결혼: "💍",
  재물: "💰",
  직업: "🤝",
};

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
  if (avg >= 70) intro = "네 영역 모두 두루 잘 맞는 사이예요.";
  else if (avg >= 55) intro = "네 영역 흐름이 골고루 좋은 편이에요.";
  else if (avg >= 45) intro = "네 영역 흐름이 무난한 편이에요.";
  else intro = "네 영역에서 노력이 필요한 사이예요.";

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

/** 영역별 궁합 — 레이더 + 영역 카드 4(점수·레벨·해설·근거 칩). 라벨은 관계 유형(display_name)을 따른다 */
export default function DomainTab({ data, name1, name2, relationType }: CompatTabProps) {
  const { domain_scores } = data;
  // 캐시(JSONB)는 키 순서를 보존하지 않으므로 카드 순서를 레이더와 같게 고정하고, 그 외 키는 뒤에 붙인다
  const known = DOMAIN_RADAR_ORDER.map((d) => d.label);
  const domains = [...known.filter((k) => domain_scores[k] != null), ...Object.keys(domain_scores).filter((k) => !known.includes(k))];
  return (
    <div className="slide-card">
      <div className="slide-card__header">
        <SectionHeader title="영역별 궁합" noMargin />
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-5">
        <KkachiTip label={`${RELATION_TYPE_LABEL[relationType]} 기준 · ${name1}님과 ${name2}님`}>{summarizeAllDomains(domain_scores)}</KkachiTip>

        <DomainRadar scores={domain_scores} />

        <div className="space-y-3">
          {domains.map((domain) => {
            const info = domain_scores[domain];
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
                    {info.display_name ?? domain} {info.score}점
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: "var(--color-gold-faint)", color: "var(--color-gold)" }}
                  >
                    {info.level}
                  </span>
                </div>

                {summary && <KkachiTip>{summary}</KkachiTip>}

                {(pros.length > 0 || cons.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {pros.slice(0, 3).map((s) => (
                      <span key={`+${s.text}`} className="text-[10px] px-1.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">+ {s.text}</span>
                    ))}
                    {cons.slice(0, 3).map((s) => (
                      <span key={`-${s.text}`} className="text-[10px] px-1.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">− {s.text}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
