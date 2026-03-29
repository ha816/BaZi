"use client";

import glossary from "@/lib/glossary";
import Tooltip from "./Tooltip";

interface Props {
  term: string;
  suffix?: string;
}

export default function TermBadge({ term, suffix }: Props) {
  const desc = glossary[term];

  if (!desc) {
    return (
      <span className="text-[var(--color-ink-muted)]">
        {term}
        {suffix}
      </span>
    );
  }

  return (
    <Tooltip text={desc}>
      <span className="text-[var(--color-ink-muted)]">
        {term}
        {suffix}
      </span>
    </Tooltip>
  );
}
