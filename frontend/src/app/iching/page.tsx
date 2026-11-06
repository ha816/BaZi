"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import HexagramFigure from "@/components/HexagramFigure";
import { askIching, type IchingAnswer, type IchingBlocked, type IchingCategory } from "@/lib/api";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { parseStored, useStorageValue } from "@/lib/useStorageValue";
import { track } from "@/lib/track";
import type { AnalysisInput } from "@/types/analysis";

// 까치에게 묻기 — 주역 질문 괘 (V11-1, 2026-11-07, specs/iching/index.md). 질문 → POST /iching/ask → 동전 셋이 여섯 번 떨어지며 아래부터 효가 쌓임(약 3초)
// → 본괘 "지금" 한 줄 → 지괘 "앞으로" 한 줄 → 영역 한 줄 → 사주가 있으면 일진·용신 교차 두 문장 → 면책. 저장 없음, 같은 날 같은 질문은 같은 괘.
// 로그인은 member_id(기본 프로필), 비로그인은 /analysis 입력값(sessionStorage) — 둘 다 없으면 괘만(cross 없음).

const CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-4";
const BOX = "rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5";
const CATEGORIES: IchingCategory[] = ["연애", "일", "재물", "기타"];
const MIN = 4;
const MAX = 80;
const STEP_MS = 480;  // 효 하나(동전 셋) 떨어지는 간격 — 여섯 줄 ≈ 2.9초
const DISCLAIMER = "괘는 앞날을 맞히는 도구가 아니라 지금 선택을 비춰 보는 거울이에요. 건강·법률·돈 문제는 전문가와 먼저 상의하세요.";

const LINE_LABEL: Record<number, string> = { 6: "음 · 움직임", 7: "양", 8: "음", 9: "양 · 움직임" };

