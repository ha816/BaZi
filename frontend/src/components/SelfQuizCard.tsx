"use client";

import { useRef, useState } from "react";
import type { SelfQuizItem } from "@/types/analysis";
import KkachiTip from "./KkachiTip";
import SectionHeader from "./SectionHeader";

export type SelfPick = "yes" | "no";

interface Props {
  items: SelfQuizItem[];
  name: string;
  /** 상태는 ResultSlides가 들고 있다(인트로 설문·설문 탭이 공유, 탭을 오가도 유지). 서버에 보내지 않는다 */
  answers: Record<number, SelfPick>;
  submitted: boolean;
  onAnswer: (i: number, pick: SelfPick) => void;
  onSubmit: () => void;
  onReset: () => void;
}

// 그렇다/아니다 두 가지 — 엄지로 빨리 고르게 (2026-10-13 간소화, 반반·모르겠어요 제거). 아래 문구는 사주 해석이 아니라 일치율 안내
const OPTIONS: { pick: SelfPick; label: string }[] = [
  { pick: "yes", label: "그렇다" },
  { pick: "no", label: "아니다" },
];
const LABEL: Record<string, string> = { yes: "그렇다", no: "아니다" };

// 한 페이지에 보여줄 문항 수 — 10문항을 한 화면에 늘어놓으면 길어 보여 5문항씩 끊는다 (2026-10-17)
const PAGE_SIZE = 5;

// 일치율 구간별 해설 한 문장 — 신뢰도·사주 스타일 라벨은 뺐고(2026-10-13) 문장만 남긴다
function rateNote(rate: number) {
  if (rate >= 0.8) return "타고난 기운대로 사는 편이에요. 이 사주 풀이를 믿고 참고해도 좋아요.";
  if (rate >= 0.5) return "사주의 결을 따르면서도 자기만의 방식이 섞여 있어요. 풀이는 큰 흐름으로 참고하세요.";
  return "타고난 기운에 나만의 색을 더해 살아가고 있어요. 풀이는 가볍게 참고하고, 지금의 내 모습을 더 믿어 주세요.";
}

