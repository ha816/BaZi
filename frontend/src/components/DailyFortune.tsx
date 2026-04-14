"use client";

import { useState, useEffect } from "react";
import type { DailyFortune, HourlyWeather } from "@/types/analysis";
import { FORECAST_LEVEL_META } from "@/lib/elementColors";

function useStreak(todayDate: string): number {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const LAST_KEY = "kkachi_last_visit";
    const STREAK_KEY = "kkachi_streak";

    const last = localStorage.getItem(LAST_KEY);
    const saved = parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10);

    const today = new Date(todayDate);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let next = 1;
    if (last === todayDate) {
      next = saved; // 오늘 이미 방문
    } else if (last === yesterdayStr) {
      next = saved + 1; // 연속 방문
    }

    localStorage.setItem(LAST_KEY, todayDate);
    localStorage.setItem(STREAK_KEY, String(next));
    setStreak(next);
  }, [todayDate]);

  return streak;
}

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

const ELEMENT_COLOR: Record<string, { bar: string; text: string; bg: string }> = {
  木: { bar: "bg-green-400",  text: "text-green-700",  bg: "bg-green-50" },
  火: { bar: "bg-orange-400", text: "text-orange-700", bg: "bg-orange-50" },
  土: { bar: "bg-amber-400",  text: "text-amber-700",  bg: "bg-amber-50" },
  金: { bar: "bg-slate-400",  text: "text-slate-600",  bg: "bg-slate-50" },
  水: { bar: "bg-blue-400",   text: "text-blue-700",   bg: "bg-blue-50" },
};

// 오행 상생 관계: key가 value를 生함
const GENERATES: Record<string, string> = {
  木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
};

function getHourlyRelation(hourElement: string, yongshin: string): "match" | "generates" | "neutral" {
  if (hourElement === yongshin) return "match";
  if (GENERATES[hourElement] === yongshin) return "generates";
  return "neutral";
}

function getHourlyScore(hourElement: string, yongshin: string): number {
  const rel = getHourlyRelation(hourElement, yongshin);
  if (rel === "match") return 100;
  if (rel === "generates") return 70;
  return 40;
}

function HourlyFortuneBar({ data, yongshin }: { data: HourlyWeather[]; yongshin: string }) {
  if (!data || data.length === 0) return null;

  const maxScore = Math.max(...data.map((h) => getHourlyScore(h.element, yongshin)));

  return (
    <div className="space-y-2 border-t border-[var(--color-border-light)] pt-3">
      <p className="text-xs font-medium text-[var(--color-ink-light)]">이 시간대가 좋아요</p>
      <div className="space-y-1.5">
        {data.map((h) => {
          const rel = getHourlyRelation(h.element, yongshin);
          const score = getHourlyScore(h.element, yongshin);
          const colors = ELEMENT_COLOR[h.element] ?? ELEMENT_COLOR["土"];
          const isHighlight = score === maxScore && rel !== "neutral";

          return (
            <div
              key={h.hour}
              className={`flex items-center gap-2 rounded-lg px-2 py-1 ${isHighlight ? colors.bg : ""}`}
            >
              <span className="w-8 flex-shrink-0 text-xs font-mono text-[var(--color-ink-faint)]">{h.hour}</span>
              <span className={`w-5 flex-shrink-0 text-center text-xs font-medium ${colors.text}`}>
                {h.element}
              </span>
              <div className="flex-1 h-1.5 bg-[var(--color-ivory-warm)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colors.bar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="w-14 flex-shrink-0 text-right">
                {rel === "match" ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    최고
                  </span>
                ) : rel === "generates" ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
                    좋음
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--color-ink-faint)]">보통</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


const DAY_LABELS = ["오늘", "내일", "모레", "글피"];

function getDayLabel(index: number, dateStr: string) {
  return DAY_LABELS[index] ?? new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getDowLabel(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("ko-KR", { weekday: "short" });
}

// ── 단일 날 상세 뷰 ────────────────────────────────────────────────────────
function DetailView({ data }: { data: DailyFortune }) {
  const meta = FORECAST_LEVEL_META[data.level] ?? FORECAST_LEVEL_META["평범한 날"];

  return (
    <div className="space-y-4">
      {/* 일진 + 레벨 + 날씨 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-heading font-semibold text-[var(--color-ink)]">{data.day_pillar}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-ivory-warm)] text-[var(--color-ink-muted)] border border-[var(--color-border-light)]">
            {data.day_element}
          </span>
          {data.solar_term && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              🌿 {data.solar_term}
            </span>
          )}
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

      {/* 시간별 운세 인디케이터 */}
      {data.yongshin && data.weather?.hours && data.weather.hours.length > 0 && (
        <HourlyFortuneBar data={data.weather.hours} yongshin={data.yongshin} />
      )}
    </div>
  );
}

// ── 주간 컴팩트 뷰 ───────────────────────────────────────────────────────────
function WeeklyView({ forecast }: { forecast: DailyFortune[] }) {
  return (
    <div className="space-y-2">
      {forecast.map((day, i) => {
        const meta = FORECAST_LEVEL_META[day.level] ?? FORECAST_LEVEL_META["평범한 날"];
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
  const streak = useStreak(forecast?.[0]?.date ?? new Date().toISOString().split("T")[0]);

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
      {/* 스트릭 카운터 */}
      {streak >= 2 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <span>🔥</span>
          <span className="font-medium">{streak}일 연속 방문 중</span>
          {streak >= 7 && <span className="text-amber-500">— 까치가 기뻐합니다!</span>}
        </div>
      )}

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
