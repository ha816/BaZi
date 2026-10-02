"use client";

import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";
import type { CompatTabProps } from "./types";

export type QuizPick = "p1" | "p2" | "both" | "skip";

interface Props extends CompatTabProps {
  /** 질문 번호 → 사용자가 고른 답 (오케스트레이터가 결과 단위로 들고 있음). 서버에 보내지 않는다 */
  answers: Record<number, QuizPick>;
  onAnswer: (i: number, pick: QuizPick) => void;
  /** 다 고르고 "사주와 맞춰 보기"를 눌렀는지 — 누르기 전엔 사주 예측을 숨긴다 */
  submitted: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

type Scenario = { q: string; who: "p1" | "p2" | "both"; reason: string };

// 아래 문구는 사주 해석이 아니라 "사용자 답 ↔ 사주 예측" 일치율 안내
function reliability(rate: number): { level: string; text: string } {
  if (rate >= 0.8) return { level: "높음", text: "두 분의 실제 모습이 사주 예측과 거의 같아요. 이 궁합 풀이를 믿고 참고해도 좋아요." };
  if (rate >= 0.5) return { level: "보통", text: "절반 이상 맞았어요. 풀이는 큰 흐름으로 참고하고, 세부는 두 분의 실제 모습을 믿으세요." };
  return { level: "낮음", text: "실제 두 분은 사주 예측과 다른 면이 많아요. 사주보다 서로가 서로를 더 잘 아는 사이예요." };
}

function style(rate: number | null): { label: string; text: string } {
  if (rate == null) return { label: "판정 보류", text: "관련된 질문이 적어서 아직 판단하기 어려워요." };
  if (rate >= 0.7) return { label: "사주형", text: "타고난 기운대로 움직이는 편이에요. 사주 풀이가 잘 들어맞는 스타일이에요." };
  if (rate >= 0.4) return { label: "반반형", text: "사주의 결을 따르면서도 자기만의 방식이 섞여 있어요." };
  return { label: "개성형", text: "사주보다 자기 방식대로 사는 편이에요. 풀이는 가볍게 참고만 하세요." };
}

/** 한 사람이 걸린 문항(사주 예측이나 사용자 답에 그 사람이 들어간 문항)만으로 일치율 */
function personRate(list: Scenario[], answers: Record<number, QuizPick>, who: "p1" | "p2"): { rate: number | null; n: number } {
  const rel = list
    .map((s, i) => ({ s, pick: answers[i] }))
    .filter(({ s, pick }) => pick && pick !== "skip" && ([s.who, pick].includes(who) || [s.who, pick].includes("both")));
  if (rel.length < 2) return { rate: null, n: rel.length };
  return { rate: rel.filter(({ s, pick }) => s.who === pick).length / rel.length, n: rel.length };
}

/** 이럴 때 두 분은? — 사용자가 먼저 전부 답하고, 한꺼번에 사주 예측과 맞춰 신뢰도·사람별 사주 스타일을 보여준다 */
export default function ScenarioCard({ data, name1, name2, answers, onAnswer, submitted, onSubmit, onReset }: Props) {
  const list = (data.character?.scenarios ?? []) as Scenario[];
  if (list.length === 0) return null;
  const who = (w: string) => (w === "p1" ? `${name1}님` : w === "p2" ? `${name2}님` : "두 분 다");
  const answered = list.filter((_, i) => answers[i]).length;
  const allAnswered = answered === list.length;
  const judged = list.map((s, i) => ({ s, pick: answers[i] })).filter((x) => x.pick && x.pick !== "skip");
  const hit = judged.filter((x) => x.pick === x.s.who).length;
  const options: { pick: QuizPick; label: string }[] = [
    { pick: "p1", label: `${name1}님` },
    { pick: "p2", label: `${name2}님` },
    { pick: "both", label: "둘 다" },
    { pick: "skip", label: "모르겠어요" },
  ];

  return (
    <div className="slide-card">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🤔" title="이럴 때 두 분은?" noMargin />
        {!submitted && <span className="text-[10px] text-[var(--color-ink-faint)]">{answered}/{list.length} 답함</span>}
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        {!submitted ? (
          <>
            <KkachiTip>실제 두 분은 어떤가요? 질문에 모두 답해 주시면, 사주가 미리 예측해 둔 답과 한꺼번에 맞춰 볼게요. 얼마나 맞는지로 이 궁합 풀이의 신뢰도와, 두 분이 사주대로 사는 스타일인지 알려드려요.</KkachiTip>
            {list.map((s, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] p-3 space-y-2">
                <p className="text-sm font-semibold leading-snug text-[var(--color-ink)]">Q{i + 1}. {s.q}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {options.map((o) => {
                    const on = answers[i] === o.pick;
                    return (
                      <button
                        key={o.pick}
                        type="button"
                        onClick={() => onAnswer(i, o.pick)}
                        className={`py-2 rounded-lg border text-xs font-semibold truncate px-1 transition-colors ${
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
              disabled={!allAnswered}
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                allAnswered ? "btn-shimmer active:opacity-70" : "border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] text-[var(--color-ink-faint)]"
              }`}
            >
              {allAnswered ? "🔮 사주 예측과 맞춰 보기" : `${list.length - answered}개 남았어요`}
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
              const rate = hit / judged.length;
              const r = reliability(rate);
              return (
                <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-4 text-center space-y-1">
                  <p className="text-[11px] font-semibold text-[var(--color-gold)]">이 궁합 풀이의 신뢰도</p>
                  <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">{r.level}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">사주 예측과 {judged.length}개 중 {hit}개 일치 ({Math.round(rate * 100)}%)</p>
                  <p className="text-sm leading-relaxed text-[var(--color-ink)] pt-1">{r.text}</p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2">
              {([["p1", name1], ["p2", name2]] as const).map(([k, name]) => {
                const pr = personRate(list, answers, k);
                const st = style(pr.rate);
                return (
                  <div key={k} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] p-3 text-center space-y-1">
                    <p className="text-[11px] font-semibold text-[var(--color-ink-muted)] truncate">{name}님은</p>
                    <p className="font-heading text-lg font-bold text-[var(--color-ink)]">{st.label}</p>
                    {pr.rate != null && <p className="text-[10px] text-[var(--color-ink-faint)]">관련 {pr.n}문항 중 {Math.round(pr.rate * 100)}% 일치</p>}
                    <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">{st.text}</p>
                  </div>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-[var(--color-ink-muted)] pt-1">문항별로 맞춰 보기</p>
            {list.map((s, i) => {
              const pick = answers[i];
              const skip = pick === "skip";
              const ok = !skip && pick === s.who;
              return (
                <div key={i} className={`rounded-xl border p-3 space-y-1 ${skip ? "border-[var(--color-border-light)] bg-[var(--color-ivory-warm)]" : ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                  <p className="text-sm font-semibold leading-snug text-[var(--color-ink)]">Q{i + 1}. {s.q}</p>
                  <p className="text-xs">
                    <span className="text-[var(--color-ink-muted)]">내 답 </span><strong className="text-[var(--color-ink)]">{skip ? "모르겠어요" : who(pick)}</strong>
                    <span className="text-[var(--color-ink-muted)]"> · 사주 예측 </span><strong className="text-[var(--color-ink)]">{who(s.who)}</strong>
                    {!skip && <span className={`ml-1.5 font-bold ${ok ? "text-emerald-700" : "text-rose-700"}`}>{ok ? "✓ 일치" : "✗ 다름"}</span>}
                  </p>
                  <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">사주 근거: {s.reason}</p>
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
