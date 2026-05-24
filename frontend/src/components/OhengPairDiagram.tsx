"use client";

import type { PillarSnapshot } from "@/types/analysis";

const ELEMS = ["木", "火", "土", "金", "水"] as const;
const OHAENG_KOR = ["나무", "불", "흙", "쇠", "물"];
const OHAENG_COLORS = ["#1B6B3A", "#B02020", "#8A4F00", "#3D3D3D", "#0F4F8A"];
const OHAENG_BORDERS = ["#6DB890", "#E07070", "#D4A060", "#A0A0A0", "#6AAAD8"];
const SAENG_PAIRS: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
const GEUK_PAIRS: [number, number][] = [[0,2],[1,3],[2,4],[3,0],[4,1]];

// 사람 색 — 오행 색과 충돌하지 않는 앰버/청록
const P1_COLOR = "#F59E0B";       // amber-500
const P1_COLOR_FADE = "#FDE68A";  // amber-200
const P2_COLOR = "#14B8A6";       // teal-500
const P2_COLOR_FADE = "#99F6E4";  // teal-200

const CX = 120, CY = 110, PR = 82, NR = 20;

function pentaPos(i: number): [number, number] {
  const a = (-90 + i * 72) * Math.PI / 180;
  return [CX + PR * Math.cos(a), CY + PR * Math.sin(a)];
}

function arrowSeg(i1: number, i2: number) {
  const [x1, y1] = pentaPos(i1), [x2, y2] = pentaPos(i2);
  const dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / l, uy = dy / l;
  return { x1: x1 + (NR + 2) * ux, y1: y1 + (NR + 2) * uy, x2: x2 - (NR + 6) * ux, y2: y2 - (NR + 6) * uy };
}

/** 파이 wedge 경로. 각도는 12시 방향에서 시작, 시계방향 양수. */
function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 360) {
    // 전체 원
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  }
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const sa = toRad(startDeg), ea = toRad(endDeg);
  const sx = cx + r * Math.cos(sa);
  const sy = cy + r * Math.sin(sa);
  const ex = cx + r * Math.cos(ea);
  const ey = cy + r * Math.sin(ea);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} Z`;
}

interface Props {
  p1: PillarSnapshot;
  p2: PillarSnapshot;
  name1: string;
  name2: string;
}

export default function OhengPairDiagram({ p1, p2, name1, name2 }: Props) {
  const combined = Object.fromEntries(
    ELEMS.map((e) => [e, (p1.element_stats[e] ?? 0) + (p2.element_stats[e] ?? 0)])
  ) as Record<string, number>;

  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">합산 오행 관계도</p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: P1_COLOR }} />
            <span className="text-[var(--color-ink-muted)]">{name1}님</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: P2_COLOR }} />
            <span className="text-[var(--color-ink-muted)]">{name2}님</span>
          </span>
        </div>
      </div>

      <svg viewBox="0 0 240 220" className="w-4/5 mx-auto block">
        <defs>
          <marker id="op-saeng" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#1B6B3A" opacity="0.5" />
          </marker>
          <marker id="op-geuk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#C0392B" opacity="0.4" />
          </marker>
        </defs>

        {SAENG_PAIRS.map(([a, b]) => {
          const s = arrowSeg(a, b);
          return <line key={`s${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#1B6B3A" strokeWidth={1.2} strokeOpacity={0.3} markerEnd="url(#op-saeng)" />;
        })}
        {GEUK_PAIRS.map(([a, b]) => {
          const s = arrowSeg(a, b);
          return <line key={`g${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#C0392B" strokeWidth={1} strokeOpacity={0.22} strokeDasharray="4,3" markerEnd="url(#op-geuk)" />;
        })}

        {ELEMS.map((elem, i) => {
          const [x, y] = pentaPos(i);
          const total = combined[elem] ?? 0;
          const c1 = p1.element_stats[elem] ?? 0;
          const c2 = p2.element_stats[elem] ?? 0;
          const active = total > 0;

          // 노드 크기 — 합산과 무관하게 균일
          const r = NR;

          // 파이 wedge 각도 계산
          let p1Wedge: string | null = null;
          let p2Wedge: string | null = null;
          if (active) {
            if (c1 > 0 && c2 > 0) {
              const p1End = (c1 / total) * 360;
              p1Wedge = wedgePath(x, y, r, 0, p1End);
              p2Wedge = wedgePath(x, y, r, p1End, 360);
            } else if (c1 > 0) {
              p1Wedge = wedgePath(x, y, r, 0, 360);
            } else if (c2 > 0) {
              p2Wedge = wedgePath(x, y, r, 0, 360);
            }
          }

          return (
            <g key={elem}>
              {/* 비활성: 점선 외곽선만 */}
              {!active && (
                <circle cx={x} cy={y} r={r} fill="none"
                  stroke={OHAENG_BORDERS[i]} strokeWidth={1} strokeDasharray="3,2" opacity={0.4} />
              )}
              {/* 활성: 파이 차트 */}
              {active && (
                <>
                  {p1Wedge && <path d={p1Wedge} fill={P1_COLOR} opacity={0.85} />}
                  {p2Wedge && <path d={p2Wedge} fill={P2_COLOR} opacity={0.85} />}
                  <circle cx={x} cy={y} r={r} fill="none" stroke={OHAENG_BORDERS[i]} strokeWidth={1.5} />
                </>
              )}

              {/* 중앙 한자 — 오행 색으로 채우고 흰 헤일로로 파이 배경 위 가독성 확보 */}
              <text x={x} y={y - 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={13} fontWeight={active ? 800 : 400}
                fill={OHAENG_COLORS[i]}
                stroke={active ? "#ffffff" : "none"}
                strokeWidth={active ? 1.8 : 0}
                paintOrder="stroke fill"
                opacity={active ? 1 : 0.45}
                style={{ fontFamily: "serif" }}>
                {elem}
              </text>
              <text x={x} y={y + 9} textAnchor="middle" dominantBaseline="middle"
                fontSize={6.5}
                fill={OHAENG_COLORS[i]}
                stroke={active ? "#ffffff" : "none"}
                strokeWidth={active ? 1.3 : 0}
                paintOrder="stroke fill"
                opacity={active ? 1 : 0.45}>
                {OHAENG_KOR[i]}
              </text>

              {/* 노드 아래 — 각자 기여도 (없으면 0 표시 안 함) */}
              <text x={x} y={y + r + 10} textAnchor="middle" fontSize={9} fontWeight={700}>
                {c1 > 0 && <tspan fill={P1_COLOR}>{c1}</tspan>}
                {c1 > 0 && c2 > 0 && <tspan fill="var(--color-ink-faint)" dx={2}>+</tspan>}
                {c2 > 0 && <tspan fill={P2_COLOR} dx={2}>{c2}</tspan>}
                {!active && <tspan fill="var(--color-ink-faint)">0</tspan>}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#1B6B3A" strokeWidth="1.5" markerEnd="url(#op-saeng)" /></svg>
          <span className="text-[9px] text-[#1B6B3A] font-medium">도움(生)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="14" y2="4" stroke="#C0392B" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#op-geuk)" /></svg>
          <span className="text-[9px] text-[#C0392B] font-medium">억제(克)</span>
        </div>
      </div>
    </div>
  );
}
