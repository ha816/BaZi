"use client";

const ELEMENTS = ["나무", "불", "흙", "쇠", "물"];

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="flex gap-4">
        {ELEMENTS.map((el, i) => (
          <span
            key={el}
            className="ink-pulse text-lg font-heading text-[var(--color-ink-muted)]"
            style={{ animationDelay: `${i * 0.3}s` }}
          >
            {el}
          </span>
        ))}
      </div>
      <div className="text-center">
        <p className="text-lg font-heading text-[var(--color-ink-light)]">
          사주를 풀어보고 있습니다
        </p>
        <p className="text-sm text-[var(--color-ink-faint)] mt-2">
          잠시만 기다려 주세요
        </p>
      </div>
    </div>
  );
}
