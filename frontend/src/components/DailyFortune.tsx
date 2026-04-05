"use client";

import { useState } from "react";
import type { DailyFortune } from "@/types/analysis";

const DOMAIN_LABELS: Record<string, string> = {
  재물: "재물운",
  연애: "연애운",
  직업: "직업운",
  건강: "건강운",
};

const LEVEL_BAR: Record<string, string> = {
  좋음: "bg-emerald-400",
  보통: "bg-amber-400",
  주의: "bg-rose-400",
};

const WEATHER_ICON: Record<string, string> = {
  火: "☀️", 土: "🌥️", 金: "☁️", 水: "🌧️", 木: "🌬️",
};

const TOTAL_LEVEL_META: Record<string, { badge: string; icon: string }> = {
  "좋은 날":         { badge: "bg-emerald-100 text-emerald-800", icon: "🌟" },
  "평범한 날":       { badge: "bg-amber-100 text-amber-800",    icon: "☁️" },
  "주의가 필요한 날": { badge: "bg-rose-100 text-rose-800",      icon: "⚠️" },
};

const DAY_LABELS = ["오늘", "내일", "모레", "글피"];

function getDayLabel(index: number, dateStr: string) {
  return DAY_LABELS[index] ?? new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getDowLabel(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("ko-KR", { weekday: "short" });
}

// ── 단일 날 상세 뷰 ────────────────────────────────────────────────────────
function DetailView({ data }: { data: DailyFortune }) {
  const meta = TOTAL_LEVEL_META[data.level] ?? TOTAL_LEVEL_META["평범한 날"];

  return (
    <div className="space-y-4">
      {/* 일진 + 레벨 + 날씨 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-heading font-semibold text-[var(--color-ink)]">{data.day_pillar}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-ivory-warm)] text-[var(--color-ink-muted)] border border-[var(--color-border-light)]">
            {data.day_element}
          </span>
          {data.weather && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              {WEATHER_ICON[data.weather.element] ?? "🌤️"} {data.weather.condition}
            </span>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${meta.badge}`}>
          {meta.icon} {data.level}
        </span>
      </div>

      {/* 종합 점수 바 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-[var(--color-ink-faint)]">
          <span>종합 운세</span>
          <span className="font-semibold text-[var(--color-ink)]">{data.total_score}점</span>
        </div>
        <div className="h-2 bg-[var(--color-ivory-warm)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-gold)] rounded-full transition-all" style={{ width: `${data.total_score}%` }} />
        </div>
      </div>

      {/* 영역별 점수 */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(data.domain_scores).map(([key, ds]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-ink-light)]">{DOMAIN_LABELS[key] ?? key}</span>
              <span className="font-medium text-[var(--color-ink)]">{ds.score}</span>
            </div>
            <div className="h-1.5 bg-[var(--color-ivory-warm)] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${LEVEL_BAR[ds.level] ?? "bg-amber-400"}`} style={{ width: `${ds.score}%` }} />
            </div>
            <p className="text-[10px] text-[var(--color-ink-faint)] leading-snug">{ds.reason}</p>
          </div>
        ))}
      </div>

      {/* 설명 */}
      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed border-t border-[var(--color-border-light)] pt-3">
        {data.description}
      </p>

      {/* 팁 */}
      {data.tips.length > 0 && (
        <ul className="space-y-1">
          {data.tips.map((tip, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-[var(--color-ink-light)]">
              <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── 주간 컴팩트 뷰 ───────────────────────────────────────────────────────────
function WeeklyView({ forecast }: { forecast: DailyFortune[] }) {
  return (
    <div className="space-y-2">
      {forecast.map((day, i) => {
        const meta = TOTAL_LEVEL_META[day.level] ?? TOTAL_LEVEL_META["평범한 날"];
        return (
          <div key={day.date} className="flex items-center gap-3">
            {/* 날짜 */}
            <div className="w-14 flex-shrink-0 text-right">
              <p className="text-xs font-medium text-[var(--color-ink)]">{getDayLabel(i, day.date)}</p>
              <p className="text-[10px] text-[var(--color-ink-faint)]">{getDowLabel(day.date)}</p>
            </div>
            {/* 일진 */}
            <span className="w-8 flex-shrink-0 text-center font-heading text-sm text-[var(--color-ink-muted)]">
              {day.day_pillar}
            </span>
            {/* 점수 바 */}
            <div className="flex-1 h-2 bg-[var(--color-ivory-warm)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-gold)] rounded-full transition-all"
                style={{ width: `${day.total_score}%` }}
              />
            </div>
            {/* 점수 */}
            <span className="w-7 flex-shrink-0 text-xs font-medium text-[var(--color-ink)] text-right">{day.total_score}</span>
            {/* 레벨 배지 */}
            <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.badge}`}>
              {meta.icon}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────────────
type Tab = "오늘" | "내일" | "주간";

export default function DailyFortunePanel({
  forecast,
  loading,
}: {
  forecast: DailyFortune[] | null;
  loading: boolean;
}) {
  const [tab, setTab] = useState<Tab>("오늘");

  if (loading) {
    return (
      <div className="mt-3 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-5 text-xs text-center text-[var(--color-ink-faint)]">
        운세 불러오는 중...
      </div>
    );
  }

  if (!forecast || forecast.length === 0) return null;

  const today = forecast[0];
  const tomorrow = forecast[1] ?? null;

  return (
    <div className="mt-3 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-5 space-y-4 text-sm">
      {/* 탭 */}
      <div className="flex gap-0.5 p-0.5 bg-[var(--color-parchment)] rounded-lg w-fit">
        {(["오늘", "내일", "주간"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              tab === t
                ? "bg-white text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-faint)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      {tab === "오늘" && <DetailView data={today} />}
      {tab === "내일" && tomorrow && <DetailView data={tomorrow} />}
      {tab === "주간" && <WeeklyView forecast={forecast} />}
    </div>
  );
}
