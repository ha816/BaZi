"use client";

const OHAENG_IDX: Record<string, number> = { '木':0, '火':1, '土':2, '金':3, '水':4 };
const OHAENG_KOR = ['나무','불','흙','쇠','물'];
const OHAENG_COLORS = ['#1B6B3A','#B02020','#8A4F00','#3D3D3D','#0F4F8A'];
const OHAENG_BGS = ['#C8E6D4','#F8CCC8','#F5DCAA','#E0E0E0','#C4DDF5'];
const OHAENG_BORDERS = ['#6DB890','#E07070','#D4A060','#A0A0A0','#6AAAD8'];
const SAENG_PAIRS: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
const GEUK_PAIRS: [number, number][] = [[0,2],[1,3],[2,4],[3,0],[4,1]];

interface Props {
  myElement: string;
  stemElement: string;
  branchElement: string;
  myChar?: string;
  stemChar?: string;
  branchChar?: string;
  /** 라벨 prefix — "대운"/"세운"/"월운" 등. 천간/지지 노드 라벨에 붙음. */
  label?: string;
  /** 마커 ID 충돌 방지용 prefix */
  markerPrefix?: string;
}

export default function OhaengRelationDiagram({
  myElement, stemElement, branchElement,
  myChar = "", stemChar = "", branchChar = "",
  label = "운",
  markerPrefix = "or",
}: Props) {
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

  const myIdx = OHAENG_IDX[myElement] ?? -1;
  const stemIdx = OHAENG_IDX[stemElement] ?? -1;
  const branchIdx = OHAENG_IDX[branchElement] ?? -1;

  function isHi(a: number, b: number) {
    return (a === myIdx && (b === stemIdx || b === branchIdx)) ||
           ((a === stemIdx || a === branchIdx) && b === myIdx);
  }

  const saengId = `${markerPrefix}-saeng`;
  const geukId = `${markerPrefix}-geuk`;

  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] p-3 relative">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-[var(--color-ink-muted)]">{label} 오행 관계도</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-[2px] bg-[#1B6B3A] rounded" />
            <span className="text-[9px] text-[var(--color-ink-muted)]">도움(生)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 border-t border-dashed border-[#C0392B]" />
            <span className="text-[9px] text-[var(--color-ink-muted)]">억제(剋)</span>
          </div>
        </div>
      </div>
      <svg viewBox="0 -16 200 198" overflow="visible" className="w-2/5 mx-auto block">
        <defs>
          <marker id={saengId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#1B6B3A" opacity="0.7" />
          </marker>
          <marker id={geukId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#C0392B" opacity="0.6" />
          </marker>
        </defs>
        {SAENG_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          const hi = isHi(a,b);
          return <line key={`s${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#1B6B3A" strokeWidth={hi?3:1.2} strokeOpacity={hi?1:0.2} markerEnd={`url(#${saengId})`} />;
        })}
        {GEUK_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b);
          const hi = isHi(a,b);
          return <line key={`g${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#C0392B" strokeWidth={hi?3:1} strokeOpacity={hi?0.9:0.15}
            strokeDasharray={hi?undefined:"4,3"} markerEnd={`url(#${geukId})`} />;
        })}
        {['木','火','土','金','水'].map((elem, i) => {
          const [x,y] = pentaPos(i);
          const isMe = i === myIdx;
          const isStem = i === stemIdx;
          const isBranch = i === branchIdx;
          const active = isMe || isStem || isBranch;
          const meLabel = myChar ? `나(${myChar})` : '나';
          const stemLabel = stemChar ? `${label}천간(${stemChar})` : `${label}천간`;
          const branchLabel = branchChar ? `${label}지지(${branchChar})` : `${label}지지`;
          const nodeLabel = isMe && isStem && isBranch ? `${meLabel}·${stemLabel}·${branchLabel}`
            : isMe && isStem ? `${meLabel}·${stemLabel}` : isMe && isBranch ? `${meLabel}·${branchLabel}`
            : isStem && isBranch ? `${stemLabel}·${branchLabel}`
            : isMe ? meLabel : isStem ? stemLabel : isBranch ? branchLabel : null;
          return (
            <g key={elem}>
              <circle cx={x} cy={y} r={NR}
                fill={active ? OHAENG_BGS[i] : '#F5F2EC'}
                stroke={OHAENG_BORDERS[i]}
                strokeWidth={active?2.5:1} opacity={active?1:0.45} />
              <text x={x} y={y-3} textAnchor="middle" dominantBaseline="middle"
                fontSize={active?16:13} fontWeight={active?700:400}
                fill={OHAENG_COLORS[i]} opacity={active?1:0.4}
                style={{ fontFamily: "serif" }}>
                {elem}
              </text>
              <text x={x} y={y+9} textAnchor="middle" dominantBaseline="middle"
                fontSize={8.5} fill={OHAENG_COLORS[i]} opacity={active?0.85:0.35}>
                {OHAENG_KOR[i]}
              </text>
              {nodeLabel && (() => {
                const lx = i === 1 ? x + NR + 4 : i === 4 ? x - NR - 4 : x;
                const ly = i === 0 ? y - NR - 6 : i === 1 || i === 4 ? y + 3 : y + NR + 11;
                const anchor = i === 1 ? "start" : i === 4 ? "end" : "middle";
                return (
                  <text x={lx} y={ly} textAnchor={anchor}
                    fontSize={8} fontWeight={700}
                    fill={isMe ? '#8A4F00' : OHAENG_COLORS[i]}>
                    {nodeLabel}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
