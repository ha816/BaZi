"use client";

import KkachiTip from "../KkachiTip";
import SectionHeader from "../SectionHeader";
import type { CompatTabProps } from "./types";

export type QuizPick = "p1" | "p2" | "both";

interface Props extends CompatTabProps {
  /** 질문 번호 → 사용자가 고른 답 (오케스트레이터가 결과 단위로 들고 있음 — 인트로 문답·이럴 때 탭 공유). 서버에 보내지 않는다 */
  answers: Record<number, QuizPick>;
  onAnswer: (i: number, pick: QuizPick) => void;
  /** 다 고르고 "사주와 맞춰 보기"를 눌렀는지 — 누르기 전엔 사주 예측을 숨긴다 */
  submitted: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

type Scenario = { q: string; who: "p1" | "p2" | "both"; reason: string };

// 일치율 구간별 해설 한 문장 — 신뢰도·사주 스타일 라벨은 2026-10-15 뺐다(분석 설문조사와 같게). 사주 해석이 아니라 일치율 안내
function rateNote(rate: number) {
  if (rate >= 0.8) return "두 분의 실제 모습이 사주와 거의 같아요. 이 궁합 풀이를 믿고 참고해도 좋아요.";
  if (rate >= 0.5) return "사주의 결을 따르면서도 두 분만의 방식이 섞여 있어요. 풀이는 큰 흐름으로 참고하세요.";
  return "두 분은 타고난 기운에 서로의 색을 더해 가는 사이예요. 풀이는 가볍게 참고하고, 서로가 아는 모습을 더 믿어 주세요.";
}

/** 이럴 때 두 분은? — [이름1 / 이름2 / 둘 다]로 전부 답한 뒤 한꺼번에 사주 예측과 맞춘다. 결과는 일치율 + 까치 해설 + 문항별(다른 문항 먼저) */
export default function ScenarioCard({ data, name1, name2, answers, onAnswer, submitted, onSubmit, onReset }: Props) {
  const list = (data.character?.scenarios ?? []) as Scenario[];
  if (list.length === 0) return null;
  const who = (w: string) => (w === "p1" ? `${name1}님` : w === "p2" ? `${name2}님` : "둘 다");
  const answered = list.filter((_, i) => answers[i]).length;
  const allAnswered = answered === list.length;
  const matched = list.filter((s, i) => answers[i] === s.who).length;
  const options: { pick: QuizPick; label: string }[] = [
    { pick: "p1", label: `${name1}님` },
    { pick: "p2", label: `${name2}님` },
    { pick: "both", label: "둘 다" },
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
            <KkachiTip>실제 두 분은 어떤가요? 질문에 모두 답해 주시면, 사주가 미리 예측해 둔 답과 한꺼번에 맞춰 얼마나 맞는지 알려드려요.</KkachiTip>
            {list.map((s, i) => (
              <div key={i} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] p-3 space-y-2">
                <p className="text-sm font-semibold leading-snug text-[var(--color-ink)] break-keep">Q{i + 1}. {s.q}</p>
                <div className="grid grid-cols-3 gap-2">
                  {options.map((o) => {
                    const on = answers[i] === o.pick;
                    return (
                      <button
                        key={o.pick}
                        type="button"
                        onClick={() => onAnswer(i, o.pick)}
                        className={`py-3 rounded-lg border text-sm font-semibold truncate px-1 transition-colors ${
                          on
                            ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-ivory)]"
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
        ) : (
          <div className="space-y-3 score-pop">
            <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-4 text-center space-y-1">
              <p className="text-[11px] font-semibold text-[var(--color-gold)]">사주와 두 분 응답의 일치율</p>
              <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">{Math.round((matched / list.length) * 100)}%</p>
            </div>
            <KkachiTip>{rateNote(matched / list.length)}</KkachiTip>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] pt-1">문항별로 맞춰 보기</p>
            {/* 다른 문항을 먼저(근거 포함), 일치한 문항은 뒤에 짧게(근거 없이) — 번호는 원래 문항 순서 그대로 */}
            {list
              .map((s, i) => ({ s, i, same: answers[i] === s.who }))
              .sort((a, b) => Number(a.same) - Number(b.same))
              .map(({ s, i, same }) => (
                <div key={i} className={`rounded-xl border space-y-1 ${same ? "border-emerald-200 bg-emerald-50 px-3 py-2" : "border-rose-200 bg-rose-50 p-3"}`}>
                  <p className={`font-semibold leading-snug text-[var(--color-ink)] break-keep ${same ? "text-xs" : "text-sm"}`}>Q{i + 1}. {s.q}</p>
                  <p className="text-xs">
                    <span className="text-[var(--color-ink-muted)]">내 답 </span><strong className="text-[var(--color-ink)]">{who(answers[i])}</strong>
                    <span className="text-[var(--color-ink-muted)]"> · 사주 예측 </span><strong className="text-[var(--color-ink)]">{who(s.who)}</strong>
                    <span className={`ml-1.5 font-bold ${same ? "text-emerald-700" : "text-rose-700"}`}>{same ? "✓ 일치" : "✗ 다름"}</span>
                  </p>
                  {!same && <p className="text-[11px] leading-snug text-[var(--color-ink-muted)] break-keep">근거: {s.reason}</p>}
                </div>
              ))}
            <button type="button" onClick={onReset} className="block mx-auto text-xs text-[var(--color-gold)] underline underline-offset-2">다시 답하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
