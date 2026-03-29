"use client";

import { useState, useEffect } from "react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  forceOpen?: boolean | null;
  accentColor?: string;
  children: React.ReactNode;
}

export default function SectionAccordion({
  title,
  subtitle,
  defaultOpen = false,
  forceOpen = null,
  accentColor,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen !== null) {
      setOpen(forceOpen);
    }
  }, [forceOpen]);

  return (
    <section
      className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border-light)] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
      style={accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-7 py-5 text-left hover:bg-[var(--color-ivory-warm)] transition-colors duration-200 min-h-[60px]"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <span className="font-heading text-lg font-semibold text-[var(--color-ink)]">
            {title}
          </span>
          {subtitle && (
            <span className="block text-xs text-[var(--color-ink-faint)] mt-0.5 truncate">{subtitle}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[var(--color-ink-faint)] transition-transform duration-300 flex-shrink-0 ml-4 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`accordion-content ${open ? "open" : ""}`}>
        <div className="accordion-inner">
          <div className="divider" />
          <div className="px-7 pb-7 pt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
