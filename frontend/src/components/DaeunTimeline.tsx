"use client";

import type { DaeunPeriod } from "@/types/analysis";
import { ganjiToElements, getElementInfo } from "@/lib/elementColors";

interface Props {
  daeun: DaeunPeriod[];
}

function buildDaeunNarrative(daeun: DaeunPeriod[]): string {
  const current = daeun.find((d) => d.is_current);
  const goodCount = daeun.filter((d) => d.has_yongshin).length;
  const goodPeriods = daeun.filter((d) => d.has_yongshin && !d.is_current);

  const parts: string[] = [];

  if (current) {
    parts.push(`현재 ${current.start_age}~${current.end_age}세 구간을 보내고 있어요.`);
    if (current.has_yongshin) {
      parts.push("지금 시기에 도움이 되는 기운이 있어서 좋은 흐름이에요.");
    }
  }

  parts.push(`전체 ${daeun.length}개 구간 중 ${goodCount}개에 나에게 좋은 기운이 있어요.`);

  if (goodPeriods.length > 0) {
    const nextGood = goodPeriods.find((d) => !current || d.start_age > (current?.end_age ?? 0));
    if (nextGood) {
      parts.push(`다음으로 좋은 시기는 ${nextGood.start_age}~${nextGood.end_age}세 구간이에요.`);
    }
  }

  return parts.join(" ");
}

export default function DaeunTimeline({ daeun }: Props) {
  return (
    <div>
      {/* Narrative summary */}
      <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-5">
        {buildDaeunNarrative(daeun)}
      </p>

      <div className="daeun-scroll flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
        {daeun.map((d) => {
          const els = ganjiToElements(d.ganji);
          const stemInfo = getElementInfo(els.stem);
          const branchInfo = getElementInfo(els.branch);

          return (
            <div
              key={d.ganji}
              className={`flex-shrink-0 rounded-xl px-5 py-4 text-center min-w-[100px] border transition-shadow ${
                d.is_current
                  ? "border-[var(--color-gold)] bg-[var(--color-gold-faint)] shadow-md"
                  : d.has_yongshin
                  ? "border-[var(--color-wood)] bg-[var(--color-ivory)]"
                  : "border-[var(--color-border-light)] bg-[var(--color-card)]"
              }`}
            >
              <div className="text-sm text-[var(--color-ink-faint)] mb-1">
                {d.start_age}~{d.end_age}세
              </div>
              <div className="flex justify-center gap-1 mb-1">
                <span className="font-heading text-lg font-bold" style={{ color: stemInfo.color }}>
                  {d.ganji[0]}
                </span>
                <span className="font-heading text-lg font-bold" style={{ color: branchInfo.color }}>
                  {d.ganji[1]}
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-ink-faint)]">
                {stemInfo.korean}·{branchInfo.korean}
              </div>
              {d.has_yongshin && (
                <div className="text-xs font-medium mt-2" style={{ color: "var(--color-wood)" }}>
                  나에게 좋은 기운
                </div>
              )}
              {d.is_current && (
                <div className="text-xs font-semibold mt-2 text-[var(--color-gold)]">
                  현재 시기
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[var(--color-ink-faint)] mt-3 tracking-wide">
        좌우로 스크롤하여 전체 흐름을 확인하세요. 초록 테두리 = 나에게 좋은 기운, 금색 테두리 = 현재 시기
      </p>
    </div>
  );
}
