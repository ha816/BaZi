import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { ganjiToElements } from "@/lib/elementColors";
import DomainBarChart from "@/components/DomainBarChart";
import KkachiTip from "@/components/KkachiTip";

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "조상·사회 영역", "월주": "부모·직장 영역",
  "일주": "나·배우자 영역", "시주": "자녀·미래 영역",
};

const OHAENG_IDX: Record<string, number> = { '木':0, '火':1, '土':2, '金':3, '水':4 };
const OHAENG_KOR = ['나무','불','흙','쇠','물'];
const OHAENG_COLORS = ['#1B6B3A','#B02020','#8A4F00','#3D3D3D','#0F4F8A'];
const OHAENG_BGS = ['#C8E6D4','#F8CCC8','#F5DCAA','#E0E0E0','#C4DDF5'];
const OHAENG_BORDERS = ['#6DB890','#E07070','#D4A060','#A0A0A0','#6AAAD8'];
const SAENG_PAIRS: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,0]];
const GEUK_PAIRS: [number, number][] = [[0,2],[1,3],[2,4],[3,0],[4,1]];

function DaeunSeunDiagram({ myElement, daeunStemElement, daeunBranchElement, seunStemElement, seunBranchElement }: {
  myElement: string; daeunStemElement: string; daeunBranchElement: string;
  seunStemElement: string; seunBranchElement: string;
}) {
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
  const myIdx          = OHAENG_IDX[myElement]          ?? -1;
  const daeunStemIdx   = OHAENG_IDX[daeunStemElement]  ?? -1;
  const daeunBranchIdx = OHAENG_IDX[daeunBranchElement] ?? -1;
  const seunStemIdx    = OHAENG_IDX[seunStemElement]   ?? -1;
  const seunBranchIdx  = OHAENG_IDX[seunBranchElement] ?? -1;
  const activeIdxs = new Set([myIdx, daeunStemIdx, daeunBranchIdx, seunStemIdx, seunBranchIdx].filter(i => i >= 0));
  const daeunIdxs = new Set([daeunStemIdx, daeunBranchIdx].filter(i => i >= 0));
  const seunIdxs  = new Set([seunStemIdx, seunBranchIdx].filter(i => i >= 0));
  function isHi(a: number, b: number) {
    if (!activeIdxs.has(a) || !activeIdxs.has(b)) return false;
    if (daeunIdxs.has(a) && daeunIdxs.has(b)) return false;
    if (seunIdxs.has(a)  && seunIdxs.has(b))  return false;
    return true;
  }

  return (
    <div className="rounded-lg bg-[var(--color-ivory)] border border-[var(--color-border-light)] p-3 mb-4">
      <p className="text-[10px] font-semibold text-[var(--color-ink-muted)] mb-2">대운·세운 오행 관계도</p>
      <svg viewBox="0 0 200 182" className="w-2/3 mx-auto block">
        <defs>
          <marker id="ds-saeng" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#1B6B3A" opacity="0.7" />
          </marker>
          <marker id="ds-geuk" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L5,2.5 z" fill="#C0392B" opacity="0.6" />
          </marker>
        </defs>
        {SAENG_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b); const hi = isHi(a,b);
          return <line key={`s${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#1B6B3A" strokeWidth={hi?3:1.2} strokeOpacity={hi?1:0.2} markerEnd="url(#ds-saeng)" />;
        })}
        {GEUK_PAIRS.map(([a,b]) => {
          const s = arrowSeg(a,b); const hi = isHi(a,b);
          return <line key={`g${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#C0392B" strokeWidth={hi?3:1} strokeOpacity={hi?0.9:0.15}
            strokeDasharray={hi?undefined:"4,3"} markerEnd="url(#ds-geuk)" />;
        })}
        {(['木','火','土','金','水'] as const).map((elem, i) => {
          const [x,y] = pentaPos(i);
          const isMe        = i === myIdx;
          const isDaeunStem = i === daeunStemIdx, isDaeunBranch = i === daeunBranchIdx;
          const isSeunStem  = i === seunStemIdx,  isSeunBranch  = i === seunBranchIdx;
          const isDaeun = isDaeunStem || isDaeunBranch;
          const isSeun  = isSeunStem  || isSeunBranch;
          const active  = isMe || isDaeun || isSeun;
          const labels: string[] = [];
          if (isMe) labels.push('나');
          if (isDaeunStem && isDaeunBranch) labels.push('대운天地');
          else { if (isDaeunStem) labels.push('대운天'); if (isDaeunBranch) labels.push('대운地'); }
          if (isSeunStem && isSeunBranch) labels.push('세운天地');
          else { if (isSeunStem) labels.push('세운天'); if (isSeunBranch) labels.push('세운地'); }
          const strokeWidth = isMe ? 3.5 : active ? 2 : 1;
          const strokeDash  = isMe ? undefined : isDaeun && !isSeun ? "6,3" : isSeun && !isDaeun ? "2,2" : undefined;
          return (
            <g key={elem}>
              <circle cx={x} cy={y} r={NR}
                fill={active ? OHAENG_BGS[i] : '#F5F2EC'}
                stroke={OHAENG_BORDERS[i]} strokeWidth={strokeWidth}
                strokeDasharray={strokeDash} opacity={active?1:0.45} />
              <text x={x} y={y-3} textAnchor="middle" dominantBaseline="middle"
                fontSize={active?16:13} fontWeight={active?700:400}
                fill={OHAENG_COLORS[i]} opacity={active?1:0.4} style={{ fontFamily:"serif" }}>
                {elem}
              </text>
              <text x={x} y={y+9} textAnchor="middle" dominantBaseline="middle"
                fontSize={8.5} fill={OHAENG_COLORS[i]} opacity={active?0.85:0.35}>
                {OHAENG_KOR[i]}
              </text>
              {labels.map((lbl, li) => (
                <text key={li} x={x} y={y+NR+11+(li*9)} textAnchor="middle" fontSize={7} fontWeight={700}
                  fill={OHAENG_COLORS[i]}>
                  {lbl}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1 justify-center flex-wrap">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#78716C" strokeWidth="3"/></svg>
          <span className="text-[9px] text-[var(--color-ink-faint)]">나</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#78716C" strokeWidth="1.5" strokeDasharray="6,3"/></svg>
          <span className="text-[9px] text-[var(--color-ink-faint)]">대운</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="none" stroke="#78716C" strokeWidth="1.5" strokeDasharray="3,2"/></svg>
          <span className="text-[9px] text-[var(--color-ink-faint)]">세운</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-[2px] bg-[#1B6B3A] rounded" />
          <span className="text-[9px] text-[var(--color-ink-faint)]">生</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 border-t-2 border-dashed border-[#C0392B]" />
          <span className="text-[9px] text-[var(--color-ink-faint)]">剋</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function FortuneTab({ natal, postnatal }: Props) {
  const seunEls = ganjiToElements(postnatal.seun_ganji);

  return (
    <div className="space-y-4">
      {/* 대운·세운 총평 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">대운·세운 총평</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          {postnatal.daeun_sipsin.length >= 2 && (
            <DaeunSeunDiagram
              myElement={natal.my_element.name}
              daeunStemElement={postnatal.daeun_sipsin[0].element}
              daeunBranchElement={postnatal.daeun_sipsin[1].element}
              seunStemElement={seunEls.stem}
              seunBranchElement={seunEls.branch}
            />
          )}
          <div className="space-y-1">
            {postnatal.annual_fortune.map((block, i) => (
              block.description && <KkachiTip key={i}>{block.description}</KkachiTip>
            ))}
            {postnatal.major_fortune.flatMap((block, i) =>
              block.tips.map((tip, j) => (
                <KkachiTip key={`${i}-${j}`} label={tip.label || undefined}>{tip.text}</KkachiTip>
              ))
            )}
            {/* 충합 — 총평에 통합 서술 */}
            {(() => {
              const allClashes = [...postnatal.seun_clashes, ...postnatal.daeun_clashes];
              const allCombines = [...postnatal.seun_combines, ...postnatal.daeun_combines];
              const clashGroups: Record<string, string[]> = {};
              for (const c of allClashes) {
                (clashGroups[c.incoming] ??= []).push(PILLAR_LABEL_MAP[c.pillar] ?? c.pillar);
              }
              const combineGroups: Record<string, { areas: string[]; type: string }> = {};
              for (const c of allCombines) {
                if (!combineGroups[c.incoming]) combineGroups[c.incoming] = { areas: [], type: c.type };
                combineGroups[c.incoming].areas.push(PILLAR_LABEL_MAP[c.pillar] ?? c.pillar);
              }
              return (
                <>
                  {Object.entries(clashGroups).map(([char, areas]) => (
                    <KkachiTip key={`clash-${char}`} label="충(衝) — 주의">
                      {char} 기운이 내 사주의 {areas.join("·")}과 부딪혀요. 이 영역에서 갑작스러운 변화나 갈등이 생길 수 있으니 유연하게 대처하세요.
                    </KkachiTip>
                  ))}
                  {Object.entries(combineGroups).map(([char, { areas, type }]) => (
                    <KkachiTip key={`combine-${char}`} label="합(合) — 기회">
                      {char} 기운이 내 사주의 {areas.join("·")}과 합({type})을 이루어요. 이 영역에서 좋은 인연이나 기회가 자연스럽게 열릴 수 있어요.
                    </KkachiTip>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 영역별 운세 */}
      <div className="slide-card">
        <div className="slide-card__header">
          <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">영역별 운세</h3>
        </div>
        <div className="divider" />
        <div className="slide-card__body">
          {(() => {
            const entries = Object.entries(postnatal.domain_scores);
            if (entries.length === 0) return null;
            const best = entries.reduce((a, b) => b[1].score > a[1].score ? b : a);
            const worst = entries.reduce((a, b) => b[1].score < a[1].score ? b : a);
            if (best[0] === worst[0]) return null;
            return (
              <KkachiTip>
                올해 가장 좋은 영역은 <strong>{best[0]}</strong>이에요. <strong>{worst[0]}</strong>은 상대적으로 아쉬우니 조심하세요.
              </KkachiTip>
            );
          })()}
          <DomainBarChart scores={postnatal.domain_scores} />
          <div className="mt-5 pt-5 border-t border-[var(--color-border-light)] space-y-1">
            {postnatal.fortune_by_domain.map((block, i) => (
              <div key={i}>
                {block.description && (
                  <KkachiTip label={block.category || undefined}>{block.description}</KkachiTip>
                )}
                {block.tips.map((tip, j) => (
                  <KkachiTip key={j} label={tip.label || undefined}>{tip.text}</KkachiTip>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
