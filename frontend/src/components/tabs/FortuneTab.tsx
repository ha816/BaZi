import type { NatalResult, PostnatalResult } from "@/types/analysis";
import DomainBarChart from "@/components/DomainBarChart";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import { STEM_KOR, BRANCH_KOR, STEM_ELEMENT, BRANCH_ELEMENT } from "@/lib/ganji";

const ELEMENT_TO_COLOR: Record<string, string> = {
  "木": "#1B6B3A", "火": "#B02020", "土": "#8A4F00", "金": "#3D3D3D", "水": "#0F4F8A",
};

function CheonganCircleDiagram() {
  const CX = 100, CY = 100, PR = 75, NR = 13;
  const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  function pos(i: number): [number, number] {
    const a = (-90 + i * 36) * Math.PI / 180;
    return [CX + PR * Math.cos(a), CY + PR * Math.sin(a)];
  }
  function chordSeg(i1: number, i2: number) {
    const [x1,y1] = pos(i1), [x2,y2] = pos(i2);
    const dx = x2-x1, dy = y2-y1, l = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/l, uy = dy/l;
    return { x1: x1+NR*ux, y1: y1+NR*uy, x2: x2-NR*ux, y2: y2-NR*uy };
  }
  // 천간합 5쌍 — 모두 정반대 위치(5칸 차이)
  const COMBINE_PAIRS: [number, number][] = [[0,5],[1,6],[2,7],[3,8],[4,9]];
  return (
    <svg viewBox="0 0 200 200" className="w-2/5 mx-auto block">
      {COMBINE_PAIRS.map(([a,b]) => {
        const s = chordSeg(a,b);
        return <line key={`tc${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="#1B6B3A" strokeWidth={1.2} opacity={0.5} />;
      })}
      {STEMS.map((st, i) => {
        const [x,y] = pos(i);
        const elColor = ELEMENT_TO_COLOR[STEM_ELEMENT[st]] ?? "#78716C";
        return (
          <g key={st}>
            <circle cx={x} cy={y} r={NR} fill="white" stroke={elColor} strokeWidth={1.5} />
            <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="central"
              fontSize={13} fontWeight={700} fill={elColor} style={{ fontFamily: "serif" }}>
              {st}
            </text>
            <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="central"
              fontSize={7} fill={elColor} opacity={0.85}>
              {STEM_KOR[st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function JijiCircleDiagram() {
  const CX = 100, CY = 100, PR = 75, NR = 13;
  const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  function pos(i: number): [number, number] {
    const a = (-90 + i * 30) * Math.PI / 180;
    return [CX + PR * Math.cos(a), CY + PR * Math.sin(a)];
  }
  function chordSeg(i1: number, i2: number) {
    const [x1,y1] = pos(i1), [x2,y2] = pos(i2);
    const dx = x2-x1, dy = y2-y1, l = Math.sqrt(dx*dx+dy*dy);
    const ux = dx/l, uy = dy/l;
    return { x1: x1+NR*ux, y1: y1+NR*uy, x2: x2-NR*ux, y2: y2-NR*uy };
  }
  // 6충: 정반대(6칸 차이)
  const CLASH_PAIRS: [number, number][] = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  // 6육합
  const COMBINE_PAIRS: [number, number][] = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
  return (
    <svg viewBox="0 0 200 200" className="w-2/5 mx-auto block">
      {CLASH_PAIRS.map(([a,b]) => {
        const s = chordSeg(a,b);
        return <line key={`c${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="#C0392B" strokeWidth={1.2} opacity={0.5} />;
      })}
      {COMBINE_PAIRS.map(([a,b]) => {
        const s = chordSeg(a,b);
        return <line key={`h${a}${b}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="#1B6B3A" strokeWidth={1.2} opacity={0.5} />;
      })}
      {BRANCHES.map((br, i) => {
        const [x,y] = pos(i);
        const elColor = ELEMENT_TO_COLOR[BRANCH_ELEMENT[br]] ?? "#78716C";
        return (
          <g key={br}>
            <circle cx={x} cy={y} r={NR} fill="white" stroke={elColor} strokeWidth={1.5} />
            <text x={x} y={y - 2} textAnchor="middle" dominantBaseline="central"
              fontSize={13} fontWeight={700} fill={elColor} style={{ fontFamily: "serif" }}>
              {br}
            </text>
            <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="central"
              fontSize={7} fill={elColor} opacity={0.85}>
              {BRANCH_KOR[br]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DaeunSeunTable({ pillars, daeunGanji, seunGanji }: {
  pillars: string[]; daeunGanji: string; seunGanji: string;
}) {
  const cols = [
    { key: "년주", label: "년주", group: "natal" as const, stem: pillars[0]?.[0] ?? "", branch: pillars[0]?.[1] ?? "" },
    { key: "월주", label: "월주", group: "natal" as const, stem: pillars[1]?.[0] ?? "", branch: pillars[1]?.[1] ?? "" },
    { key: "일주", label: "일주", group: "natal" as const, stem: pillars[2]?.[0] ?? "", branch: pillars[2]?.[1] ?? "" },
    { key: "시주", label: "시주", group: "natal" as const, stem: pillars[3]?.[0] ?? "", branch: pillars[3]?.[1] ?? "" },
    { key: "대운", label: "대운", group: "un" as const, stem: daeunGanji[0] ?? "", branch: daeunGanji[1] ?? "" },
    { key: "세운", label: "세운", group: "un" as const, stem: seunGanji[0] ?? "", branch: seunGanji[1] ?? "" },
  ];
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
      <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--color-ivory)" }}>
            <th className="text-[9px] font-medium text-[var(--color-ink-faint)] py-1.5 px-1"></th>
            {cols.map(({ key, label, group }) => (
              <th key={key} className="text-[10px] font-semibold py-1.5 px-1"
                style={{
                  color: group === "un" ? "var(--color-gold)" : "var(--color-ink-muted)",
                  borderLeft: key === "대운" ? "1px dashed var(--color-border)" : undefined,
                }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">천간(天干)</td>
            {cols.map(({ key, stem }) => (
              <td key={key} className="py-1.5 px-1"
                style={{ borderLeft: key === "대운" ? "1px dashed var(--color-border)" : undefined }}>
                <span className="font-heading text-xs font-bold leading-tight text-[var(--color-ink)]">
                  {stem ? `${STEM_KOR[stem] ?? stem}(${stem})` : "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-t border-[var(--color-border-light)]">
            <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">지지(地支)</td>
            {cols.map(({ key, branch }) => (
              <td key={key} className="py-1.5 px-1"
                style={{ borderLeft: key === "대운" ? "1px dashed var(--color-border)" : undefined }}>
                <span className="font-heading text-xs font-bold leading-tight text-[var(--color-ink)]">
                  {branch ? `${BRANCH_KOR[branch] ?? branch}(${branch})` : "—"}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
}

export default function FortuneTab({ natal, postnatal }: Props) {
  // 충합 데이터 — 각 항목별로 incoming/target/pillar 모두 보여줌
  const allClashes = [...postnatal.seun_clashes, ...postnatal.daeun_clashes];
  const allCombines = [...postnatal.seun_combines, ...postnatal.daeun_combines];
  const hasClashCombine = allClashes.length > 0 || allCombines.length > 0;

  return (
    <div className="space-y-4">
      {/* 충합(衝合) */}
      {(hasClashCombine || postnatal.daeun_sipsin.length >= 2) && (
        <div className="slide-card">
          <CollapsibleSectionHeader title="충합(衝合)">
            <p>
              사주팔자에 대운·세운이 들어오면서 부딪히는 게 <strong className="text-[var(--color-ink)]">충(衝)</strong>, 맞붙는 게 <strong className="text-[var(--color-ink)]">합(合)</strong>이에요.
            </p>
            <p>
              천간끼리의 합을 <strong className="text-[var(--color-ink)]">천간합(天干合)</strong>, 지지끼리의 합과 충을 각각 <strong className="text-[var(--color-ink)]">지지합(地支合)</strong>, <strong className="text-[var(--color-ink)]">지지충(地支冲)</strong>이라고 합니다.
            </p>
            <p>
              아래는 <strong className="text-[var(--color-ink)]">십간(十干)</strong>을 시계처럼 원형 배치한 그림이에요. 정반대 위치의 다섯 쌍이 천간합이에요.
            </p>
            <CheonganCircleDiagram />
            <p>
              <strong className="text-[var(--color-ink)]">십이지지(十二地支)</strong>도 시계처럼 원형으로 배치한 그림이에요. 정반대의 여섯 짝은 지지충, 맞붙는 여섯 짝은 지지합이라 합니다.
            </p>
            <JijiCircleDiagram />
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-[1.5px] bg-[#C0392B]" />
                <span className="text-[10px]">충</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-[1.5px] bg-[#1B6B3A]" />
                <span className="text-[10px]">합</span>
              </div>
            </div>
          </CollapsibleSectionHeader>
          <div className="divider" />
          <div className="slide-card__body space-y-4">
            <KkachiTip>
              나의 사주팔자와 대운·세운이 어느 영역에서 부딪히고 어떤 영역에 조화로운지 보세요.
            </KkachiTip>
            {postnatal.daeun_sipsin.length >= 2 && (
              <DaeunSeunTable
                pillars={natal.pillars}
                daeunGanji={postnatal.daeun_sipsin[0].char + postnatal.daeun_sipsin[1].char}
                seunGanji={postnatal.seun_ganji}
              />
            )}
            {!hasClashCombine && (
              <KkachiTip>
                올해는 들어오는 글자가 사주와 부딪히거나 맞물리는 짝이 없어요. 큰 변동·결합 없이 잔잔하게 흘러가는 시기예요.
              </KkachiTip>
            )}
            {hasClashCombine && (
              <div className="space-y-2">
                {allClashes.map((c, i) => (
                  <div key={`clash-${i}`}
                    className="rounded-xl border p-3 space-y-2"
                    style={{ borderColor: "#E0A8A3", backgroundColor: "#F7EDEC" }}>
                    <p className="text-[10px] font-semibold" style={{ color: "var(--color-fire)" }}>
                      지지충(支冲) — {c.target_korean}({c.target})·{c.incoming_korean}({c.incoming})
                    </p>
                    <KkachiTip>{c.narrative}</KkachiTip>
                  </div>
                ))}
                {allCombines.map((c, i) => {
                  const charKor = c.type === "천간합" ? STEM_KOR : BRANCH_KOR;
                  return (
                    <div key={`combine-${i}`}
                      className="rounded-xl border p-3 space-y-2"
                      style={{ borderColor: "#A8C9B5", backgroundColor: "#EEF4F0" }}>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--color-wood)" }}>
                        {c.type} — {charKor[c.incoming] ?? c.incoming_korean}({c.incoming})·{charKor[c.target] ?? c.target_korean}({c.target})
                      </p>
                      <KkachiTip>{c.narrative}</KkachiTip>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 삶의 영역별 운(運) */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="삶의 영역별 운(運)">
          <strong className="text-[var(--color-ink)]">재성(財·재물운)·관성(官·관록운)·인성(印·학문운)·식상(食傷·재능운)·비겁(比劫·인연운)</strong> — 사주까치는 이 다섯 가지로 삶의 영역을 정의해요. 대운(10년)·세운(올해) 십신 분포로 점수를 매기고, 월운(이번달) 십신을 뱃지로 함께 표시해요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            어떤 영역에서 운이 잘 풀리고 조심해야 할지 한눈에 봐요.
          </KkachiTip>
          <DomainBarChart scores={postnatal.domain_scores} monthBadges={postnatal.month_badges} />
          {(() => {
            const sorted = Object.entries(postnatal.domain_scores).sort(([, a], [, b]) => b.score - a.score);
            if (sorted.length === 0) return null;
            const [bestName, bestInfo] = sorted[0];
            const [worstName, worstInfo] = sorted[sorted.length - 1];
            const blockByCategory = Object.fromEntries(postnatal.fortune_by_domain.map((b) => [b.category, b]));
            const bestBlock = blockByCategory[bestName];
            const worstBlock = blockByCategory[worstName];
            const bestTip = bestBlock?.tips?.[0]?.text;
            return (
              <KkachiTip>
                올해 가장 좋은 영역은 <strong>{bestName}</strong>({bestInfo.score}%)이에요.
                {bestBlock?.description && <> {bestBlock.description}</>}
                {bestTip && <> {bestTip}</>}
                {bestName !== worstName && (
                  <> 반대로 <strong>{worstName}</strong>({worstInfo.score}%)은 잠잠한 시기니 큰 변화보다 내실을 다지세요.</>
                )}
              </KkachiTip>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