/** 설문조사(구 "내 사주 맞춰 보기", ROADMAP V3) — 결과를 본 뒤 고르는 선택 단계. 5문항씩 페이지로 넘기며 답하고, 다 답하면 한꺼번에 사주 예측과 비교 */
export default function SelfQuizCard({ items, name, answers, submitted, onAnswer, onSubmit, onReset }: Props) {
  // 페이지는 화면 상태라 여기서만 든다. 처음 열 때는 아직 안 답한 문항이 있는 첫 페이지부터 (인트로에서 답하다 탭으로 와도 이어짐)
  const firstOpen = items.findIndex((_, i) => !answers[i]);
  const [page, setPage] = useState(Math.max(0, Math.floor((firstOpen < 0 ? items.length - 1 : firstOpen) / PAGE_SIZE)));
  const cardRef = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  const who = name ? `${name}님` : "나";
  const answered = items.filter((_, i) => answers[i]).length;
  const matched = items.filter((it, i) => answers[i] === it.predict).length;

  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const cur = Math.min(page, pageCount - 1);
  const start = cur * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);
  const pageLeft = pageItems.filter((_, j) => !answers[start + j]).length;
  const last = cur === pageCount - 1;
  // 페이지를 넘기면 카드 첫 줄로 올린다 — 인트로 전체 화면에서는 그 안의 스크롤, 탭에서는 2줄 고정 탭바(약 124px) 아래로(scroll-mt-36, 전체 화면에서는 스크롤이 0으로 붙어 영향 없음)
  const goPage = (n: number) => {
    setPage(n);
    cardRef.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div ref={cardRef} className="slide-card scroll-mt-36">
      <div className="slide-card__header flex items-center justify-between">
        <SectionHeader emoji="🔮" title="설문조사" noMargin />
        {!submitted && (
          <span className="text-[10px] text-[var(--color-ink-faint)]">
            {pageCount > 1 && <>{cur + 1}/{pageCount} 페이지 · </>}{answered}/{items.length} 답함
          </span>
        )}
      </div>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        {!submitted ? (
          <>
            <KkachiTip>평소의 {who}에 가장 가까운 답을 골라 주세요. {items.length}문항을 다 고르면 사주가 미리 예측해 둔 답과 한꺼번에 맞춰, 얼마나 맞는지 알려드려요.</KkachiTip>
            {pageItems.map((it, j) => {
              const i = start + j;
              return (
                <div key={it.basis} className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] p-3 space-y-2">
                  <p className="text-sm font-semibold leading-snug text-[var(--color-ink)] break-keep">Q{i + 1}. {it.q}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OPTIONS.map((o) => {
                      const on = answers[i] === o.pick;
                      return (
                        <button
                          key={o.pick}
                          type="button"
                          onClick={() => onAnswer(i, o.pick)}
                          className={`py-3 rounded-lg border text-sm font-semibold transition-colors ${
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
              );
            })}
            {/* 마지막 페이지 전에는 이 페이지를 다 답해야 다음으로, 마지막 페이지에서는 전부 답해야 맞춰 보기 */}
            {last ? (
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
            ) : (
              <button
                type="button"
                onClick={() => goPage(cur + 1)}
                disabled={pageLeft > 0}
                className={`w-full py-3 rounded-xl text-sm font-semibold ${
                  pageLeft === 0 ? "bg-[var(--color-ink)] text-[var(--color-ivory)] active:opacity-70" : "border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] text-[var(--color-ink-faint)]"
                }`}
              >
                {pageLeft === 0 ? `다음 문항으로 (${start + PAGE_SIZE + 1}~${Math.min(items.length, start + PAGE_SIZE * 2)}번) ›` : `이 페이지에 ${pageLeft}개 남았어요`}
              </button>
            )}
            {cur > 0 && (
              <button type="button" onClick={() => goPage(cur - 1)} className="block mx-auto text-xs text-[var(--color-ink-muted)] underline underline-offset-2">
                ‹ 이전 문항 ({start - PAGE_SIZE + 1}~{start}번)
              </button>
            )}
          </>
        ) : (
          <div className="space-y-3 score-pop">
            {/* 일치율 상자 + 아래 까치가 해설 한 문장 — 신뢰도·사주 스타일 라벨과 "N문항 중 N문항" 문구는 2026-10-13 뺐다 */}
            <div className="rounded-2xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-4 text-center space-y-1">
              <p className="text-[11px] font-semibold text-[var(--color-gold)]">사주와 설문 응답의 일치율</p>
              <p className="font-heading text-3xl font-bold text-[var(--color-ink)]">{Math.round((matched / items.length) * 100)}%</p>
            </div>
            <KkachiTip>{rateNote(matched / items.length)}</KkachiTip>
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] pt-1">문항별로 맞춰 보기</p>
            {/* 다른 문항을 먼저(근거 포함), 일치한 문항은 뒤에 짧게(근거 없이) — 번호는 원래 문항 순서 그대로 */}
            {items
              .map((it, i) => ({ it, i, same: answers[i] === it.predict }))
              .sort((a, b) => Number(a.same) - Number(b.same))
              .map(({ it, i, same }) => (
                <div key={it.basis} className={`rounded-xl border space-y-1 ${same ? "border-emerald-200 bg-emerald-50 px-3 py-2" : "border-rose-200 bg-rose-50 p-3"}`}>
                  <p className={`font-semibold leading-snug text-[var(--color-ink)] break-keep ${same ? "text-xs" : "text-sm"}`}>Q{i + 1}. {it.q}</p>
                  <p className="text-xs">
                    <span className="text-[var(--color-ink-muted)]">내 답 </span><strong className="text-[var(--color-ink)]">{LABEL[answers[i]]}</strong>
                    <span className="text-[var(--color-ink-muted)]"> · 사주 예측 </span><strong className="text-[var(--color-ink)]">{LABEL[it.predict]}</strong>
                    <span className={`ml-1.5 font-bold ${same ? "text-emerald-700" : "text-rose-700"}`}>{same ? "✓ 일치" : "✗ 다름"}</span>
                  </p>
                  {!same && <p className="text-[11px] leading-snug text-[var(--color-ink-muted)]">근거: {it.reason}</p>}
                </div>
              ))}
            {/* 다시 답하면 첫 페이지부터 */}
            <button type="button" onClick={() => { setPage(0); onReset(); }} className="block mx-auto text-xs text-[var(--color-gold)] underline underline-offset-2">다시 답하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
