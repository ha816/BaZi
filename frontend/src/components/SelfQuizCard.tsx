"use client";

import type { SelfQuizItem } from "@/types/analysis";
import KkachiTip from "./KkachiTip";
import SectionHeader from "./SectionHeader";

export type SelfPick = "yes" | "half" | "no" | "skip";

interface Props {
  items: SelfQuizItem[];
  name: string;
  /** 상태는 ResultSlides가 들고 있다(탭을 오가도 유지). 서버에 보내지 않는다 */
  open: boolean;
  answers: Record<number, SelfPick>;
  submitted: boolean;
  onOpen: () => void;
  onAnswer: (i: number, pick: SelfPick) => void;
  onSubmit: () => void;
  onReset: () => void;
}

const OPTIONS: { pick: SelfPick; label: string }[] = [
  { pick: "yes", label: "그렇다" },
  { pick: "half", label: "반반" },
  { pick: "no", label: "아니다" },
  { pick: "skip", label: "모르겠어요" },
];
const LABEL: Record<string, string> = { yes: "그렇다", half: "반반", no: "아니다", skip: "모르겠어요" };
const RANK: Record<string, number> = { no: 0, half: 1, yes: 2 };

// 같으면 1점, 한 칸 차이(그렇다↔반반, 반반↔아니다)면 0.5점 — 아래 문구는 사주 해석이 아니라 일치율 안내
const score = (pick: SelfPick, predict: string) => (pick === predict ? 1 : Math.abs(RANK[pick] - RANK[predict]) === 1 ? 0.5 : 0);

function verdict(rate: number) {
  if (rate >= 0.8) return { level: "높음", style: "사주형", text: "타고난 기운대로 사는 편이에요. 이 사주 풀이를 믿고 참고해도 좋아요." };
  if (rate >= 0.5) return { level: "보통", style: "반반형", text: "사주의 결을 따르면서도 자기만의 방식이 섞여 있어요. 풀이는 큰 흐름으로 참고하세요." };
  return { level: "낮음", style: "개성형", text: "사주보다 자기 방식대로 사는 편이에요. 풀이는 가볍게, 실제 내 모습을 더 믿으세요." };
}

/** 내 사주 맞춰 보기 (ROADMAP V3) — 결과를 본 뒤 고르는 선택 단계. 다 답하면 한꺼번에 사주 예측과 비교 */
export default function SelfQuizCard({ items, name, open, answers, submitted, onOpen, onAnswer, onSubmit, onReset }: Props) {
  if (items.length === 0) return null;
  const who = name ? `${name}님` : "나";
  const answered = items.filter((_, i) => answers[i]).length;
  const judged = items.map((it, i) => ({ it, pick: answers[i] })).filter((x) => x.pick && x.pick !== "skip");
  const points = judged.reduce((sum, x) => sum + score(x.pick as SelfPick, x.it.predict), 0);

  return (
    <div className="slide-card">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🔮" title="내 사주 맞춰 보기" noMargin />
        {open && !submitted && <span className="text-[10px] text-[var(--color-ink-faint)]">{answered}/{items.length} 답함</span>}
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        {!open ? (
          <>
            <KkachiTip>더 정확하게 맞춰 볼까요? {who}의 실제 모습을 10가지 질문으로 알려 주시면, 사주가 미리 예측해 둔 답과 맞춰 이 풀이를 얼마나 믿어도 되는지 알려드려요.</KkachiTip>
            <button type="button" onClick={onOpen} className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70">
              🔮 내 사주 맞춰 보기 (10문항 · 1분)
            </button>
          </>
        ) : !submitted ? (
          <>
            <KkachiTip>평소의 {who}에 가장 가까운 답을 골라 주세요. 다 고르면 사주 예측과 한꺼번에 맞춰 볼게요.</KkachiTip>
            {items.map((it, i) => (
              <div key={it.basis} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] p-3 space-y-2">
                <p className="text-sm font-semibold leading-snug text-[var(--color-ink)]">Q{i + 1}. {it.q}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {OPTIONS.map((o) => {
                    const on = answers[i] === o.pick;
                    return (
                      <button
                        key={o.pick}
                        type="button"
                        onClick={() => onAnswer(i, o.pick)}
                        className={`py-2 rounded-lg border text-xs font-semibold transition-colors ${
                          on
                            ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)]"
                            : o.pick === "skip"
                              ? "border-[var(--color-border-light)] bg-white text-[var(--color-ink-faint)]"
                              : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-gold-light)]"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onSubmit}
              disabled={answered < items.length}
              className={`w-full py-3 rounded-xl text-sm font-semibold ${
                answered === items.length ? "btn-shimmer active:opacity-70" : "border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] text-[var(--color-ink-faint)]"
              }`}
            >
              {answered === items.length ? "🔮 사주 예측과 맞춰 보기" : `${items.length - answered}개 남았어요`}
            </button>
          </>
        ) : judged.length === 0 ? (
          <>
            <KkachiTip>{"모든 질문에 \"모르겠어요\"를 고르셔서 맞춰 볼 답이 없어요. 아는 것만이라도 골라 주세요."}</KkachiTip>
            <button type="button" onClick={onReset} className="block mx-auto text-xs text-[var(--color-gold)] underline underline-offset-2">다시 답하기</button>
          </>
        ) : (
          <div className="space-y-3 score-pop">
            {(() => {
              const rate = points / judged.length;
              const v = verdict(rate);
              return (
                <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-4 text-center space-y-1">
                  <p className="text-[11px] font-semibold text-[var(--color-gold)]">{who}의 사주 일치율</p>
                  <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">{Math.round(rate * 100)}%</p>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">풀이 신뢰도 {v.level} · {v.style}</p>
                  <p className="text-sm leading-relaxed text-[var(--color-ink)] pt-1">{v.text}</p>
                  <p className="text-[10px] text-[var(--color-ink-faint)]">같은 답 1점 · 한 칸 차이(그렇다↔반반↔아니다) 0.5점 · 모르겠어요 제외 {judged.length}문항</p>
                </div>
              );
            })()}
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] pt-1">문항별로 맞춰 보기</p>
            {items.map((it, i) => {
              const pick = answers[i];
              const skip = pick === "skip";
              const pt = skip ? null : score(pick as SelfPick, it.predict);
              const tone = skip ? "border-[var(--color-border-light)] bg-[var(--color-ivory-warm)]" : pt === 1 ? "border-emerald-200 bg-emerald-50" : pt === 0.5 ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50";
              return (
                <div key={it.basis} className={`rounded-xl border p-3 space-y-1 ${tone}`}>
                  <p className="text-sm font-semibold leading-snug text-[var(--color-ink)]">Q{i + 1}. {it.q}</p>
                  <p className="text-xs">
                    <span className="text-[var(--color-ink-muted)]">내 답 </span><strong className="text-[var(--color-ink)]">{LABEL[pick]}</strong>
                    <span className="text-[var(--color-ink-muted)]"> · 사주 예측 </span><strong className="text-[var(--color-ink)]">{LABEL[it.predict]}</strong>
                    {!skip && (
                      <span className={`ml-1.5 font-bold ${pt === 1 ? "text-emerald-700" : pt === 0.5 ? "text-amber-700" : "text-rose-700"}`}>
                        {pt === 1 ? "✓ 일치" : pt === 0.5 ? "△ 비슷" : "✗ 다름"}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">사주 근거: {it.reason}</p>
                </div>
              );
            })}
            <button type="button" onClick={onReset} className="block mx-auto text-xs text-[var(--color-gold)] underline underline-offset-2">다시 답하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
