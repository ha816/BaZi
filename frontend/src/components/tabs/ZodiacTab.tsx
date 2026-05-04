"use client";
import { useState } from "react";
import type { NatalResult, PillarPair, PillarZodiac, PostnatalResult, ZodiacRelation } from "@/types/analysis";
import KkachiTip from "@/components/KkachiTip";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import InlineCollapsibleHeader from "@/components/InlineCollapsibleHeader";
import { BRANCH_KOR } from "@/lib/ganji";

const RELATION_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "나":   { label: "나",        color: "#8A5A10", bg: "#F5DC90", border: "#C89030" },
  "삼합": { label: "삼합(三合)", color: "#1A7A4A", bg: "#C8EDD8", border: "#5CB882" },
  "육합": { label: "육합(六合)", color: "#1A5FA0", bg: "#C8DFF5", border: "#5A9ED0" },
  "보통": { label: "보통",        color: "#8A8A96", bg: "#F0F0F4", border: "#C8C8D4" },
  "원진": { label: "원진(怨嗔)", color: "#B05A20", bg: "#FCDDC0", border: "#E09050" },
  "충":   { label: "충(衝)",     color: "#B82020", bg: "#FBCFC8", border: "#E07070" },
};

const HARMONY_RELATIONS = new Set(["삼합", "육합"]);

