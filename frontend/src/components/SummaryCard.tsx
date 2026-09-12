"use client";

import { useEffect } from "react";
import type { Summary } from "@/types/analysis";
import SectionHeader from "@/components/SectionHeader";
import KkachiTip from "@/components/KkachiTip";
import { track } from "@/lib/track";

const ROWS: { key: keyof Summary; label: string; emoji: string; tone?: "caution" }[] = [
  { key: "year", label: "올해", emoji: "📅" },
  { key: "month", label: "이번 달", emoji: "🌙" },
  { key: "today", label: "오늘", emoji: "☀️" },
  { key: "caution", label: "조심", emoji: "⚠️", tone: "caution" },
];

/** 결과 첫 화면 "까치 한눈에" — 나·올해·이번 달·오늘·조심 다섯 줄. 6개 탭은 이 아래 "더 알아보기". */
export default function SummaryCard({ summary, hasProfile }: { summary: Summary; hasProfile: boolean }) {
  useEffect(() => {
    track("summary_view", { has_profile: hasProfile });
  }, [hasProfile]);

  const rows = ROWS.filter((r) => summary[r.key]);

  return (
    <div className="slide-card">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🐦" title="까치 한눈에" noMargin />
        <span className="text-[10px] text-[var(--color-ink-faint)]">아래 탭에서 자세히</span>
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>{summary.me}</KkachiTip>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-start gap-2.5 text-sm leading-snug">
              <span className="flex-shrink-0 w-[4.5rem] flex items-center gap-1 text-[11px] font-semibold text-[var(--color-ink-faint)] pt-0.5">
                <span aria-hidden>{r.emoji}</span>
                {r.label}
              </span>
              <p className={r.tone === "caution" ? "text-[var(--color-ink-light)]" : "text-[var(--color-ink)]"}>
                {summary[r.key]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
