"use client";

import { useState } from "react";
import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";
import type { CompatTabProps } from "./types";

/** 이럴 때 두 분은? — 관계 유형별 상황 질문 6개, 카드를 누르면 답이 뒤집혀 나온다 (백엔드 character.scenarios) */
export default function ScenarioCard({ data, name1, name2 }: CompatTabProps) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = data.character?.scenarios ?? [];
  if (list.length === 0) return null;
  const who = (w: string) => (w === "p1" ? `${name1}님` : w === "p2" ? `${name2}님` : "두 분 다");
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="slide-card">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🤔" title="이럴 때 두 분은?" noMargin />
        <button type="button" onClick={() => setOpen(new Set(list.map((_, i) => i)))} className="text-[10px] text-[var(--color-ink-faint)] underline underline-offset-2">
          모두 열기
        </button>
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>두 분의 사주로 점쳐 본 상황 문답이에요. 카드를 하나씩 눌러 답을 확인해 보세요!</KkachiTip>
        <div className="grid grid-cols-2 gap-2">
          {list.map((s, i) => {
            const shown = open.has(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={`rounded-xl border p-3 text-left min-h-[7rem] flex flex-col justify-between transition-colors ${
                  shown ? "border-[var(--color-gold-light)] bg-[var(--color-gold-faint)]" : "border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] hover:bg-[var(--color-parchment)]"
                }`}
              >
                <p className="text-xs font-semibold leading-snug text-[var(--color-ink)]">Q. {s.q}</p>
                {shown ? (
                  <div className="score-pop">
                    <p className="font-heading text-base font-bold text-[var(--color-gold)]">{who(s.who)}</p>
                    <p className="text-[10px] leading-snug text-[var(--color-ink-muted)]">{s.reason}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--color-ink-faint)]">눌러서 확인 👀</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
