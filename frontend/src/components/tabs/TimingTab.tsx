"use client";

import { useEffect, useMemo, useState } from "react";
import type { NatalResult, PostnatalResult, TimingMonth } from "@/types/analysis";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";
import { track } from "@/lib/track";

interface Props {
  natal: NatalResult;
  postnatal: PostnatalResult;
  name?: string;
}

const LEVEL_STYLE: Record<TimingMonth["level"], { bg: string; border: string; text: string; badge: string; label: string }> = {
  좋음: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-800", badge: "bg-emerald-100 text-emerald-800", label: "밀어주는 달" },
  보통: { bg: "bg-[var(--color-card)]", border: "border-[var(--color-border-light)]", text: "text-[var(--color-ink-muted)]", badge: "bg-[var(--color-ivory-warm)] text-[var(--color-ink-muted)]", label: "무난한 달" },
  피할: { bg: "bg-rose-50", border: "border-rose-300", text: "text-rose-800", badge: "bg-rose-100 text-rose-800", label: "늦추는 달" },
};

const DOMAIN_EMOJI: Record<string, string> = {
  "이직·직업": "💼", "연애·결혼": "💞", "이사·계약": "🏠", "시험·공부": "📚", "투자·재물": "💰", "건강": "🌿",
};

/** 연도가 섞이지 않게 연도별로 묶는다. 예: "26년 9·12월, 27년 3월" */
function fmtMonths(list: TimingMonth[]): string {
  const byYear = new Map<number, number[]>();
  for (const m of list) {
    const ms = byYear.get(m.year) ?? [];
    ms.push(m.month);
    byYear.set(m.year, ms);
  }
  return [...byYear.entries()]
    .map(([year, ms]) => `${String(year).slice(2)}년 ${ms.join("·")}월`)
    .join(", ");
}

export default function TimingTab({ postnatal, name }: Props) {
  const timing = postnatal.timing ?? {};
  const domains = Object.keys(timing);
  const [domain, setDomain] = useState(domains[0] ?? "");
  const months = timing[domain] ?? [];
  const firstGood = months.find((m) => m.level === "좋음");
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    if (!domain) return;
    track("timing_view", { domain });
    const idx = months.findIndex((m) => m.level === "좋음");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(idx >= 0 ? idx : 0);
  }, [domain]); // eslint-disable-line react-hooks/exhaustive-deps

  const { good, avoid } = useMemo(() => ({
    good: months.filter((m) => m.level === "좋음"),
    avoid: months.filter((m) => m.level === "피할"),
  }), [months]);

  if (domains.length === 0) return null;
  const current = months[selected] ?? months[0];
  const cur = current ? LEVEL_STYLE[current.level] : null;
  const who = name ? `${name}님` : "당신";

  return (
    <div className="space-y-4">
      <div className="slide-card">
        <CollapsibleSectionHeader title="언제가 좋을까(擇時)">
          앞으로 열두 달의 <strong className="text-[var(--color-ink)]">월운(月運)</strong>을 영역별로 점수 매겼어요. 월운 간지가 내 일간과 맺는 십신(十神), 용신·기신 오행, 내 일지와의 육합·충, 역마·도화·문창 같은 신살을 더해 계산합니다. 초록은 그 일을 실행하기 좋은 달, 빨강은 한 박자 늦추는 달이에요.
        </CollapsibleSectionHeader>
        <div className="divider" />
        <div className="slide-card__body space-y-4">
          <KkachiTip>
            {who}, 하고 싶은 일을 고르면 열두 달을 색으로 보여드려요. 좋은 달에 실행하고, 빨간 달은 준비 기간으로 쓰면 흐름을 타기 쉬워요.
          </KkachiTip>

          {/* 영역 선택 */}
          <div className="flex flex-wrap gap-1.5">
            {domains.map((d) => (
              <button key={d} type="button" onClick={() => setDomain(d)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  d === domain
                    ? "bg-[var(--color-ink)] text-[var(--color-ivory)] border-[var(--color-ink)]"
                    : "bg-[var(--color-card)] text-[var(--color-ink-muted)] border-[var(--color-border)] hover:border-[var(--color-gold-light)]"
                }`}>
                <span className="mr-1" aria-hidden>{DOMAIN_EMOJI[d] ?? "•"}</span>{d}
              </button>
            ))}
          </div>

          {/* 한 줄 요약 */}
          <p className="text-sm text-[var(--color-ink)] leading-snug">
            {good.length > 0
              ? <>{DOMAIN_EMOJI[domain]} <strong>{domain}</strong>은 <strong className="text-emerald-700">{fmtMonths(good)}</strong>이 밀어주는 달이에요.</>
              : <>{DOMAIN_EMOJI[domain]} <strong>{domain}</strong>은 앞으로 열두 달 중 확 밀어주는 달은 없어요. 무난한 달을 골라 차분히 진행하세요.</>}
            {avoid.length > 0 && <> <span className="text-rose-700">{fmtMonths(avoid)}</span>은 늦추는 게 좋아요.</>}
          </p>

          {/* 12칸 */}
          <div className="grid grid-cols-4 gap-1.5">
            {months.map((m, i) => {
              const st = LEVEL_STYLE[m.level];
              const isSel = i === selected;
              const showYear = i === 0 || m.year !== months[i - 1].year;
              return (
                <button key={`${m.year}-${m.month}`} type="button" onClick={() => setSelected(i)}
                  className={`rounded-xl border px-1 py-2 flex flex-col items-center gap-0.5 transition-shadow ${st.bg} ${st.border} ${isSel ? "ring-2 ring-[var(--color-gold)]" : ""}`}>
                  <span className={`text-[10px] font-semibold ${st.text}`}>
                    {showYear && <span className="opacity-60 mr-0.5">{String(m.year).slice(2)}년</span>}{m.month}월
                  </span>
                  <span className="font-heading text-sm font-bold text-[var(--color-ink)] leading-none">{m.ganji}</span>
                  <span className="text-[9px] text-[var(--color-ink-faint)]">{m.ganji_korean}</span>
                  <span className={`text-[10px] font-bold ${st.text}`}>{m.score}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-[var(--color-ink-faint)]">
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-200 border border-emerald-300 align-middle mr-1" />밀어주는 달 62점↑</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-200 border border-rose-300 align-middle mr-1" />늦추는 달 42점↓</span>
          </div>

          {/* 선택한 달 상세 */}
          {current && cur && (
            <div className={`rounded-xl border p-4 space-y-2 ${cur.bg} ${cur.border}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {current.year}년 {current.month}월 · {current.ganji}({current.ganji_korean})
                </p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cur.badge}`}>{cur.label} · {current.score}점</span>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed"><span className="font-semibold text-[var(--color-ink-light)] mr-1">왜</span>{current.reason}</p>
              <p className="text-sm text-[var(--color-ink)] leading-snug"><span className="text-[var(--color-gold)] mr-1">✦</span>{current.tip}</p>
            </div>
          )}
          {firstGood === undefined && avoid.length === 0 && (
            <p className="text-[11px] text-[var(--color-ink-faint)]">열두 달이 모두 무난해요. 큰 기복 없이 꾸준히 밀어가기 좋은 흐름이에요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
