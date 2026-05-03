"use client";

import type { DaeunPeriod } from "@/types/analysis";
import { ganjiToElements, getElementInfo } from "@/lib/elementColors";

interface Props {
  daeun: DaeunPeriod[];
}

export default function DaeunTimeline({ daeun }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {daeun.map((d) => {
        const els = ganjiToElements(d.ganji);
        const stemInfo = getElementInfo(els.stem);
        const branchInfo = getElementInfo(els.branch);

        return (
          <div
            key={d.ganji}
            className={`rounded-xl px-2 py-3 text-center border transition-shadow ${
              d.is_current
                ? "border-[var(--color-gold)] bg-[var(--color-gold-faint)] shadow-md"
                : d.has_yongshin
                ? "border-[var(--color-wood)] bg-[var(--color-ivory)]"
                : "border-[var(--color-border-light)] bg-[var(--color-card)]"
            }`}
          >
            <div className="text-[10px] text-[var(--color-ink-faint)] mb-1 leading-tight">
              {d.start_age}~{d.end_age}세
            </div>
            <div className="flex justify-center gap-0.5 mb-1">
              <span className="font-heading text-base font-bold" style={{ color: stemInfo.color }}>
                {d.ganji[0]}
              </span>
              <span className="font-heading text-base font-bold" style={{ color: branchInfo.color }}>
                {d.ganji[1]}
              </span>
            </div>
            <div className="text-[9px] text-[var(--color-ink-faint)] leading-tight">
              {stemInfo.korean}·{branchInfo.korean}
            </div>
            {d.is_current && (
              <div className="text-[9px] font-semibold mt-1.5 text-[var(--color-gold)]">
                현재
              </div>
            )}
            {!d.is_current && d.has_yongshin && (
              <div className="text-[9px] font-medium mt-1.5" style={{ color: "var(--color-wood)" }}>
                좋은 기운
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
