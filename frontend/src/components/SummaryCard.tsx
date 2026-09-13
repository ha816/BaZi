"use client";

import { useEffect, type ReactNode } from "react";
import type { Summary } from "@/types/analysis";
import SectionHeader from "@/components/SectionHeader";
import { track } from "@/lib/track";

interface Props {
  summary: Summary;
  hasProfile: boolean;
  onNavigate?: (tab: string) => void;
}

// 카테고리 박스 — 헤더(누르면 해당 탭) + 내용. tab은 ResultSlides FEATURE_TABS의 id.
function GroupBox({ emoji, label, tab, onNavigate, children }: {
  emoji: string; label: string; tab: string; onNavigate?: (tab: string) => void; children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] overflow-hidden">
      <button
        type="button"
        onClick={() => onNavigate?.(tab)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--color-ivory-warm)] text-left transition-colors hover:bg-[var(--color-parchment)]"
      >
        <span aria-hidden>{emoji}</span>
        <span className="text-xs font-semibold text-[var(--color-ink)]">{label}</span>
        <span className="ml-auto text-[var(--color-ink-faint)]" aria-hidden>›</span>
      </button>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

/** "한눈에" — 나(정체성) + 용신삼재·시운·십이지신·풍수를 카테고리 박스로. 헤더를 누르면 그 탭으로 진입. */
export default function SummaryCard({ summary, hasProfile, onNavigate }: Props) {
  useEffect(() => {
    track("summary_view", { has_profile: hasProfile });
  }, [hasProfile]);

  // 시운(時運) 하위 — 올해(세운)·이번 달(월운)·오늘(일운)·조심
  const siun: { label: string; text: string; tone?: "caution" }[] = [
    { label: "올해", text: summary.year },
    { label: "이번 달", text: summary.month },
    { label: "오늘", text: summary.today },
    { label: "조심", text: summary.caution, tone: "caution" as const },
  ].filter((r) => r.text);

  return (
    <div className="slide-card">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🐦" title="한눈에" noMargin />
        <span className="text-[10px] text-[var(--color-ink-faint)]">카테고리를 누르면 자세히</span>
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        {summary.me && (
          <GroupBox emoji="🌱" label="만세력(萬歲曆)" tab="natal" onNavigate={onNavigate}>
            <p className="text-sm leading-snug text-[var(--color-ink)]">{summary.me}</p>
          </GroupBox>
        )}

        {summary.energy && (
          <GroupBox emoji="⭐" label="신살·운성" tab="energy" onNavigate={onNavigate}>
            <p className="text-sm leading-snug text-[var(--color-ink)]">{summary.energy}</p>
          </GroupBox>
        )}

        {summary.yongshin && (
          <GroupBox emoji="🔮" label="용신·삼재" tab="yongshin" onNavigate={onNavigate}>
            <p className="text-sm leading-snug text-[var(--color-ink)]">{summary.yongshin}</p>
          </GroupBox>
        )}

        {summary.timing && (
          <GroupBox emoji="🗓️" label="택시(擇時)" tab="timing" onNavigate={onNavigate}>
            <p className="text-sm leading-snug text-[var(--color-ink)]">{summary.timing}</p>
          </GroupBox>
        )}

        {siun.length > 0 && (
          <GroupBox emoji="🌊" label="시운(時運)" tab="daeun" onNavigate={onNavigate}>
            <ul className="space-y-1.5">
              {siun.map((r) => (
                <li key={r.label} className="flex items-start gap-2 text-sm leading-snug">
                  <span className="flex-shrink-0 w-12 text-[11px] font-semibold text-[var(--color-ink-faint)] pt-0.5">{r.label}</span>
                  <span className={`flex-1 ${r.tone === "caution" ? "text-[var(--color-ink-light)]" : "text-[var(--color-ink)]"}`}>{r.text}</span>
                </li>
              ))}
            </ul>
          </GroupBox>
        )}

        {summary.zodiac && (
          <GroupBox emoji="🐾" label="십이지신" tab="zodiac" onNavigate={onNavigate}>
            <p className="text-sm leading-snug text-[var(--color-ink)]">{summary.zodiac}</p>
          </GroupBox>
        )}

        {summary.fengshui && (
          <GroupBox emoji="🧭" label="풍수" tab="fengshui" onNavigate={onNavigate}>
            <p className="text-sm leading-snug text-[var(--color-ink)]">{summary.fengshui}</p>
          </GroupBox>
        )}
      </div>
    </div>
  );
}
