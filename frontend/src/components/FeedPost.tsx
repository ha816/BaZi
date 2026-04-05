"use client";

import type { ReactNode } from "react";

interface FeedPostProps {
  name: string;
  handle?: string;
  avatarChar: string;
  avatarClass?: string;
  children: ReactNode;
  caption?: ReactNode;
  actions?: ReactNode;
}

export default function FeedPost({
  name,
  handle,
  avatarChar,
  avatarClass = "bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-fire)]",
  children,
  caption,
  actions,
}: FeedPostProps) {
  return (
    <article className="border-b border-[var(--color-border-light)]">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarClass}`}>
          {avatarChar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-ink)] leading-none">{name}</p>
          {handle && <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">{handle}</p>}
        </div>
      </div>

      {/* 컨텐츠 */}
      {children}

      {/* 캡션 + 액션 */}
      {(caption || actions) && (
        <div className="px-4 pt-2.5 pb-4 space-y-2.5">
          {caption && <div className="text-sm text-[var(--color-ink)] leading-relaxed">{caption}</div>}
          {actions && <div>{actions}</div>}
        </div>
      )}
    </article>
  );
}
