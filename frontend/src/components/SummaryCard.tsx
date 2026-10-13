"use client";

import type { ReactNode } from "react";

// 카테고리 박스 — 헤더(누르면 해당 탭) + 내용. tab은 궁합 COMPAT_TABS 탭 id.
// 분석 결과의 "한눈에" SummaryCard는 2026-10-13 화면에서 뺐고 이 박스만 궁합 한눈에(SummaryTab)가 쓴다. postnatal.summary API는 LLM 기본 요약용으로 유지
export function GroupBox({ emoji, label, tab, onNavigate, children }: {
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
