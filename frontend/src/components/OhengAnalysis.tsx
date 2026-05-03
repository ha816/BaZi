"use client";
import type { NatalResult } from "@/types/analysis";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";
import PillarOhengGrid from "@/components/PillarOhengGrid";

const OHAENG_KOR = ["나무", "불", "흙", "쇠", "물"];
const OHAENG_COLORS = ["#1B6B3A", "#B02020", "#8A4F00", "#3D3D3D", "#0F4F8A"];
const OHAENG_BGS = ["#C8E6D4", "#F8CCC8", "#F5DCAA", "#E0E0E0", "#C4DDF5"];
const OHAENG_BORDERS = ["#6DB890", "#E07070", "#D4A060", "#A0A0A0", "#6AAAD8"];
const SAENG_PAIRS: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
const GEUK_PAIRS: [number, number][] = [[0,2],[1,3],[2,4],[3,0],[4,1]];

const PILLAR_SHORT = ["년주", "월주", "일주", "시주"];

function OhaengCountDiagram({ stats }: { stats: Record<string, number> }) {
  const CX = 100, CY = 88, PR = 66, NR = 20;
  function pentaPos(i: number): [number, number] {
    const a = (-90 + i * 72) * Math.PI / 180;
    return [CX + PR * Math.cos(a), CY + PR * Math.sin(a)];
  }
  function arrowSeg(i1: number, i2: number) {
    const [x1,y1] = pentaPos(i1), [x2,y2] = pentaPos(i2);
    const dx = x2-x1, dy = y2-y1, l = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/l, uy = dy/l;
    return { x1: x1+NR*ux, y1: y1+NR*uy, x2: x2-(NR+4)*ux, y2: y2-(NR+4)*uy };
  }
  const maxCount = Math.max(1, ...Object.values(stats));
  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] p-3 space-y-2">
      <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">오행 관계도</p>
      <svg viewBox="0 0 200 182" className="w-2/3 mx-auto block">
        <defs>
          <marker id="oc-saeng" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#1B6B3A" opacity="0.4" />
          </marker>
          <marker id="oc-geuk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#C0392B" opacity="0.3" />
          </marker>
        </defs>
        {SAENG_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          return <line key={`s${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#1B6B3A" strokeWidth={1} strokeOpacity={0.2} markerEnd="url(#oc-saeng)" />;
        })}
        {GEUK_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          return <line key={`g${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#C0392B" strokeWidth={1} strokeOpacity={0.15} strokeDasharray="4,3" markerEnd="url(#oc-geuk)" />;
        })}
        {(["木","火","土","金","水"] as const).map((elem, i) => {
          const [x,y] = pentaPos(i);
          const count = stats[elem] ?? 0;
          const active = count > 0;
          const ratio = active ? count / maxCount : 0;
          const strokeW = active ? 1.5 + 2.5 * ratio : 1;
          return (
            <g key={elem}>
              <circle cx={x} cy={y} r={NR}
                fill={active ? OHAENG_BGS[i] : "#F5F2EC"}
                stroke={OHAENG_BORDERS[i]}
                strokeWidth={strokeW}
                opacity={active ? 0.55 + 0.45 * ratio : 0.25} />
              <text x={x} y={y-4} textAnchor="middle" dominantBaseline="middle"
                fontSize={14} fontWeight={active ? 700 : 400}
                fill={OHAENG_COLORS[i]} opacity={active ? 1 : 0.3}
                style={{ fontFamily: "serif" }}>
                {elem}
              </text>
              <text x={x} y={y+7} textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fill={OHAENG_COLORS[i]} opacity={active ? 0.85 : 0.25}>
                {OHAENG_KOR[i]}
              </text>
              {active && (
                <text x={x} y={y+NR+10} textAnchor="middle"
                  fontSize={9} fontWeight={700} fill={OHAENG_COLORS[i]}>
                  {count}개
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#1B6B3A" strokeWidth="1.5" markerEnd="url(#oc-saeng)" /></svg>
          <span className="text-[9px] text-[#1B6B3A] font-medium">도움(生)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#C0392B" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#oc-geuk)" /></svg>
          <span className="text-[9px] text-[#C0392B] font-medium">억제(克)</span>
        </div>
      </div>
    </div>
  );
}

function OhaengSourceBreakdown({ pillars, pillarElements = [], stats }: {
  pillars: string[];
  pillarElements?: { stem_element: string; branch_element: string }[];
  stats: Record<string, number>;
}) {
  const ELEMS = ["木", "火", "土", "金", "水"];
  const ELEM_INDEX: Record<string, number> = { "木":0, "火":1, "土":2, "金":3, "水":4 };
  const sources: Record<string, { char: string; pillar: string; type: string }[]> = {};
  ELEMS.forEach((e) => (sources[e] = []));
  pillars.forEach((pillar, i) => {
    const stem = pillar[0], branch = pillar[1];
    const stemEl = pillarElements[i]?.stem_element;
    const branchEl = pillarElements[i]?.branch_element;
    if (stemEl) sources[stemEl].push({ char: stem, pillar: PILLAR_SHORT[i], type: "천간" });
    if (branchEl) sources[branchEl].push({ char: branch, pillar: PILLAR_SHORT[i], type: "지지" });
  });
  const present = ELEMS
    .filter((e) => (stats[e] ?? 0) > 0)
    .sort((a, b) => (stats[b] ?? 0) - (stats[a] ?? 0));
  const maxCount = Math.max(1, ...present.map((e) => stats[e] ?? 0));
  return (
    <div className="space-y-2">
      {present.map((elem) => {
        const i = ELEM_INDEX[elem];
        const count = stats[elem] ?? 0;
        const pct = (count / maxCount) * 100;
        return (
          <div key={elem} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold w-5 shrink-0" style={{ color: OHAENG_COLORS[i] }}>{elem}</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: OHAENG_COLORS[i] }} />
              </div>
              <span className="text-[10px] font-semibold w-6 text-right" style={{ color: OHAENG_COLORS[i] }}>{count}</span>
            </div>
            <div className="flex flex-wrap gap-1 pl-7">
              {sources[elem].map((s, j) => (
                <span key={j} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: OHAENG_BGS[i], color: OHAENG_COLORS[i], border: `1px solid ${OHAENG_BORDERS[i]}` }}>
                  {s.char} {s.pillar} {s.type}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  natal: NatalResult;
}

export default function OhengAnalysis({ natal }: Props) {
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="오행(五行)">
        만물을 이루는 다섯 가지 기운 — <strong className="text-[var(--color-ink)]">나무(木)·불(火)·흙(土)·쇠(金)·물(水)</strong>. 사주 8글자가 어떤 오행에 얼마나 분포해 있는지 보면 <strong className="text-[var(--color-ink)]">성격·체질·적성</strong>이 한눈에 드러납니다.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-5">
        <KkachiTip>
          사주팔자 각 글자의 <strong className="text-[var(--color-ink)]">오행</strong>을 보면 타고난 <strong className="text-[var(--color-ink)]">체질·성질</strong>을 볼 수 있어요.
        </KkachiTip>
        <PillarOhengGrid natal={natal} />
        <OhaengSourceBreakdown pillars={natal.pillars} pillarElements={natal.pillar_elements} stats={natal.element_stats} />
        <OhaengCountDiagram stats={natal.element_stats} />
        <KkachiTip>{natal.narratives.ohaeng_tip}</KkachiTip>
      </div>
    </div>
  );
}
