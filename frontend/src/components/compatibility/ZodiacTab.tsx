"use client";

import { useState } from "react";
import type { ZodiacInfo } from "@/types/analysis";
import { RELATION_STYLE } from "@/lib/relations";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import type { CompatTabProps } from "./types";

const GOOD = new Set(["삼합", "육합"]);
// 연도 표에서 "나"는 본명년(本命年) — 내 띠와 같은 해
const yearRelLabel = (r: string) => (r === "나" ? "본명년" : RELATION_STYLE[r]?.label ?? r);

function Badge({ rel, label }: { rel: string; label?: string }) {
  const s = RELATION_STYLE[rel] ?? RELATION_STYLE["보통"];
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
      {label ?? s.label}
    </span>
  );
}

function ZodiacCard({ name, z }: { name: string; z: ZodiacInfo }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] p-3 text-center space-y-1.5">
      <p className="text-[11px] font-semibold text-[var(--color-ink-muted)] truncate">{name}님</p>
      <p className="text-4xl leading-none">{z.emoji}</p>
      <p className="font-heading text-base font-bold text-[var(--color-ink)]">{z.korean}띠 <span className="text-xs font-normal text-[var(--color-ink-faint)]">({z.branch})</span></p>
      <p className="text-[11px] font-semibold text-[var(--color-gold)]">{z.keyword}</p>
      <div className="flex flex-wrap justify-center gap-1">
        {z.traits.slice(0, 3).map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] bg-white text-[var(--color-ink-muted)]">{t}</span>
        ))}
      </div>
    </div>
  );
}

/** 띠궁합 — 두 사람 띠 카드·띠끼리 충합(분석 십이지신 탭과 같은 분류) + 연도별 띠 궁합(각자 그해 띠와의 관계) */
export default function ZodiacTab({ data, name1, name2 }: CompatTabProps) {
  const [showYears, setShowYears] = useState(false);
  const z = data.zodiac;
  const fill = (s: string) => s.replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);

  if (!z) {
    return (
      <div className="slide-card">
        <CollapsibleSectionHeader title="띠궁합(十二支)" />
        <div className="divider" />
        <div className="slide-card__body">
          <KkachiTip>이 결과에는 두 분의 띠 정보가 없어요. 다시 입력해 궁합을 새로 보면 띠궁합이 나와요.</KkachiTip>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <CollapsibleSectionHeader title="띠궁합(十二支)">
          <p>태어난 해의 지지(년지)가 띠예요. 두 띠가 <strong>삼합·육합</strong>이면 시너지, <strong>충·원진</strong>이면 마찰로 봐요. 띠는 사주 여덟 글자 중 한 글자라, 실제 궁합은 일주·오행까지 함께 봐야 해요 — 참고 지표로 즐겨 주세요.</p>
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>띠끼리도 결이 맞는 짝과 부딪히는 짝이 있어요. 두 분의 띠를 나란히 놓고 볼게요.</KkachiTip>
          <div className="flex items-stretch gap-2">
            <ZodiacCard name={name1} z={z.p1} />
            <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
              <span className="text-lg text-[var(--color-gold-light)]">♥</span>
              <Badge rel={z.relation} label={z.relation_label} />
            </div>
            <ZodiacCard name={name2} z={z.p2} />
          </div>
          <div className="rounded-xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)]">
            {fill(z.headline)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[{ name: name1, info: z.p1 }, { name: name2, info: z.p2 }].map(({ name, info }, i) => (
              <KkachiTip key={i} label={`${name}님 · ${info.korean}띠`}>{info.strength}</KkachiTip>
            ))}
          </div>
        </div>
      </div>

      <div className="slide-card">
        <CollapsibleSectionHeader title="연도별 띠 궁합">
          <p>앞으로 4년, 그해의 띠가 두 분 각자의 띠와 어떤 관계인지 봐요. 둘 다 삼합·육합인 해는 함께 일을 벌이기 좋고, 충이 드는 해는 변화가 많아요. 본명년(本命年)은 내 띠와 같은 해예요.</p>
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
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
        </div>
      </div>
    </div>
  );
}
