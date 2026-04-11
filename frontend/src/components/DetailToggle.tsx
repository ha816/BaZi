"use client";

import { useState } from "react";

export default function DetailToggle({
  children,
  label = "한자 상세 보기",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-muted)] transition-colors flex items-center gap-1.5"
      >
        <span className={`inline-block transition-transform text-[10px] ${open ? "rotate-90" : ""}`}>&#9654;</span>
        {open ? "상세 접기" : label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
