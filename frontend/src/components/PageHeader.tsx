import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: ReactNode;
  /** 오른쪽 액션 — 버튼·링크. 없으면 제목·설명만 */
  actions?: ReactNode;
}

/** 페이지 제목 줄 공통 포맷 — 제목 2xl · 설명 sm. 페이지 틀은 globals.css `.page` / `.page__inner` (홈·챗 제외) */
export default function PageHeader({ title, description, actions }: Props) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">{title}</h1>
        {description && <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
