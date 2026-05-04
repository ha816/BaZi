"use client";

import { useState } from "react";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function CollapsibleSectionHeader({ title, children }: Props) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(children);
  return (
    <div className="slide-card__header" style={open ? { paddingBottom: 6 } : undefined}>
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-base font-semibold text-[var(--color-ink)]">{title}</h3>
        {hasDetail && (
          <button type="button" onClick={() => setOpen(!open)}
            className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5">
            상세 설명 <span>{open ? "▲" : "▼"}</span>
          </button>
        )}
      </div>
      {open && hasDetail && (
        <div className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
