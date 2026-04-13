"use client";

import { useEffect, useState } from "react";
import { detectLocation } from "@/lib/location";
import { listProfiles, getDailyFortune } from "@/lib/api";
import KkachiTip from "@/components/KkachiTip";

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

const ELEMENT_TIP: Record<string, string> = {
  火: "오늘은 ☀️ 火 기운이 가득한 날이에요. 태양처럼 강렬한 에너지가 넘치니 새로운 도전이나 적극적인 행동을 취하기에 딱 좋은 날입니다. 열정을 쏟을 일이 있다면 오늘 움직여 보세요!",
  水: "오늘은 🌧️ 水 기운이 흐르는 날이에요. 물처럼 유연하게 변화에 적응하는 힘이 강해집니다. 깊이 생각하고 내면을 들여다보기 좋은 날이니, 무리하게 밀어붙이기보다 흐름에 맡겨보세요.",
  木: "오늘은 💨 木 기운이 퍼지는 날이에요. 바람처럼 확산되는 성장의 기운이 가득합니다. 창의적인 아이디어를 펼치거나 새로운 시작을 선언하기에 좋은 날이에요.",
  金: "오늘은 ☁️ 金 기운이 감도는 날이에요. 수렴하고 정리하는 힘이 강해집니다. 미뤄뒀던 마무리 작업이나 중요한 결단을 내리기에 좋은 날이에요. 단단하게 다잡아 보세요.",
  土: "오늘은 🌤️ 土 기운이 감싸는 날이에요. 안정적이고 균형 잡힌 에너지가 흐릅니다. 무리하게 앞서가기보다 기반을 다지고 꾸준히 쌓아가는 하루로 만들어 보세요.",
};

const ELEMENT_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  火: { label: "화(火)", color: "text-orange-500", bg: "bg-orange-50 border-orange-200", emoji: "☀️" },
  水: { label: "수(水)", color: "text-blue-500", bg: "bg-blue-50 border-blue-200", emoji: "🌧️" },
  木: { label: "목(木)", color: "text-green-600", bg: "bg-green-50 border-green-200", emoji: "💨" },
  金: { label: "금(金)", color: "text-gray-500", bg: "bg-gray-50 border-gray-200", emoji: "☁️" },
  土: { label: "토(土)", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", emoji: "🌤️" },
};