function PillarRelationDiagram({ pillars, pairs }: { pillars: PillarZodiac[]; pairs: PillarPair[] }) {
  // 표시 순서는 시→일→월→년 (pillars 배열은 년→월→일→시 순)
  const display = [...pillars].reverse();
  const dispIdx = (origIdx: number) => pillars.length - 1 - origIdx;

  const hasHarmony = pairs.some((p) => HARMONY_RELATIONS.has(p.relation));
  const hasTension = pairs.some((p) => !HARMONY_RELATIONS.has(p.relation));

  const W = 320;
  const NODE_R = 26;
  const ARC_TOP = hasHarmony ? 60 : 14;
  const ARC_BOTTOM = hasTension ? 60 : 22;
  const NODE_Y = ARC_TOP + NODE_R;
  const H = NODE_Y + NODE_R + ARC_BOTTOM;
  const COL = W / display.length;
  const xs = display.map((_, i) => COL / 2 + i * COL);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[360px] mx-auto block">
      <line
        x1={6}
        y1={NODE_Y}
        x2={W - 6}
        y2={NODE_Y}
        stroke="var(--color-border-light)"
        strokeDasharray="2 4"
      />

      {pairs.map((p) => {
        const a = dispIdx(p.i);
        const b = dispIdx(p.j);
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const x1 = xs[lo];
        const x2 = xs[hi];
        const dist = hi - lo;
        const isHarmony = HARMONY_RELATIONS.has(p.relation);
        const arcLift = 22 + (dist - 1) * 14;
        const startY = isHarmony ? NODE_Y - NODE_R : NODE_Y + NODE_R;
        const ctrlY = isHarmony ? startY - arcLift * 2 : startY + arcLift * 2;
        const path = `M ${x1} ${startY} Q ${(x1 + x2) / 2} ${ctrlY} ${x2} ${startY}`;
        const style = RELATION_STYLE[p.relation] ?? RELATION_STYLE["보통"];
        const dasharray =
          p.relation === "충" ? "6 3" :
          p.relation === "원진" ? "4 3" :
          undefined;
        const labelY = (startY + ctrlY) / 2;
        return (
          <g key={`pp-${p.i}-${p.j}`}>
            <path d={path} fill="none" stroke={style.color} strokeWidth={2} strokeDasharray={dasharray} opacity={0.85} />
            <rect
              x={(x1 + x2) / 2 - 22}
              y={labelY - 8}
              width={44}
              height={14}
              rx={7}
              fill={style.bg}
              stroke={style.border}
              strokeWidth={0.8}
            />
            <text
              x={(x1 + x2) / 2}
              y={labelY + 2}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill={style.color}
            >
              {style.label}
            </text>
          </g>
        );
      })}

      {display.map((pz, i) => {
        const x = xs[i];
        const isInPair = pairs.some((p) => dispIdx(p.i) === i || dispIdx(p.j) === i);
        const stroke = isInPair ? "var(--color-ink-muted)" : "var(--color-border-light)";
        const pillarShort = pz.pillar_label.replace(/\(.*\)/, "");
        return (
          <g key={`pn-${i}`}>
            <circle cx={x} cy={NODE_Y} r={NODE_R} fill="white" stroke={stroke} strokeWidth={1.2} />
            <text x={x} y={NODE_Y - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--color-ink-faint)">
              {pillarShort}
            </text>
            <text x={x} y={NODE_Y + 16} textAnchor="middle" fontSize="20">
              {pz.info.emoji}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ZodiacCircle({ relations, userBranch }: { relations: ZodiacRelation[]; userBranch: string }) {
  const SIZE = 380;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_NODES = 130;
  const NODE_R = 28;

  const positions = relations.map((r, i) => {
    const angle = (-90 + i * 30) * Math.PI / 180;
    return {
      ...r,
      x: CX + R_NODES * Math.cos(angle),
      y: CY + R_NODES * Math.sin(angle),
    };
  });

  const userPos = positions.find(p => p.branch === userBranch);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full max-w-[400px] mx-auto block">
      <circle cx={CX} cy={CY} r={R_NODES} fill="none" stroke="var(--color-border-light)" strokeDasharray="3 3" />

      {/* 관계 라인 — user → 삼합·육합·원진·충 */}
      {userPos && positions.map(p => {
        if (p.branch === userBranch || p.relation === "보통" || p.relation === "나") return null;
        const style = RELATION_STYLE[p.relation];
        const dasharray =
          p.relation === "원진" ? "6 4" :
          p.relation === "충"   ? "10 3" :
          undefined;
        return (
          <line key={`l-${p.branch}`}
            x1={userPos.x} y1={userPos.y} x2={p.x} y2={p.y}
            stroke={style.color}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={dasharray}
            opacity={0.85}
          />
        );
      })}

      {/* 12 nodes */}
      {positions.map(p => {
        const isUser = p.branch === userBranch;
        const style = RELATION_STYLE[p.relation] ?? RELATION_STYLE["보통"];
        const radial = Math.atan2(p.y - CY, p.x - CX);
        const cosR = Math.cos(radial);
        const sinR = Math.sin(radial);
        const labelOffset = NODE_R + 10;
        const lx = p.x + labelOffset * cosR;
        const ly = p.y + labelOffset * sinR;
        const textAnchor: "start" | "end" | "middle" =
          cosR > 0.3 ? "start" : cosR < -0.3 ? "end" : "middle";
        return (
          <g key={p.branch}>
            <circle cx={p.x} cy={p.y} r={NODE_R}
              fill={style.bg} stroke={style.border} strokeWidth={isUser ? 2.5 : 1}
            />
            <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize="26">
              {p.info.emoji}
            </text>
            <text x={lx} y={ly} textAnchor={textAnchor}
              fontSize="13" fontWeight="600"
              fill={style.color}
              dominantBaseline="middle"
            >
              {p.info.korean}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

export default function ZodiacTab({ natal, postnatal }: Props) {
  const [showYearGungham, setShowYearGungham] = useState(false);
  const zodiac = natal.zodiac;

  if (!zodiac) return null;

  const yearInfo = zodiac.year_info;
  const yearGunghamRows = postnatal.year_zodiac_relations;

  return (
    <div className="space-y-4">

      {/* 나의 띠 심층 프로필 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="십이지신(十二支神)">
          해를 <strong className="text-[var(--color-ink)]">십이 동물 신령</strong>으로 나눈 것이 십이지신입니다. 태어난 해의 지지(地支)가 곧 자신의 띠가 돼요. 쥐(子)·소(丑)·호랑이(寅)·토끼(卯)·용(辰)·뱀(巳)·말(午)·양(未)·원숭이(申)·닭(酉)·개(戌)·돼지(亥) — 열두 띠가 차례로 한 해씩 자리를 지켜요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            우리에게 친숙한 <strong>십이지신 띠</strong> 풀이를 해볼게요. 보통 띠는 사회·대외 이미지에 영향력이 커요.
          </KkachiTip>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-heading text-lg font-bold text-[var(--color-ink)]">{yearInfo.korean}띠</span>
              <span className="text-xs text-[var(--color-ink-faint)]">{zodiac.year_branch} · {yearInfo.keyword}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {yearInfo.traits.map((t) => (
                <span key={t} className="text-xs bg-[var(--color-ivory)] border border-[var(--color-border-light)] rounded-full px-2.5 py-0.5 text-[var(--color-ink-muted)]">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <img
            src={`/kkachi/zodiac/zodiac_${yearInfo.korean}.png`}
            alt={`${yearInfo.korean}띠`}
            className="w-2/3 mx-auto block mt-3 rounded-3xl"
            style={{
              mixBlendMode: "multiply",
              maskImage: "radial-gradient(ellipse 85% 80% at 50% 45%, black 55%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 85% 80% at 50% 45%, black 55%, transparent 100%)",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <KkachiTip>
            나의 띠는 <strong>{yearInfo.korean}({zodiac.year_branch})</strong>예요. 사람들에게 <strong>{yearInfo.keyword}</strong>의 결로 비춰지는 캐릭터예요.
          </KkachiTip>

          {/* 사주지지(四柱地支) 서브섹션 */}
          <div className="divider" />
          <InlineCollapsibleHeader title="사주지지(四柱地支)">
            사주의 네 기둥 각각에는 <strong className="text-[var(--color-ink)]">지지(地支)</strong>, 즉 띠가 하나씩 들어 있어요. 년주만이 아니라 4개의 띠가 삶의 각 영역에 숨어 있는 나의 본모습이에요.
          </InlineCollapsibleHeader>
          <div className="divider" />
          <KkachiTip>
            사주지지에는 <strong>네 가지 띠</strong>가 있어요. 시주·일주·월주·년주 각 자리의 띠가 모여 나를 표현합니다.
          </KkachiTip>
          <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
            <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "52px" }} />
                <col />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "var(--color-ivory)" }}>
                  <th className="text-[9px] font-medium text-[var(--color-ink-faint)] py-1.5 px-1"></th>
                  {[
                    { kor: "시주", han: "時柱" },
                    { kor: "일주", han: "日柱" },
                    { kor: "월주", han: "月柱" },
                    { kor: "년주", han: "年柱" },
                  ].map(({ kor, han }) => (
                    <th key={kor} className="text-[10px] font-semibold text-[var(--color-ink-muted)] py-1.5 px-1">
                      {kor}({han})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--color-border-light)]">
                  <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">지지(地支)</td>
                  {[...zodiac.pillar_zodiacs].reverse().map((pz, i) => (
                    <td key={`b-${i}`} className="py-1.5 px-1">
                      <span className="font-heading text-xs font-bold leading-tight text-[var(--color-ink)]">
                        {BRANCH_KOR[pz.branch] ?? pz.branch}({pz.branch})
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border-light)]">
                  <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">띠(生肖)</td>
                  {[...zodiac.pillar_zodiacs].reverse().map((pz, i) => (
                    <td key={`z-${i}`} className="py-1.5 px-1">
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-lg">{pz.info.emoji}</span>
                        <span className="text-[10px] text-[var(--color-ink-muted)]">{pz.info.korean}띠</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border-light)]">
                  <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">기운(氣運)</td>
                  {[...zodiac.pillar_zodiacs].reverse().map((pz, i) => (
                    <td key={`k-${i}`} className="py-1.5 px-1">
                      <span className="text-[10px] font-semibold text-[var(--color-ink)] leading-snug">
                        {pz.info.keyword}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-[var(--color-border-light)]">
                  <td className="text-[9px] py-1.5 px-1 whitespace-nowrap text-left text-[var(--color-ink-faint)]">역할(役割)</td>
                  {[...zodiac.pillar_zodiacs].reverse().map((pz, i) => (
                    <td key={`r-${i}`} className="py-1.5 px-1">
                      <span className="text-[10px] text-[var(--color-ink-faint)] leading-snug">{pz.role}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          {zodiac.pillar_pairs.length > 0 && (
            <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] py-2">
              <PillarRelationDiagram pillars={zodiac.pillar_zodiacs} pairs={zodiac.pillar_pairs} />
            </div>
          )}
          <KkachiTip>{zodiac.pillar_tip}</KkachiTip>
        </div>
      </div>

      {/* 12띠 궁합 등급 표 */}
      <div className="slide-card">
        <CollapsibleSectionHeader title="십이지 충합(十二支 衝合)">
          년주인 <strong className="text-[var(--color-ink)]">{yearInfo.korean}띠({zodiac.year_branch})</strong> 기준 다른 11개 띠와의 충(衝)·합(合) 분류예요. 삼합·육합은 시너지, 충·원진은 마찰. 실제 궁합은 일주(日柱) 포함 전체 사주로 봐야 하니 참고 지표로만 활용하세요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            띠끼리도 결이 맞는 짝과 부딪히는 짝이 있어요. 단, 띠는 사주의 한 글자일 뿐이라 전체 궁합과는 다를 수 있어요.
          </KkachiTip>
          <ZodiacCircle relations={zodiac.relations} userBranch={zodiac.year_branch} />

          {/* 범례 */}
          <div className="rounded-lg p-3 bg-[var(--color-ivory)] border border-[var(--color-border-light)]">
            <p className="text-[10px] font-semibold text-[var(--color-ink-faint)] mb-2">충합 분류</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(["삼합", "육합", "보통", "원진", "충"]).map((r) => {
                const s = RELATION_STYLE[r];
                const desc: Record<string, string> = {
                  "삼합": "최고 궁합 · 에너지 시너지",
                  "육합": "좋은 궁합 · 조화로운 관계",
                  "보통": "무난 · 특별한 충합 없음",
                  "원진": "긴장·갈등 · 노력 필요",
                  "충": "대립 · 강한 마찰 가능",
                };
                return (
                  <div key={r} className="flex items-center gap-1.5">
                    <span
                      className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}
                    >
                      {s.label}
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-faint)]">{desc[r]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 연도별 띠 궁합 */}
          <div className="divider" />
          <InlineCollapsibleHeader title="연도별 띠 궁합">
            올해와 내년·내후년의 <strong className="text-[var(--color-ink)]">띠 흐름</strong>이 내 띠와 어떻게 맞는지 살펴봐요. 삼합·육합 해엔 흐름이 부드럽고, 충 해엔 마찰이 생기기 쉬워요.
          </InlineCollapsibleHeader>
          <div className="divider" />
          <KkachiTip>
            앞으로 들어오는 해의 띠 기운이 나와 어떤 결인지 미리 보면 큰 결정 타이밍 잡기 좋아요.
          </KkachiTip>
          {!showYearGungham ? (
            <button
              onClick={() => setShowYearGungham(true)}
              className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
            >
              🐾 연도별 띠 궁합 확인하기
            </button>
          ) : (
            <>
              <div className="grid gap-1.5 grid-cols-4">
                {yearGunghamRows.map((row) => {
                  const isGood = row.relation === "삼합" || row.relation === "육합";
                  const style = RELATION_STYLE[row.relation] ?? RELATION_STYLE["보통"];
                  return (
                    <div
                      key={row.year}
                      className="flex flex-col items-center gap-1 rounded-xl p-2 border text-center"
                      style={{
                        borderColor: isGood ? style.border : "var(--color-border-light)",
                        backgroundColor: isGood ? style.bg : "var(--color-surface)",
                      }}
                    >
                      <span className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{row.year}년</span>
                      <span className="text-xl">{row.info?.emoji}</span>
                      <span className="text-[11px] font-semibold text-[var(--color-ink)]">{row.info?.korean}띠</span>
                      <span
                        className="text-[9px] font-semibold px-1 py-0.5 rounded-full"
                        style={{ color: style.color, backgroundColor: style.bg, border: `1px solid ${style.border}` }}
                      >
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {postnatal.year_zodiac_narrative && (
                <KkachiTip>{postnatal.year_zodiac_narrative}</KkachiTip>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
