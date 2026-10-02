"use client";

import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";
import type { CompatTabProps } from "./types";

export type QuizPick = "p1" | "p2" | "both" | "skip";

interface Props extends CompatTabProps {
  /** 질문 번호 → 사용자가 고른 답 (오케스트레이터가 결과 단위로 들고 있어 탭을 오가도 유지). 서버에 보내지 않는다 */
  answers: Record<number, QuizPick>;
  onAnswer: (i: number, pick: QuizPick) => void;
}

// 적중률 문구 — 사주 해석이 아니라 퀴즈 결과 안내
function verdict(hit: number, total: number): string {
  const rate = hit / total;
  if (rate >= 0.8) return "소름! 사주가 두 분을 꿰뚫고 있네요.";
  if (rate >= 0.5) return "꽤 잘 맞아요. 사주가 두 분의 결을 제법 알고 있어요.";
  return "사주와 다른 면이 많은 두 분 — 사주보다 서로를 더 잘 아는 사이예요.";
}

/** 이럴 때 두 분은? — 사용자가 먼저 답을 고르면 사주 예측이 열리고 맞았는지 보여준다. 다 고르면 적중률 */
export default function ScenarioCard({ data, name1, name2, answers, onAnswer }: Props) {
  const list = data.character?.scenarios ?? [];
  if (list.length === 0) return null;
  const who = (w: string) => (w === "p1" ? `${name1}님` : w === "p2" ? `${name2}님` : "두 분 다");
  const answered = list.filter((_, i) => answers[i]).length;
  const judged = list.map((s, i) => ({ s, pick: answers[i] })).filter((x) => x.pick && x.pick !== "skip");
  const hit = judged.filter((x) => x.pick === x.s.who).length;
  const done = answered === list.length;
  const options: { pick: QuizPick; label: string }[] = [
    { pick: "p1", label: `${name1}님` },
    { pick: "p2", label: `${name2}님` },
    { pick: "both", label: "둘 다" },
  ];

  return (
    <div className="slide-card">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🤔" title="이럴 때 두 분은?" noMargin />
        <span className="text-[10px] text-[var(--color-ink-faint)]">{answered}/{list.length} 답함</span>
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        <KkachiTip>실제 두 분은 어떤가요? 먼저 골라 주시면 사주가 예측한 답과 맞춰 볼게요. 많이 맞을수록 이 궁합 풀이를 믿어도 좋아요!</KkachiTip>

        {list.map((s, i) => {
          const pick = answers[i];
          const correct = pick && pick !== "skip" && pick === s.who;
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 space-y-2 ${
                !pick ? "border-[var(--color-border-light)] bg-[var(--color-ivory-warm)]"
                  : correct ? "border-emerald-200 bg-emerald-50"
                  : pick === "skip" ? "border-[var(--color-gold-light)] bg-[var(--color-gold-faint)]"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <p className="text-sm font-semibold leading-snug text-[var(--color-ink)]">Q{i + 1}. {s.q}</p>
              {!pick ? (
                <>
                  <div className="grid grid-cols-3 gap-1.5">
                    {options.map((o) => (
                      <button
                        key={o.pick}
                        type="button"
                        onClick={() => onAnswer(i, o.pick)}
                        className="py-2 rounded-lg border border-[var(--color-border)] bg-white text-xs font-semibold text-[var(--color-ink)] hover:border-[var(--color-gold-light)] transition-colors truncate px-1"
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => onAnswer(i, "skip")} className="text-[10px] text-[var(--color-ink-faint)] underline underline-offset-2">
                    잘 모르겠어요 — 사주 답만 보기
                  </button>
                </>
              ) : (
                <div className="score-pop space-y-0.5">
                  <p className="text-xs">
                    {pick !== "skip" && <span className="text-[var(--color-ink-muted)]">내 답 {who(pick)} · </span>}
                    <span className="text-[var(--color-ink-muted)]">사주 예측 </span>
                    <strong className="text-[var(--color-ink)]">{who(s.who)}</strong>
                    {pick !== "skip" && (
                      <span className={`ml-1.5 font-bold ${correct ? "text-emerald-700" : "text-rose-700"}`}>{correct ? "✓ 맞았어요!" : "✗ 달라요"}</span>
                    )}
                  </p>
                  <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">{s.reason}</p>
                </div>
              )}
            </div>
          );
        })}

        {done && judged.length > 0 && (
          <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-4 text-center space-y-1 score-pop">
            <p className="text-[11px] font-semibold text-[var(--color-gold)]">사주 예측 적중률</p>
            <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">
              {judged.length}개 중 {hit}개 <span className="text-lg">({Math.round((hit / judged.length) * 100)}%)</span>
            </p>
            <p className="text-sm text-[var(--color-ink)]">{verdict(hit, judged.length)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
