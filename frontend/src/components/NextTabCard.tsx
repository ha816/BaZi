"use client";

export interface NextTab<Id extends string = string> {
  id: Id;
  emoji: string;
  label: string;
  /** 다음 탭으로 부르는 흥미 유발 제목 — 내용 미리보기는 넣지 않는다 */
  hook: string;
}

/** 탭 맨 아래 "다음 이야기" — 다 읽은 뒤 엄지 닿는 자리에서 다음 탭으로 이어 준다(분석 ResultSlides · 궁합 CompatibilityResult 공용).
 *  마지막 탭은 첫 탭으로 */
export default function NextTabCard<Id extends string>({ tabs, active, onGo }: { tabs: readonly NextTab<Id>[]; active: Id; onGo: (id: Id) => void }) {
  const i = tabs.findIndex((t) => t.id === active);
  const next = tabs[(i + 1) % tabs.length];
  const isLoop = i === tabs.length - 1;
  return (
    <button
      type="button"
      onClick={() => onGo(next.id)}
      className="mt-6 w-full min-h-14 rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-3.5 text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <span className="text-3xl flex-shrink-0" aria-hidden>{next.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-gold)]">
          {isLoop ? "다 둘러봤어요 🎉" : "다음 이야기"}
          {!isLoop && <span className="font-normal text-[var(--color-ink-faint)]">{i + 2}/{tabs.length} · {next.label}</span>}
        </span>
        <span className="block font-heading text-base font-bold leading-snug text-[var(--color-ink)] break-keep">{isLoop ? `처음으로 돌아가 ${next.label}부터 다시 보기` : next.hook}</span>
      </span>
      <span className="flex-shrink-0 text-xl text-[var(--color-gold)]" aria-hidden>›</span>
    </button>
  );
}
