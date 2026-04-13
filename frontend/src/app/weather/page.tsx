"use client";

import { useEffect, useState } from "react";
import { detectLocation } from "@/lib/location";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface HourWeather {
  hour: string;
  temperature: number;
  condition: string;
  element: string;
}

interface DayWeather {
  date: string;
  temperature: number;
  temp_max: number;
  temp_min: number;
  weather_code: number;
  element: string;
  condition: string;
  hours: HourWeather[];
}

const ELEMENT_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  火: { label: "화(火)", color: "text-orange-500", bg: "bg-orange-50 border-orange-200", emoji: "☀️" },
  水: { label: "수(水)", color: "text-blue-500", bg: "bg-blue-50 border-blue-200", emoji: "🌧️" },
  木: { label: "목(木)", color: "text-green-600", bg: "bg-green-50 border-green-200", emoji: "💨" },
  金: { label: "금(金)", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", emoji: "☁️" },
  土: { label: "토(土)", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", emoji: "🌤️" },
};

function dayLabel(dateStr: string, idx: number): string {
  if (idx === 0) return "오늘";
  if (idx === 1) return "내일";
  if (idx === 2) return "모레";
  const d = new Date(dateStr);
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()] + "요일";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

export default function WeatherPage() {
  const [city, setCity] = useState("Seoul");
  const [displayCity, setDisplayCity] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [days, setDays] = useState<DayWeather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setDisplayCity("현재 위치");
        },
        () => {
          // GPS 거부/실패 → ipapi.co fallback
          detectLocation().then((loc) => {
            if (loc?.city) { setCity(loc.city); setDisplayCity(loc.city); }
          });
        },
        { timeout: 5000 }
      );
    } else {
      detectLocation().then((loc) => {
        if (loc?.city) { setCity(loc.city); setDisplayCity(loc.city); }
      });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ days: "10" });
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lon", String(coords.lon));
    } else {
      params.set("city", city);
    }
    fetch(`${API_URL}/weather?${params}`)
      .then((r) => r.json())
      .then((data) => setDays(Array.isArray(data) ? data : (data.days ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, coords]);

  const meta = (el: string) => ELEMENT_META[el] ?? ELEMENT_META["土"];

  return (
    <main className="min-h-screen py-8 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">

        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">날씨 기운</h1>
        </header>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-gold-light)] border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && days.length > 0 && (() => {
          const today = days[0];
          const tm = meta(today.element);
          const conditionText = today.condition.replace(/\s*\d+\.?\d*°C$/, "");
          return (
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm py-8 px-6 flex flex-col items-center gap-2 text-center">
              {displayCity && (
                <p className="text-sm text-[var(--color-ink-muted)]">{displayCity}</p>
              )}
              <div className="text-6xl mt-1">{tm.emoji}</div>
              <div className="text-7xl font-thin text-[var(--color-ink)] leading-none mt-1">
                {Math.round(today.temperature)}°
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-base font-semibold ${tm.color}`}>{tm.label}</span>
                <span className="text-sm text-[var(--color-ink-muted)]">{conditionText}</span>
              </div>
              <p className="text-sm text-[var(--color-ink-faint)]">
                최저 {Math.round(today.temp_min)}° · 최고 {Math.round(today.temp_max)}°
              </p>
            </div>
          );
        })()}

        {/* 시간대별 가로 슬라이드 */}
        {!loading && days.length > 0 && (() => {
          type WeatherSlot = { type: "weather"; label: string; sublabel?: string; hour: HourWeather };
          const slots: WeatherSlot[] = [];
          const nowHour = new Date().getHours();
          let lastAmPm: "am" | "pm" | null = null;
          let nextPrefix: string | null = null;

          const pushHour = (h: HourWeather) => {
            const hr = parseInt(h.hour);
            const amPm = hr < 12 ? "am" : "pm";
            let prefix = nextPrefix;
            nextPrefix = null;
            if (amPm !== lastAmPm) {
              const amPmLabel = amPm === "am" ? "오전" : "오후";
              prefix = prefix ? `${prefix} ${amPmLabel}` : amPmLabel;
              lastAmPm = amPm;
            }
            const label = prefix ? `${prefix} ${h.hour}` : h.hour;
            slots.push({ type: "weather", label, hour: h });
          };

          // 오늘 — 현재 시각 이후
          days[0].hours.filter((h) => parseInt(h.hour) >= nowHour).forEach(pushHour);

          // 내일
          if (days[1]) {
            nextPrefix = "내일";
            lastAmPm = null;
            days[1].hours.forEach(pushHour);
          }

          // 모레
          if (days[2]) {
            nextPrefix = "모레";
            lastAmPm = null;
            days[2].hours.forEach(pushHour);
          }
          return (
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-3">시간별 예보</p>
              <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                <div className="flex gap-1 w-max">
                  {slots.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 px-2.5 py-2 min-w-[56px]">
                      <span className="text-[11px] text-[var(--color-ink-faint)] whitespace-nowrap">{s.label}</span>
                      <span className="text-2xl">{meta(s.hour.element).emoji}</span>
                      <span className="text-sm font-medium text-[var(--color-ink)]">{Math.round(s.hour.temperature)}°</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {!loading && days.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-3">일별 예보</p>
            <div className="divide-y divide-[var(--color-border-light)]">
              {days.map((day, idx) => {
                const m = meta(day.element);
                const conditionText = day.condition.replace(/\s*\d+\.?\d*°C$/, "");
                return (
                  <div key={day.date} className="flex items-center gap-3 py-3">
                    <div className="w-14">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">{dayLabel(day.date, idx)}</p>
                      <p className="text-[11px] text-[var(--color-ink-faint)]">{formatDate(day.date)}</p>
                    </div>
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium ${m.color}`}>{m.label}</span>
                      <span className="text-xs text-[var(--color-ink-muted)] ml-1.5">{conditionText}</span>
                    </div>
                    <div className="text-right text-sm">
                      <span className="text-[var(--color-ink-muted)]">{Math.round(day.temp_min)}°</span>
                      <span className="mx-1 text-[var(--color-border)]">·</span>
                      <span className="font-semibold text-[var(--color-ink)]">{Math.round(day.temp_max)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
