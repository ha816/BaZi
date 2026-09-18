"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getEventSummary, getFeedbackSummary, type EventSummary, type FeedbackSummary } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

const TAB_META: Record<string, { label: string; emoji: string }> = {
  summary:  { label: "한눈에",      emoji: "🐦" },
  natal:    { label: "만세력",      emoji: "🌱" },
  energy:   { label: "신살·운성",   emoji: "⭐" },
  yongshin: { label: "용신·삼재",   emoji: "🔮" },
  daeun:    { label: "시운(時運)",  emoji: "🌊" },
  timing:   { label: "택시(擇時)",   emoji: "🗓️" },
  zodiac:   { label: "십이지신",    emoji: "🐾" },
  fengshui: { label: "풍수",        emoji: "🧭" },
  ai:       { label: "AI 풀이",     emoji: "✨" },
  daily:    { label: "일진 맞았어요?", emoji: "📅" },
};

function rateColor(rate: number, total: number): string {
  if (total === 0) return "var(--color-ink-faint)";
  if (rate >= 0.7) return "#16A34A";   // green
  if (rate >= 0.5) return "#CA8A04";   // amber
  return "#DC2626";                    // red
}

export default function FeedbackAdminPage() {
  const [data, setData] = useState<FeedbackSummary[] | null>(null);
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeedbackSummary()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "불러오기 실패"));
    getEventSummary(7).then(setEvents).catch(() => setEvents([]));
  }, []);

  const totalAll = data?.reduce((acc, s) => acc + s.total, 0) ?? 0;
  const positiveAll = data?.reduce((acc, s) => acc + s.positive, 0) ?? 0;
  const overallRate = totalAll ? positiveAll / totalAll : 0;

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)]">
            ← 홈으로
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-[var(--color-ink)]">
            해석 피드백 요약
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            탭별 👍/👎 비율을 만족도 낮은 순으로 정렬해요. 빨강이 우선 개선 대상이에요.
          </p>
        </header>

        {error && (
          <div className="rounded-lg px-5 py-4 text-sm text-[var(--color-fire)]"
            style={{ backgroundColor: "#F7EDEC", borderLeft: "3px solid var(--color-fire)" }}>
            {error}
          </div>
        )}

        {!data && !error && <LoadingSpinner />}

        {data && data.length === 0 && (
          <p className="text-sm text-[var(--color-ink-muted)]">아직 누적된 피드백이 없어요.</p>
        )}

        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading text-lg font-bold text-[var(--color-ink)]">최근 7일 이벤트</h2>
            <span className="text-[10px] text-[var(--color-ink-faint)]">건수 · 세션 수</span>
          </div>
          {!events && <LoadingSpinner />}
          {events && events.length === 0 && (
            <p className="text-sm text-[var(--color-ink-muted)]">아직 이벤트가 없어요.</p>
          )}
          {events && events.length > 0 && (
            <ul className="divide-y divide-[var(--color-border-light)]">
              {events.map((e) => (
                <li key={e.name} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-[var(--color-ink)]">{e.name}</span>
                  <span className="text-[var(--color-ink-muted)]">{e.count} · {e.sessions}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {data && data.length > 0 && (
          <>
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border-light)] p-5 flex items-center gap-6">
              <div>
                <p className="text-xs text-[var(--color-ink-faint)]">총 피드백 수</p>
                <p className="font-heading text-2xl font-bold text-[var(--color-ink)]">{totalAll}</p>
              </div>
              <div className="h-10 w-px bg-[var(--color-border-light)]" />
              <div>
                <p className="text-xs text-[var(--color-ink-faint)]">전체 긍정률</p>
                <p
                  className="font-heading text-2xl font-bold"
                  style={{ color: rateColor(overallRate, totalAll) }}
                >
                  {(overallRate * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {data.map((s) => {
                const meta = TAB_META[s.tab_id] ?? { label: s.tab_id, emoji: "❔" };
                const color = rateColor(s.positive_rate, s.total);
                return (
                  <li
                    key={s.tab_id}
                    className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border-light)] p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{meta.emoji}</span>
                        <span className="font-semibold text-[var(--color-ink)]">{meta.label}</span>
                        <span className="text-[10px] text-[var(--color-ink-faint)]">({s.tab_id})</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading text-lg font-bold" style={{ color }}>
                          {(s.positive_rate * 100).toFixed(0)}%
                        </p>
                        <p className="text-[10px] text-[var(--color-ink-faint)]">
                          👍 {s.positive} · 👎 {s.negative} · 총 {s.total}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${s.positive_rate * 100}%`, backgroundColor: color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
