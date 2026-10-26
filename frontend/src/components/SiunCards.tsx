// 시운 카드 두 장 — "이 시간대가 좋아요"(시간별 기운) · "주간 시운". 시운 화면(오늘 탭)과 홈(오늘의 나 바로 아래, 2026-10-26)이 같이 쓴다

import { ELEMENT_META, FORECAST_LEVEL_META } from "@/lib/elementColors";
import type { DailyWeather, HourlyWeather } from "@/types/analysis";

export type SiunDay = { date: string; total_score: number; level: string; weather: DailyWeather | null };

const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const DAY_LABELS = ["오늘", "내일", "모레", "글피"];
const CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-3.5";
const TITLE = "font-heading text-[15px] font-bold text-[var(--color-ink)]";
// embedded: 다른 카드(홈 오늘의 나) 안에 넣을 때 — 테두리·제목 없이 (2026-10-26)

const elMeta = (el: string) => ELEMENT_META[el] ?? ELEMENT_META["土"];

/** days[0]이 오늘 — 오늘은 지금 2시간 전부터, 이어서 count일까지(기본 글피, 홈은 모레 — 2026-10-26). 용신과 같은 오행 = 최고, 용신을 생하는 오행 = 좋음 */
export function HourlyLuckCard({ days, yongshin, count = DAY_LABELS.length, embedded = false, className = "" }: { days: SiunDay[]; yongshin?: string; count?: number; embedded?: boolean; className?: string }) {
  const nowHour = new Date().getHours();
  const hours = days.slice(0, Math.min(count, DAY_LABELS.length)).flatMap((d, i) =>
    (d.weather?.hours ?? [])
      .filter((h: HourlyWeather) => i > 0 || parseInt(h.hour.replace(/[^0-9]/g, "")) >= Math.max(0, nowHour - 2))
      .map((h) => ({ ...h, dateLabel: DAY_LABELS[i] })),
  );
  const relOf = (el: string) => (!yongshin ? "neutral" : el === yongshin ? "match" : GENERATES[el] === yongshin ? "generates" : "neutral");
  if (hours.length === 0) return null;

  return (
    <div className={`${embedded ? "" : CARD} ${className}`}>
      <div className={`flex items-center ${embedded ? "justify-end mb-1" : "justify-between mb-3"}`}>
        {!embedded && <h2 className={TITLE}>이 시간대가 좋아요</h2>}
        {yongshin && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-600 font-semibold">최고 = {yongshin}</span>
            <span className="text-[10px] text-amber-600 font-semibold">좋음 = {GENERATES[yongshin] || "상생"}</span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto -mx-1 px-1 py-1 no-scrollbar">
        <div className="flex gap-1 w-max items-end">
          {hours.map((h, i) => {
            const rel = relOf(h.element);
            const highlight = rel === "match"
              ? "bg-emerald-50 ring-1 ring-emerald-300 rounded-xl"
              : rel === "generates" ? "bg-amber-50 ring-1 ring-amber-200 rounded-xl" : "";
            const showDate = i === 0 || h.dateLabel !== hours[i - 1].dateLabel;
            return (
              <div key={i} className="flex flex-col gap-1">
                {showDate && <span className="text-[10px] font-bold text-[var(--color-gold)] ml-1 mb-0.5 w-full text-center">{h.dateLabel}</span>}
                <div className={`flex flex-col items-center gap-1.5 px-2.5 py-2 min-w-[52px] ${highlight}`}>
                  <span className="text-[11px] text-[var(--color-ink-faint)] leading-none">{h.hour}</span>
                  <span className="text-2xl">{elMeta(h.element).emoji}</span>
                  <span className={`text-[11px] font-bold leading-none ${elMeta(h.element).color}`}>{h.element}</span>
                  <span className="text-sm font-medium text-[var(--color-ink)]">{Math.round(h.temperature)}°</span>
                  {rel === "match" && <span className="text-[9px] font-bold text-emerald-600 leading-none">최고</span>}
                  {rel === "generates" && <span className="text-[9px] font-bold text-amber-600 leading-none">좋음</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 오늘부터 count일(기본 7, 홈은 3 — 2026-10-26) — 날씨 오행·운세 점수·레벨 아이콘. 날씨 없는 날은 건너뛴다 */
export function WeeklySiunCard({ days, count = 7, embedded = false, className = "" }: { days: SiunDay[]; count?: number; embedded?: boolean; className?: string }) {
  const rows = days.slice(0, count).filter((d) => d.weather);
  if (rows.length === 0) return null;

  return (
    <div className={`${embedded ? "" : `${CARD} pb-1`} ${className}`}>
      {!embedded && <h2 className={`${TITLE} mb-1`}>주간 시운</h2>}
      <div className="divide-y divide-[var(--color-border-light)]">
        {rows.map((day) => {
          const w = day.weather!;
          const m = elMeta(w.element);
          const d = new Date(day.date);
          const lMeta = FORECAST_LEVEL_META[day.level] ?? FORECAST_LEVEL_META["평범한 날"];
          return (
            <div key={day.date} className="flex items-center gap-2 py-2.5">
              <span className="w-9 text-[11px] font-bold text-[var(--color-ink-faint)] shrink-0">{d.getMonth() + 1}/{d.getDate()}</span>
              <span className="text-xl shrink-0">{m.emoji}</span>
              <div className="flex flex-1 items-center gap-1.5 min-w-0">
                <span className="text-xs text-[var(--color-ink-muted)] truncate">{w.condition.replace(/\s*\d+\.?\d*°C$/, "")}</span>
                <span className={`text-xs font-semibold ${m.color} shrink-0`}>{m.label}</span>
                <span className="text-xs text-[var(--color-ink-faint)] shrink-0">{Math.round(w.temperature)}°</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] text-[var(--color-ink-faint)]">운세 점수</span>
                <span className="text-xs font-black text-[var(--color-ink)]">{day.total_score}</span>
              </div>
              <span className="text-base shrink-0 w-5 text-right">{lMeta.icon}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
