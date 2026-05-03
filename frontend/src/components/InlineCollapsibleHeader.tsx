"use client";

import { useState } from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function InlineCollapsibleHeader({ title, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-2">
        <h4 className="font-heading text-base font-semibold text-[var(--color-ink)]">{title}</h4>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[10px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-0.5"
        >
          상세 설명 <span>{open ? "▲" : "▼"}</span>
        </button>
      </div>
      {open && (
        <div className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
