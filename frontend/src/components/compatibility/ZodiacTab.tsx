"use client";

import { useState } from "react";
import type { CompatChunghap, CompatPillarZodiac, ZodiacInfo } from "@/types/analysis";
import { RELATION_STYLE } from "@/lib/relations";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import type { CompatTabProps } from "./types";

const GOOD = new Set(["삼합", "육합"]);
const P1_COLOR = "#B45309"; // 첫 번째 분 — 신살 카드의 PERSON1 계열
const P2_COLOR = "#0F766E"; // 두 번째 분 — PERSON2 계열
// "나" = 같은 띠(두 사람) / 본명년(연도 표)
const pairLabel = (r: string) => (r === "나" ? "같은 띠" : RELATION_STYLE[r]?.label ?? r);
const yearRelLabel = (r: string) => (r === "나" ? "본명년" : RELATION_STYLE[r]?.label ?? r);

function Badge({ rel, label }: { rel: string; label?: string }) {
  const s = RELATION_STYLE[rel] ?? RELATION_STYLE["보통"];
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
      {label ?? s.label}
    </span>
  );
}

function Card({ title, detail, children }: { title: string; detail?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title={title}>{detail}</CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">{children}</div>
    </div>
  );
}

/** 12띠 원 — 두 사람 자리(테두리 색)·관계선·삼합 세 번째 자리(점선)·두 분 모두와 맞는 띠(초록) */
function ChunghapCircle({ c, b1, b2 }: { c: CompatChunghap; b1: string; b2: string }) {
  const SIZE = 340, CX = SIZE / 2, CY = SIZE / 2, R = 120, NODE = 24;
  const pos = c.ring.map((r, i) => {
    const a = ((-90 + i * 30) * Math.PI) / 180;
    return { ...r, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), a };
  });
  const at = (b: string) => pos.find((p) => p.branch === b);
  const p1 = at(b1), p2 = at(b2), third = c.trio ? at(c.trio.third.branch) : undefined;
  const friends = new Set(c.friends.map((f) => f.branch));
  const relStyle = RELATION_STYLE[c.relation] ?? RELATION_STYLE["보통"];
  return (
    <svg viewBox={`-36 0 ${SIZE + 72} ${SIZE}`} className="w-full max-w-[380px] mx-auto block">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-border-light)" strokeDasharray="3 3" />
      {third && p1 && p2 && [p1, p2].map((p, i) => (
        <line key={`t${i}`} x1={p.x} y1={p.y} x2={third.x} y2={third.y} stroke={relStyle.color} strokeWidth={2} strokeDasharray="5 4" opacity={0.6} />
      ))}
      {p1 && p2 && c.relation !== "나" && (
        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={relStyle.color} strokeWidth={3.5} strokeLinecap="round"
          strokeDasharray={c.relation === "충" ? "10 3" : c.relation === "원진" ? "6 4" : undefined} opacity={0.9} />
      )}
      {pos.map((p) => {
        const is1 = p.branch === b1, is2 = p.branch === b2, isThird = p.branch === c.trio?.third.branch;
        const friend = friends.has(p.branch);
        const fill = is1 || is2 ? "#FFFFFF" : friend ? RELATION_STYLE["삼합"].bg : "var(--color-ivory)";
        const stroke = is1 && is2 ? P1_COLOR : is1 ? P1_COLOR : is2 ? P2_COLOR : isThird ? relStyle.color : friend ? RELATION_STYLE["삼합"].border : "var(--color-border-light)";
        const lx = CX + (R + NODE + 12) * Math.cos(p.a), ly = CY + (R + NODE + 12) * Math.sin(p.a);
        const cos = Math.cos(p.a);
        return (
          <g key={p.branch} opacity={is1 || is2 || isThird || friend ? 1 : 0.45}>
            <circle cx={p.x} cy={p.y} r={NODE} fill={fill} stroke={stroke} strokeWidth={is1 || is2 ? 3 : 1.2} strokeDasharray={isThird ? "4 3" : undefined} />
            {is1 && is2 && <circle cx={p.x} cy={p.y} r={NODE + 4} fill="none" stroke={P2_COLOR} strokeWidth={2} />}
            <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize="22">{p.emoji}</text>
            <text x={lx} y={ly} textAnchor={cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle"} dominantBaseline="middle"
              fontSize="11" fontWeight={is1 || is2 ? 700 : 500} fill={is1 ? P1_COLOR : is2 ? P2_COLOR : "var(--color-ink-muted)"}>
              {p.korean}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PillarZodiac({ pz, name1, name2 }: { pz: CompatPillarZodiac; name1: string; name2: string }) {
  const cols = [...pz.columns].reverse(); // 시·일·월·년 — 분석 사주지지 표와 같은 순서
  const cell = (m: { emoji: string; korean: string; branch: string } | null) =>
    m ? (
      <div className="flex flex-col items-center leading-tight">
        <span className="text-lg">{m.emoji}</span>
        <span className="text-[10px] text-[var(--color-ink-muted)]">{m.korean}띠</span>
      </div>
    ) : <span className="text-xs text-[var(--color-ink-faint)]">?</span>;
  return (
    <>
      <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
        <table className="w-full text-center border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup><col style={{ width: "52px" }} /><col /><col /><col /><col /></colgroup>
          <thead>
            <tr style={{ backgroundColor: "var(--color-ivory)" }}>
              <th />
              {cols.map((c) => <th key={c.label} className="text-[10px] font-semibold text-[var(--color-ink-muted)] py-1.5 px-1">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--color-border-light)]">
              <td className="text-[10px] font-semibold py-1.5 px-1 text-left truncate" style={{ color: P1_COLOR }}>{name1}</td>
              {cols.map((c, i) => <td key={i} className="py-1.5 px-1">{cell(c.p1)}</td>)}
            </tr>
            <tr className="border-t border-[var(--color-border-light)]">
              <td className="text-[10px] font-semibold py-1.5 px-1 text-left truncate" style={{ color: P2_COLOR }}>{name2}</td>
              {cols.map((c, i) => <td key={i} className="py-1.5 px-1">{cell(c.p2)}</td>)}
            </tr>
            <tr className="border-t border-[var(--color-border-light)]">
              <td className="text-[9px] py-1.5 px-1 text-left text-[var(--color-ink-faint)]">같은 자리</td>
              {cols.map((c, i) => <td key={i} className="py-1.5 px-1">{c.relation ? <Badge rel={c.relation} label={pairLabel(c.relation)} /> : <span className="text-[var(--color-ink-faint)]">—</span>}</td>)}
            </tr>
            <tr className="border-t border-[var(--color-border-light)]">
              <td className="text-[9px] py-1.5 px-1 text-left text-[var(--color-ink-faint)]">역할(役割)</td>
              {cols.map((c, i) => <td key={i} className="py-1.5 px-1 text-[10px] text-[var(--color-ink-faint)] leading-snug">{c.role}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {pz.cross.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[var(--color-ink-muted)]">다른 자리끼리 맺는 띠 관계</p>
          {pz.cross.map((x, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="flex-1 text-right truncate" style={{ color: P1_COLOR }}>{name1} {x.p1_pillar} {x.p1.emoji}{x.p1.korean}</span>
              <Badge rel={x.relation} label={pairLabel(x.relation)} />
              <span className="flex-1 truncate" style={{ color: P2_COLOR }}>{x.p2.emoji}{x.p2.korean} {x.p2_pillar} {name2}</span>
            </div>
          ))}
        </div>
      )}
      <KkachiTip>{pz.tip}</KkachiTip>
    </>
  );
}

/** 띠궁합 — 띠(간단) · 사주지지(네 기둥 띠 비교) · 십이지 충합(두 띠 관계 원·풀이) · 연도별 띠 궁합. 분석 십이지신 탭과 같은 순서 */
export default function ZodiacTab({ data, name1, name2 }: CompatTabProps) {
  const [showYears, setShowYears] = useState(false);
  const z = data.zodiac;
  const fill = (s: string) => s.replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);

  if (!z) {
    return (
      <Card title="띠궁합(十二支)">
        <KkachiTip>이 결과에는 두 분의 띠 정보가 없어요. 다시 입력해 궁합을 새로 보면 띠궁합이 나와요.</KkachiTip>
      </Card>
    );
  }
  const people: { name: string; info: ZodiacInfo; color: string }[] = [
    { name: name1, info: z.p1, color: P1_COLOR },
    { name: name2, info: z.p2, color: P2_COLOR },
  ];
  const c = z.chunghap;

  return (
    <div className="space-y-4">
      <Card title="띠궁합(十二支)" detail={<p>태어난 해의 지지(년지)가 띠예요. 띠는 사주 여덟 글자 중 한 글자라 참고 지표로 즐겨 주세요.</p>}>
        <div className="flex items-center justify-center gap-4">
          {people.map((p, i) => (
            <div key={i} className="flex items-center gap-4">
              {i === 1 && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg text-[var(--color-gold-light)]">♥</span>
                  <Badge rel={z.relation} label={z.relation_label} />
                </div>
              )}
              <div className="text-center">
                <p className="text-[11px] font-semibold truncate max-w-[6rem]" style={{ color: p.color }}>{p.name}님</p>
                <p className="text-4xl leading-tight">{p.info.emoji}</p>
                <p className="font-heading text-sm font-bold text-[var(--color-ink)]">{p.info.korean}띠</p>
                <p className="text-[10px] text-[var(--color-gold)]">{p.info.keyword}</p>
              </div>
            </div>
          ))}
        </div>
        <KkachiTip>{fill(data.summary?.zodiac || z.headline)}</KkachiTip>
      </Card>

      {/* 십이지 충합을 띠궁합 바로 다음에 — 사주지지는 그 뒤(2026-10-18, 사용자 지시) */}
      {c && (
        <Card
          title="십이지 충합(十二支 衝合)"
          detail={<p>12띠를 원에 놓으면 띠끼리의 관계가 보여요. <strong>삼합</strong>은 120°씩 떨어진 세 띠가 모여 한 오행을 이루는 최고 궁합, <strong>육합</strong>은 둘이 묶여 새 오행이 되는 조화, <strong>충</strong>은 정반대(180°) 자리의 대립, <strong>원진</strong>은 서로 꺼리는 긴장이에요.</p>}
        >
          <KkachiTip>두 분의 띠를 12띠 원 위에 올려 봤어요. 테두리 색이 각자의 자리, 선이 두 띠의 관계예요.</KkachiTip>
          <ChunghapCircle c={c} b1={z.p1.branch} b2={z.p2.branch} />
          <div className="flex justify-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: P1_COLOR }} />{name1}님</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: P2_COLOR }} />{name2}님</span>
            {c.friends.length > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: RELATION_STYLE["삼합"].bg, border: `1px solid ${RELATION_STYLE["삼합"].border}` }} />두 분 모두와 합</span>}
          </div>
          <div className="rounded-xl border px-4 py-3 space-y-1.5" style={{ borderColor: (RELATION_STYLE[c.relation] ?? RELATION_STYLE["보통"]).border, background: (RELATION_STYLE[c.relation] ?? RELATION_STYLE["보통"]).bg }}>
            <p className="text-sm font-semibold" style={{ color: (RELATION_STYLE[c.relation] ?? RELATION_STYLE["보통"]).color }}>{c.title}</p>
            <p className="text-xs leading-relaxed text-[var(--color-ink)]">{c.explain}</p>
          </div>
          {c.friends.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-[var(--color-ink-muted)]">두 분 모두와 잘 맞는 띠</span>
              {c.friends.map((f) => (
                <span key={f.branch} className="px-2 py-0.5 rounded-full border font-semibold" style={{ color: RELATION_STYLE["삼합"].color, background: RELATION_STYLE["삼합"].bg, borderColor: RELATION_STYLE["삼합"].border }}>
                  {f.emoji} {f.korean}띠
                </span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {people.map((p, i) => (
              <KkachiTip key={i} label={`${p.name}님 · ${p.info.korean}띠`}>{p.info.strength}</KkachiTip>
            ))}
          </div>
        </Card>
      )}

      {z.pillars && (
        <Card title="사주지지(四柱地支)" detail={<p>사주의 네 기둥에는 지지(地支), 즉 띠가 하나씩 들어 있어요. 년주만이 아니라 네 개의 띠가 삶의 각 영역에 숨어 있어서, 두 분의 띠를 자리마다 맞대 보면 어느 영역에서 잘 맞고 어디서 부딪히는지 보여요.</p>}>
          <KkachiTip>두 분의 네 기둥 띠를 같은 자리끼리 나란히 놓고, 다른 자리끼리 맺는 관계도 찾아봤어요.</KkachiTip>
          <PillarZodiac pz={z.pillars} name1={name1} name2={name2} />
        </Card>
      )}

      <Card
        title="연도별 띠 궁합"
        detail={<p>앞으로 4년, 그해의 띠가 두 분 각자의 띠와 어떤 관계인지 봐요. 둘 다 삼합·육합인 해는 함께 일을 벌이기 좋고, 충이 드는 해는 변화가 많아요. 본명년(本命年)은 내 띠와 같은 해예요.</p>}
      >
        <KkachiTip>앞으로 들어오는 해의 띠 기운이 두 분에게 각각 어떤 결인지 미리 보면, 함께할 큰 결정의 타이밍을 잡기 좋아요.</KkachiTip>
        {!showYears ? (
          <button
            type="button"
            onClick={() => setShowYears(true)}
            className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
          >
            🐾 연도별 띠 궁합 확인하기
          </button>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {z.years.map((r) => {
                const both = GOOD.has(r.rel1) && GOOD.has(r.rel2);
                const s = RELATION_STYLE["삼합"];
                return (
                  <div
                    key={r.year}
                    className="flex flex-col items-center gap-1 rounded-xl p-2 border text-center"
                    style={{ borderColor: both ? s.border : "var(--color-border-light)", backgroundColor: both ? s.bg : "var(--color-card)" }}
                  >
                    <span className="text-[10px] font-semibold text-[var(--color-ink-faint)]">{r.year}년</span>
                    <span className="text-xl">{r.emoji}</span>
                    <span className="text-[11px] font-semibold text-[var(--color-ink)]">{r.kor}띠</span>
                    {[{ n: name1, rel: r.rel1 }, { n: name2, rel: r.rel2 }].map(({ n, rel }, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-[var(--color-ink-faint)] truncate max-w-full">{n}</span>
                        <Badge rel={rel} label={yearRelLabel(rel)} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <KkachiTip>{fill(z.years_line)}</KkachiTip>
          </>
        )}
      </Card>
    </div>
  );
}
