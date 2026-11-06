"use client";

import type { DailyFortune } from "@/types/analysis";

interface Props {
  /** 쓰는 건 이 네 필드뿐 — 홈 묶음 API의 fortune(description 없음)도 그대로 넘긴다 */
  data: Pick<DailyFortune, "headline" | "action" | "caution"> & { description?: string };
  /** 홈 오늘의 나·시운 지난주처럼 이름이 이미 보이거나 필요 없는 자리에서는 "OO님, " 접두를 뗀다(홈은 2026-11-06부터) */
  stripName?: string;
  /** "내일"·"모레"처럼 오늘이 아닌 날이면 문장의 첫 "오늘"을 이 라벨로 바꾼다 */
  dayLabel?: string;
  /** 작은 글씨 — 헤드라인 14px·줄 13px(홈 오늘의 나, 시운 지난주) */
  compact?: boolean;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function adapt(text: string, dayLabel?: string): string {
  if (!dayLabel || dayLabel === "오늘") return text;
  return text.replace(/오늘은?/, (m) => (m.endsWith("은") ? `${dayLabel}은` : dayLabel));
}

export default function MorningBrief({ data, stripName, dayLabel, compact }: Props) {
  // 옛 캐시(headline 없음)는 description으로 폴백
  let headline = data.headline || data.description || "";
  if (stripName) headline = headline.replace(new RegExp(`^${escapeRegExp(stripName)}님,\\s*`), "");
  headline = adapt(headline, dayLabel);
  const action = data.action ? adapt(data.action, dayLabel) : "";
  const caution = data.caution ? adapt(data.caution, dayLabel) : "";

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <p className={`font-heading font-semibold text-[var(--color-ink)] leading-snug ${compact ? "text-[14px]" : "text-base"}`}>
        {headline}
      </p>
      {action && (
        <div className={`flex gap-2 leading-snug ${compact ? "text-[13px]" : "text-sm"}`}>
          <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
          <p className="text-[var(--color-ink-light)]">
            <span className="text-[10px] font-semibold text-[var(--color-ink-faint)] mr-1.5 align-middle">{dayLabel && dayLabel !== "오늘" ? `${dayLabel} 할 것` : "오늘 할 것"}</span>
            {action}
          </p>
        </div>
      )}
      {caution && (
        <div className={`flex gap-2 leading-snug ${compact ? "text-[13px]" : "text-sm"}`}>
          <span className="text-rose-500 flex-shrink-0">✕</span>
          <p className="text-[var(--color-ink-light)]">
            <span className="text-[10px] font-semibold text-[var(--color-ink-faint)] mr-1.5 align-middle">피할 것</span>
            {caution}
          </p>
        </div>
      )}
    </div>
  );
}
