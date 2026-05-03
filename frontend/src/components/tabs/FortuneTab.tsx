import type { NatalResult, PostnatalResult } from "@/types/analysis";
import { getElementInfo } from "@/lib/elementColors";
import DomainBarChart from "@/components/DomainBarChart";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";

const STEM_ELEMENT: Record<string, string> = {
  甲:"木", 乙:"木", 丙:"火", 丁:"火", 戊:"土",
  己:"土", 庚:"金", 辛:"金", 壬:"水", 癸:"水",
};
const BRANCH_ELEMENT: Record<string, string> = {
  子:"水", 丑:"土", 寅:"木", 卯:"木", 辰:"土", 巳:"火",
  午:"火", 未:"土", 申:"金", 酉:"金", 戌:"土", 亥:"水",
};

// 합화 오행 — 천간합 5쌍 + 지지육합 6쌍 (양방향 키)
const COMBINE_OHENG: Record<string, string> = {
  "甲己":"土", "己甲":"土", "乙庚":"金", "庚乙":"金",
  "丙辛":"水", "辛丙":"水", "丁壬":"木", "壬丁":"木", "戊癸":"火", "癸戊":"火",
  "子丑":"土", "丑子":"土", "寅亥":"木", "亥寅":"木",
  "卯戌":"火", "戌卯":"火", "辰酉":"金", "酉辰":"金", "巳申":"水", "申巳":"水", "午未":"土", "未午":"土",
};

const ELEMENT_TO_COLOR: Record<string, string> = {
  "木": "#1B6B3A", "火": "#B02020", "土": "#8A4F00", "金": "#3D3D3D", "水": "#0F4F8A",
};

const BRANCH_KOR: Record<string, string> = {
  子:"자", 丑:"축", 寅:"인", 卯:"묘", 辰:"진", 巳:"사",
  午:"오", 未:"미", 申:"신", 酉:"유", 戌:"술", 亥:"해",
};

function CheonganCircleDiagram() {
  const CX = 100, CY = 100, PR = 75, NR = 13;
  const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const STEM_KOR_LOCAL: Record<string, string> = {
    甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무",
    己:"기", 庚:"경", 辛:"신", 壬:"임", 癸:"계",
  };
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
              {STEM_KOR_LOCAL[st]}
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

const PILLAR_LABEL_MAP: Record<string, string> = {
  "년주": "조상·사회 영역", "월주": "부모·직장 영역",
  "일주": "나·배우자 영역", "시주": "자녀·미래 영역",
};

const SIPSIN_KOR: Record<string, string> = {
  "比肩": "비견", "劫財": "겁재", "食神": "식신", "傷官": "상관",
  "偏財": "편재", "正財": "정재", "偏官": "편관", "正官": "정관",
  "偏印": "편인", "正印": "정인",
};

const DOMAIN_BY_SIPSIN: Record<string, string> = {
  "偏財": "재물운", "正財": "재물운",
  "偏官": "직장·사회운", "正官": "직장·사회운",
  "偏印": "학업·자격운", "正印": "학업·자격운",
  "食神": "표현·건강운", "傷官": "표현·건강운",
  "比肩": "대인관계", "劫財": "대인관계",
};

const STEM_KOR: Record<string, string> = {
  甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무",
  己:"기", 庚:"경", 辛:"신", 壬:"임", 癸:"계",
};

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

  // 월운 영역 뱃지 — 이번달 천간/지지 십신을 영역별로 매핑
  const currentMonth = postnatal.upcoming_months?.[0];
  const monthBadges: Record<string, string[]> = {};
  if (currentMonth) {
    for (const s of [currentMonth.stem_sipsin, currentMonth.branch_sipsin]) {
      const domain = DOMAIN_BY_SIPSIN[s.name];
      if (!domain) continue;
      const label = `${SIPSIN_KOR[s.name] ?? s.name}(${s.name})`;
      (monthBadges[domain] ??= []).push(label);
    }
  }

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
            {hasClashCombine && (
              <div className="space-y-2">
                {allClashes.map((c, i) => {
                  const areaLabel = PILLAR_LABEL_MAP[c.pillar] ?? c.pillar;
                  return (
                    <div key={`clash-${i}`}
                      className="rounded-xl border p-3 space-y-2"
                      style={{ borderColor: "#E0A8A3", backgroundColor: "#F7EDEC" }}>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--color-fire)" }}>
                        지지충(支冲) — {BRANCH_KOR[c.target] ?? c.target}({c.target})·{BRANCH_KOR[c.incoming] ?? c.incoming}({c.incoming})
                      </p>
                      <KkachiTip>
                        <strong style={{ color: "var(--color-fire)" }}>{BRANCH_KOR[c.target] ?? c.target}({c.target})·{BRANCH_KOR[c.incoming] ?? c.incoming}({c.incoming})</strong>은 십이지지 원형에서 정반대의 짝인 지지충이에요. {c.pillar}의 {BRANCH_KOR[c.target] ?? c.target}({c.target})과 충이기에 <strong className="text-[var(--color-ink)]">{areaLabel}</strong>에서 갑작스런 변화나 갈등이 생길 수 있으니 유연하게 대처하세요.
                      </KkachiTip>
                    </div>
                  );
                })}
                {allCombines.map((c, i) => {
                  const isStemHap = c.type === "천간합";
                  const harmonyEl = COMBINE_OHENG[`${c.incoming}${c.target}`] ?? "";
                  const harmonyInfo = harmonyEl ? getElementInfo(harmonyEl) : null;
                  const areaLabel = PILLAR_LABEL_MAP[c.pillar] ?? c.pillar;
                  const pairLabel = isStemHap ? "천간합 5쌍" : "지지육합 6쌍";
                  return (
                    <div key={`combine-${i}`}
                      className="rounded-xl border p-3 space-y-2"
                      style={{ borderColor: "#A8C9B5", backgroundColor: "#EEF4F0" }}>
                      <p className="text-[10px] font-semibold" style={{ color: "var(--color-wood)" }}>
                        {c.type} — {(isStemHap ? STEM_KOR : BRANCH_KOR)[c.incoming] ?? c.incoming}({c.incoming})·{(isStemHap ? STEM_KOR : BRANCH_KOR)[c.target] ?? c.target}({c.target})
                      </p>
                      <KkachiTip>
                        <strong style={{ color: "var(--color-wood)" }}>{c.incoming}·{c.target}</strong>은 {pairLabel} 중 하나로 결이 맞아요{harmonyInfo && (<> (합화 <strong style={{ color: harmonyInfo.color }}>{harmonyInfo.korean}({harmonyEl})</strong>)</>)}. <strong className="text-[var(--color-ink)]">{areaLabel}</strong>에서 좋은 인연이나 기회가 자연스럽게 열릴 수 있어요.
                      </KkachiTip>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 영역별 운세 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="영역별 운세">
          직장·재물·관계 등 <strong className="text-[var(--color-ink)]">삶의 영역마다</strong> 올해 운의 강도가 달라요. 대운(10년)·세운(올해) 십신 분포로 점수를 매기고, 이번달 월운 십신을 뱃지로 함께 표시해요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            어떤 영역에서 운이 잘 풀리고 어떤 영역에서 조심해야 할지 한눈에 봐요. <strong>이번달 +X</strong> 뱃지는 월운에서 그 영역에 추가로 들어오는 기운이에요.
          </KkachiTip>
          <DomainBarChart scores={postnatal.domain_scores} monthBadges={monthBadges} />
          <div className="space-y-1">
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
