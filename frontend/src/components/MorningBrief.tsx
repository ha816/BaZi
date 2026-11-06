"use client";

import type { DailyFortune } from "@/types/analysis";

interface Props {
  /** 쓰는 건 이 네 필드뿐 — 홈 묶음 API의 fortune(description 없음)도 그대로 넘긴다 */
  data: Pick<DailyFortune, "headline" | "action" | "caution"> & { description?: string };
  /** 홈 오늘의 나·시운 지난주처럼 이름이 이미 보이거나 필요 없는 자리에서는 "OO님, " 접두를 뗀다(홈은 2026-11-06부터) */
  stripName?: string;
  /** "내일"·"모레"처럼 오늘이 아닌 날이면 문장의 첫 "오늘"을 이 라벨로 바꾼다 */
  dayLabel?: string;
  /** 작은 글씨 — 라벨 9px·문장 10px(홈 오늘의 나, 시운 지난주 — 2026-11-06 사용자 "폰트 10으로"). 아니면 11px·15px */
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

  // 항목마다 [글머리 기호 + 작은 라벨] 한 줄 → 문장 한 줄 — 한줄평·오늘 할 것·피할 것이 같은 모양으로 쌓인다(2026-11-06 사용자 "항목별로 이쁘게")
  const items = [
    { glyph: "❝", label: "한줄평", labelCls: "text-[var(--color-ink-muted)]", text: headline, textCls: "text-[var(--color-ink)]" },  // 2026-11-06 볼드 강조 뺌 — 세 문장이 같은 굵기
    action && { glyph: "✦", label: dayLabel && dayLabel !== "오늘" ? `${dayLabel} 할 것` : "오늘 할 것", labelCls: "text-[var(--color-gold)]", text: action, textCls: "text-[var(--color-ink)]" },
    caution && { glyph: "✕", label: "피할 것", labelCls: "text-rose-500", text: caution, textCls: "text-[var(--color-ink)]" },
  ].filter((it): it is { glyph: string; label: string; labelCls: string; text: string; textCls: string } => !!it);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {items.map((it) => (
        <div key={it.label} className="break-keep">
          <p className={`flex items-center gap-1 font-bold leading-none ${compact ? "text-[9px]" : "text-[11px]"} ${it.labelCls}`}>
            <span aria-hidden>{it.glyph}</span>
            {it.label}
          </p>
          <p className={`leading-relaxed mt-0.5 ${compact ? "text-[10px]" : "text-[15px]"} ${it.textCls}`}>{it.text}</p>
        </div>
      ))}
    </div>
  );
}