function dayLabel(dateStr: string, idx: number): string {
  if (idx === 0) return "오늘";
  const d = new Date(dateStr);
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
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
  const [loggedIn, setLoggedIn] = useState(false);
  const [yongshin, setYongshin] = useState<string | null>(null);

  useEffect(() => {
    const memberId = localStorage.getItem("kkachi_member_id");
    if (!memberId) return;
    setLoggedIn(true);
    listProfiles(memberId)
      .then((profiles) => {
        const self = profiles.find((p) => p.is_self) ?? profiles[0];
        if (!self) return;
        return getDailyFortune(memberId, self.id);
      })
      .then((f) => { if (f?.yongshin) setYongshin(f.yongshin); })
      .catch(() => {});
  }, []);

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
    const params = new URLSearchParams({ days: "14" });
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
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm py-8 px-4 flex flex-col items-center gap-2 text-center">
                <div className="text-6xl mt-1">{tm.emoji}</div>
                <div className="text-7xl font-thin text-[var(--color-ink)] leading-none mt-1">
                  {Math.round(today.temperature)}°
                </div>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">{conditionText}</p>
                <p className="text-sm text-[var(--color-ink-faint)]">
                  최저 {today.temp_min != null ? Math.round(today.temp_min) : "--"}° · 최고 {today.temp_max != null ? Math.round(today.temp_max) : "--"}°
                </p>
              </div>
              <div className={`rounded-2xl border shadow-sm px-5 flex flex-col items-center justify-center gap-1 ${tm.bg}`}>
                <span className={`text-5xl font-bold ${tm.color}`}>{today.element}</span>
                <span className={`text-xs font-semibold ${tm.color} opacity-80`}>{tm.label}</span>
              </div>
            </div>
          );
        })()}

        {/* 오행 기운 KkachiTip — 로그인 시만 표시 */}
        {!loading && loggedIn && days.length > 0 && (
          <KkachiTip text={ELEMENT_TIP[days[0].element] ?? ELEMENT_TIP["土"]} />
        )}

        {/* 시간대별 가로 슬라이드 */}
        {!loading && days.length > 0 && (() => {
          type WeatherSlot = { type: "weather"; dayLabel: string | null; timeLabel: string; hour: HourWeather };
          const slots: WeatherSlot[] = [];
          const nowHour = new Date().getHours();
          let lastAmPm: "am" | "pm" | null = null;
          let nextPrefix: string | null = null;

          const pushHour = (h: HourWeather) => {
            const hr = parseInt(h.hour);
            const amPm = hr < 12 ? "am" : "pm";
            const dayLbl = nextPrefix ?? null;
            nextPrefix = null;
            let timeLabel: string;
            if (amPm !== lastAmPm) {
              timeLabel = `${amPm === "am" ? "오전" : "오후"} ${h.hour}`;
              lastAmPm = amPm;
            } else {
              timeLabel = h.hour;
            }
            slots.push({ type: "weather", dayLabel: dayLbl, timeLabel, hour: h });
          };

          // 오늘 — 현재 시각 이후
          nextPrefix = "오늘";
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

          // 사흘
          if (days[3]) {
            nextPrefix = "사흘";
            lastAmPm = null;
            days[3].hours.forEach(pushHour);
          }
          return (
            <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-3">시간별 예보</p>
              <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                <div className="flex gap-1 w-max">
                  {slots.map((s, i) => {
                    const el = s.hour.element;
                    const GENERATES: Record<string, string> = { 木:"火", 火:"土", 土:"金", 金:"水", 水:"木" };
                    const rel = yongshin
                      ? el === yongshin ? "match" : GENERATES[el] === yongshin ? "generates" : "neutral"
                      : "neutral";
                    const highlight = rel === "match" ? "bg-emerald-50 ring-1 ring-emerald-300 rounded-xl" : rel === "generates" ? "bg-amber-50 ring-1 ring-amber-200 rounded-xl" : "";
                    return (
                      <div key={i} className={`flex flex-col items-center gap-1.5 px-2.5 py-2 min-w-[56px] ${highlight}`}>
                        <div className="h-8 flex flex-col items-center justify-end gap-0.5">
                          {s.dayLabel && (
                            <span className="text-[10px] font-semibold text-[var(--color-gold-light)] whitespace-nowrap leading-none">{s.dayLabel}</span>
                          )}
                          <span className="text-[11px] text-[var(--color-ink-faint)] whitespace-nowrap leading-none">{s.timeLabel}</span>
                        </div>
                        <span className="text-2xl">{meta(el).emoji}</span>
                        <span className="text-sm font-medium text-[var(--color-ink)]">{Math.round(s.hour.temperature)}°</span>
                        {rel === "match" && <span className="text-[9px] font-bold text-emerald-600 leading-none">최고</span>}
                        {rel === "generates" && <span className="text-[9px] font-bold text-amber-600 leading-none">좋아요</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TODO: 광고 영역 — 시간별 예보 하단 */}

        {!loading && days.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-3">일별 예보</p>
            <div className="divide-y divide-[var(--color-border-light)]">
              {days.slice(0, 10).map((day, idx) => {
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
                      <span className="text-xs text-[var(--color-ink-muted)]">{conditionText}</span>
                      <span className="text-xs text-[var(--color-ink-faint)] ml-1.5">
                        <span className="text-[10px]">최저 </span>{day.temp_min != null ? Math.round(day.temp_min) : "--"}°
                        <span className="mx-0.5 text-[var(--color-border)]">·</span>
                        <span className="text-[10px]">최고 </span>{day.temp_max != null ? Math.round(day.temp_max) : "--"}°
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${m.color} w-10 text-right shrink-0`}>{m.label}</span>
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