export default function IchingPage() {
  const memberId = useStorageValue(MEMBER_ID_KEY);
  const inputRaw = useStorageValue("kkachi_analysis_input", "session");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<IchingCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<IchingAnswer | null>(null);
  const [blocked, setBlocked] = useState<IchingBlocked | null>(null);
  const [step, setStep] = useState(0);  // 쌓인 효 수 0~6
  const done = answer !== null && step >= 6;

  useEffect(() => {
    if (memberId === null) return;
    track("iching_view", { page: "iching", logged_in: !!memberId });
  }, [memberId]);

  // 동전 연출 — 답이 오면 480ms마다 한 줄씩. 움직임 줄이기 설정이면 바로 전부
  useEffect(() => {
    if (!answer) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(6);
      return;
    }
    const id = window.setInterval(() => setStep((s) => (s >= 6 ? s : s + 1)), STEP_MS);
    return () => window.clearInterval(id);
  }, [answer]);

  if (memberId === null || inputRaw === null) return null;  // 하이드레이션 전
  const trimmed = question.trim();
  const canAsk = trimmed.length >= MIN && trimmed.length <= MAX && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAsk) return;
    setLoading(true);
    setError("");
    try {
      const input = memberId ? null : parseStored<AnalysisInput>(inputRaw);
      const res = await askIching({
        question: trimmed, category,
        member_id: memberId || null,
        birth_dt: input?.birth_dt, gender: input?.gender, hour_unknown: input?.hour_unknown, city: input?.city,
      });
      if ("blocked" in res) {
        setBlocked(res);
      } else {
        setStep(0);
        setAnswer(res);
        track("iching_ask", { category: res.category, len: trimmed.length, has_saju: res.identity === "person", mode: res.mode });
      }
    } catch {
      setError("까치가 괘를 가져오지 못했어요. 잠시 뒤 다시 물어 주세요.");
    } finally {
      setLoading(false);
    }
  };
  const reset = () => { setAnswer(null); setBlocked(null); setStep(0); setQuestion(""); setCategory(null); };

  const hx = answer?.hexagram;
  const tx = answer?.transformed;

  return (
    <main className="page">
      <div className="page__inner">
        <PageHeader title="까치에게 묻기" description="고민 하나를 적으면 동전 셋을 여섯 번 던져 주역(周易) 괘를 뽑아요" />

        {!answer && !blocked && (
          <form onSubmit={submit} className={CARD}>
            <label htmlFor="iching-q" className="block text-[12px] font-bold text-[var(--color-ink-muted)]">무엇이 궁금한가요?</label>
            <textarea
              id="iching-q"
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, MAX))}
              rows={2}
              maxLength={MAX}
              placeholder="예) 지금 회사를 옮겨도 될까요"
              className="mt-1.5 w-full resize-none rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory)] px-3 py-2.5 text-[15px] leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-light)]"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-ink-faint)]">{trimmed.length < MIN ? `${MIN}자 이상 적어 주세요` : "할까 말까, 언제가 좋을까 같은 물음이 잘 맞아요"}</span>
              <span className="text-[11px] text-[var(--color-ink-faint)]">{question.length}/{MAX}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="영역">
              {CATEGORIES.map((c) => {
                const on = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(on ? null : c)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${on ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-white" : "border-[var(--color-border-light)] bg-[var(--color-card)] text-[var(--color-ink-muted)]"}`}
                  >
                    {c}
                  </button>
                );
              })}
              <span className="self-center text-[11px] text-[var(--color-ink-faint)]">{category ? "" : "고르지 않으면 질문을 보고 정해요"}</span>
            </div>
            <button
              type="submit"
              disabled={!canAsk}
              className="mt-4 w-full rounded-xl bg-[var(--color-ink)] py-3 text-[15px] font-bold text-white disabled:opacity-40 active:opacity-80"
            >
              {loading ? "동전을 꺼내는 중…" : "괘 뽑기"}
            </button>
            {error && <p className="mt-2 text-center text-xs text-rose-600">{error}</p>}
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--color-ink-faint)] break-keep">같은 날 같은 질문은 같은 괘가 나와요. 다시 뽑기는 없어요.</p>
          </form>
        )}

        {blocked && (
          <section className={CARD}>
            <p className="text-[15px] leading-relaxed text-[var(--color-ink)] break-keep">{blocked.message}</p>
            <ul className="mt-3 space-y-1.5">
              {blocked.helplines.map((h) => (
                <li key={h.number} className="flex items-center justify-between rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5">
                  <span className="text-sm text-[var(--color-ink)]">{h.name}</span>
                  <a href={`tel:${h.number}`} className="font-heading text-lg font-bold text-[var(--color-gold)]">{h.number}</a>
                </li>
              ))}
            </ul>
            <button type="button" onClick={reset} className="mt-4 w-full rounded-xl border border-[var(--color-border-light)] py-2.5 text-sm font-semibold text-[var(--color-ink-muted)]">돌아가기</button>
          </section>
        )}

        {answer && hx && (
          <section className={CARD}>
            <p className="text-center text-[13px] text-[var(--color-ink-muted)] break-keep">“{answer.question}”</p>

            <div className="mt-4 flex flex-col items-center">
              {!done && <Coins value={answer.values[Math.min(step, 5)]} step={step} />}
              <HexagramFigure lines={hx.lines} shown={step} animate className={done ? "" : "mt-3"} />
              {!done && (
                <p className="mt-2 h-4 text-[11px] text-[var(--color-ink-faint)]">
                  {step > 0 ? `${step}번째 줄 · ${LINE_LABEL[answer.values[step - 1]]}` : "동전 셋을 던져요…"}
                </p>
              )}
            </div>

            {done && (
              <div className="score-pop mt-4 break-keep">
                <h2 className="text-center font-heading text-xl font-bold text-[var(--color-ink)]">
                  {hx.name}<span className="text-base font-medium text-[var(--color-ink-muted)]">({hx.hanja})</span>
                </h2>
                <p className="mt-0.5 text-center text-[11px] text-[var(--color-ink-faint)]">
                  {hx.id}번째 괘 {hx.traditional} · 위 {hx.upper.name}({hx.upper.hanja}) 아래 {hx.lower.name}({hx.lower.hanja})
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {hx.keywords.map((k) => (
                    <span key={k} className="rounded-full border border-[var(--color-border-light)] bg-[var(--color-ivory)] px-2.5 py-1 text-xs text-[var(--color-ink)]">{k}</span>
                  ))}
                </div>

                <div className={`${BOX} mt-4`}>
                  <p className="text-[11px] font-bold text-[var(--color-gold)]">지금</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--color-ink)]">{hx.line}</p>
                </div>
                <div className={`${BOX} mt-2`}>
                  <p className="text-[11px] font-bold text-[var(--color-gold)]">앞으로</p>
                  {tx && (
                    <div className="mt-1.5 flex items-center gap-3">
                      <HexagramFigure lines={tx.lines} size="sm" />
                      <div className="min-w-0">
                        <p className="font-heading text-[15px] font-bold leading-tight text-[var(--color-ink)]">
                          {tx.name}<span className="text-xs font-medium text-[var(--color-ink-muted)]">({tx.hanja})</span>
                        </p>
                        <p className="text-[11px] text-[var(--color-ink-faint)]">{tx.id}번째 괘 {tx.traditional}</p>
                      </div>
                    </div>
                  )}
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink)]">
                    {answer.change}{tx ? ` ${tx.line}` : ""}
                  </p>
                </div>

                {answer.area && (
                  <dl className="mt-3 flex gap-3 border-t border-[var(--color-border-light)] pt-3">
                    <dt className="w-10 shrink-0 pt-0.5 text-xs font-bold text-[var(--color-gold)]">{answer.area.label}</dt>
                    <dd className="text-[13px] leading-relaxed text-[var(--color-ink)]">{answer.area.text}</dd>
                  </dl>
                )}

                {answer.cross ? (
                  <div className={`${BOX} mt-3`}>
                    <p className="text-[12px] leading-relaxed text-[var(--color-ink-muted)]">
                      {/* 문장마다 한 줄 — 타로 교차 상자와 같은 표기(굵게·가운뎃점 없음) */}
                      {`오늘 일진과 함께 보면, ${answer.cross}`.split(". ").map((s, i, a) => <span key={i} className="block">{i < a.length - 1 ? `${s}.` : s}</span>)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-center text-xs text-[var(--color-ink-muted)] break-keep">
                    {memberId ? (
                      <Link href="/profile" className="underline underline-offset-2 text-[var(--color-gold)]">기본 프로필을 정하면 오늘 일진·내게 필요한 기운과 함께 봐요</Link>
                    ) : (
                      <Link href="/analysis" className="underline underline-offset-2 text-[var(--color-gold)]">내 사주를 먼저 보면 오늘 일진·내게 필요한 기운과 함께 봐요</Link>
                    )}
                  </p>
                )}

                <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--color-ink-faint)] break-keep">{DISCLAIMER}</p>
                <button type="button" onClick={reset} className="mt-3 w-full rounded-xl border border-[var(--color-border-light)] py-2.5 text-sm font-semibold text-[var(--color-ink-muted)] active:opacity-70">다른 것 묻기</button>
              </div>
            )}
          </section>
        )}

        <p className="text-center">
          <Link href="/" className="text-xs font-semibold text-[var(--color-ink-muted)]">← 홈으로</Link>
        </p>
      </div>
    </main>
  );
}

/** 동전 셋 — 값(6~9)에서 앞면 수 = 값 − 6. step이 바뀔 때마다 coin-toss 애니(키로 다시 마운트) */
function Coins({ value, step }: { value: number; step: number }) {
  const heads = value - 6;
  return (
    <div key={step} className="flex gap-2.5" aria-hidden>
      {[0, 1, 2].map((i) => {
        const head = i < heads;
        return (
          <span
            key={i}
            className={`coin-toss inline-block h-7 w-7 rounded-full border-2 ${head ? "border-[var(--color-gold)] bg-[var(--color-gold)]" : "border-[var(--color-gold)] bg-[var(--color-ivory)]"}`}
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        );
      })}
    </div>
  );
}
