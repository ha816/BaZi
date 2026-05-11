"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { detectLocation } from "@/lib/location";
import { listProfiles, getDailyFortune } from "@/lib/api";
import KkachiTip from "@/components/KkachiTip";
import ScoreBar from "@/components/ScoreBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { ELEMENT_META, FORECAST_LEVEL_META } from "@/lib/elementColors";
import type { DailyFortune, Profile } from "@/types/analysis";

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
  element: string;
  condition: string;
  hours: HourWeather[];
}

const DOMAIN_LABELS: Record<string, string> = {
  직업운: "직업", 재물운: "재물", 건강운: "건강", 애정운: "애정", 학업운: "학업",
};

const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

function dayLabel(dateStr: string, idx: number) {
  if (idx === 0) return "오늘";
  if (idx === 1) return "내일";
  const d = new Date(dateStr);
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
}

export default function TodayPage() {
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [days, setDays] = useState<DayWeather[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const memberId = localStorage.getItem(MEMBER_ID_KEY);
    if (memberId) {
      setLoggedIn(true);
      listProfiles(memberId)
        .then((profiles) => {
          const self = profiles.find((p) => p.is_self) ?? profiles[0] ?? null;
          setProfile(self);
          if (self) return getDailyFortune(memberId, self.id);
        })
        .then((f) => { if (f) setFortune(f); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchWeather = (params: URLSearchParams) => {
      fetch(`${API_URL}/weather?${params}&days=7`)
        .then((r) => r.json())
        .then((data) => setDays(Array.isArray(data) ? data : (data.days ?? [])))
        .catch(() => {});
    };

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = new URLSearchParams({ lat: String(pos.coords.latitude), lon: String(pos.coords.longitude) });
          fetchWeather(p);
        },
        () => detectLocation().then((loc) => {
          const p = new URLSearchParams({ city: loc?.city ?? "Seoul" });
          fetchWeather(p);
        }),
        { timeout: 5000 }
      );
    } else {
      detectLocation().then((loc) => {
        fetchWeather(new URLSearchParams({ city: loc?.city ?? "Seoul" }));
      });
    }
  }, []);

  const meta = (el: string) => ELEMENT_META[el] ?? ELEMENT_META["土"];
  const today = days[0] ?? null;
  const yongshin = fortune?.yongshin ?? null;
  const levelMeta = fortune ? (FORECAST_LEVEL_META[fortune.level] ?? FORECAST_LEVEL_META["평범한 날"]) : null;

  const nowHour = new Date().getHours();
  const hourSlots = [
    ...(today?.hours.filter((h) => parseInt(h.hour) >= nowHour) ?? []).map((h) => ({ day: "오늘", h })),
    ...(days[1]?.hours ?? []).map((h) => ({ day: "내일", h })),
    ...(days[2]?.hours ?? []).map((h) => ({ day: "모레", h })),
  ];

  return (
    <main className="min-h-screen py-6 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">

        {/* 헤더 */}
        <header>
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">오늘</h1>
          {fortune?.day_pillar && (
            <p className="text-sm text-[var(--color-ink-faint)] mt-0.5">일진 {fortune.day_pillar}</p>
          )}
        </header>

        {loading && <LoadingSpinner />}

        {/* 비로그인 */}
        {!loading && !loggedIn && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-8 flex flex-col items-center gap-4 text-center">
            <p className="text-5xl">🪄</p>
            <p className="text-base font-semibold text-[var(--color-ink)]">로그인하면 나만의 오늘 운세를 볼 수 있어요</p>
            <Link href="/join" className="px-6 py-2.5 rounded-full bg-[var(--color-gold)] text-white text-sm font-semibold">
              로그인 / 가입하기
            </Link>
          </div>
        )}

        {/* 핵심 요약 — 운세 + 날씨 통합 카드 */}
        {!loading && (fortune || today) && (() => {
          const tm = today ? meta(today.element) : null;
          const conditionText = today?.condition.replace(/\s*\d+\.?\d*°C$/, "") ?? "";
          return (
            <div
              className="rounded-2xl border shadow-sm px-6 py-5 flex items-center gap-4"
              style={tm ? { backgroundColor: `color-mix(in srgb, var(--color-card) 70%, transparent)` } : {}}
            >
              {/* 날씨 오행 이모지 */}
              {tm && (
                <div className={`shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 ${tm.bg}`}>
                  <span className="text-3xl leading-none">{tm.emoji}</span>
                  <span className={`text-[10px] font-bold ${tm.color}`}>{tm.label}</span>
                </div>
              )}

              {/* 운세 점수 */}
              <div className="flex-1 min-w-0">
                {fortune && levelMeta ? (
                  <>
                    <p className="text-[10px] text-[var(--color-ink-faint)] mb-0.5">{profile?.name ?? "오늘"} 운세</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-5xl font-thin text-[var(--color-ink)] leading-none">{fortune.total_score}</span>
                      <span className={`text-xs font-bold border px-2 py-0.5 rounded-full ${levelMeta.color}`}>{fortune.level}</span>
                    </div>
                    {fortune.day_pillar && (
                      <p className="text-[10px] text-[var(--color-ink-faint)] mt-1">일진 {fortune.day_pillar}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-[var(--color-ink-faint)]">사주 등록 후 운세를 확인해요</p>
                    <Link href="/profile" className="text-[10px] text-[var(--color-gold)] font-semibold mt-1 inline-block">등록하기 →</Link>
                  </>
                )}
              </div>

              {/* 기온 */}
              {today && (
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-thin text-[var(--color-ink)] leading-none">{Math.round(today.temperature)}°</p>
                  <p className="text-[10px] text-[var(--color-ink-faint)] mt-1 whitespace-nowrap">
                    {today.temp_min != null ? Math.round(today.temp_min) : "--"}° · {today.temp_max != null ? Math.round(today.temp_max) : "--"}°
                  </p>
                  <p className="text-[10px] text-[var(--color-ink-faint)] truncate max-w-[72px]">{conditionText}</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* KkachiTip */}
        {fortune?.description && <KkachiTip>{fortune.description}</KkachiTip>}

        {/* 시간별 예보 — 용신 하이라이트 */}
        {hourSlots.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-3">시간별 기운</p>
            <div className="overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-1 w-max">
                {hourSlots.map(({ day, h }, i) => {
                  const isFirstOfDay = i === 0 || hourSlots[i - 1].day !== day;
                  const rel = yongshin
                    ? h.element === yongshin ? "match"
                    : GENERATES[h.element] === yongshin ? "generates"
                    : "neutral"
                    : "neutral";
                  const highlight = rel === "match"
                    ? "bg-emerald-50 ring-1 ring-emerald-300 rounded-xl"
                    : rel === "generates"
                    ? "bg-amber-50 ring-1 ring-amber-200 rounded-xl"
                    : "";
                  return (
                    <div key={i} className={`flex flex-col items-center gap-1.5 px-2.5 py-2 min-w-[52px] ${highlight}`}>
                      <span className="text-[10px] font-semibold text-[var(--color-gold-light)] leading-none h-3">
                        {isFirstOfDay ? day : ""}
                      </span>
                      <span className="text-[11px] text-[var(--color-ink-faint)] leading-none">{h.hour}</span>
                      <span className="text-2xl">{meta(h.element).emoji}</span>
                      <span className="text-sm font-medium text-[var(--color-ink)]">{Math.round(h.temperature)}°</span>
                      {rel === "match" && <span className="text-[9px] font-bold text-emerald-600 leading-none">최고</span>}
                      {rel === "generates" && <span className="text-[9px] font-bold text-amber-600 leading-none">좋아요</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 영역별 운세 */}
        {fortune && Object.keys(fortune.domain_scores).length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 pt-4 pb-5 space-y-3">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)]">영역별 운세</p>
            {Object.entries(fortune.domain_scores).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-10 text-xs text-[var(--color-ink-muted)] shrink-0">{DOMAIN_LABELS[key] ?? key}</span>
                <ScoreBar score={val.score} />
                <span className="text-xs font-semibold text-[var(--color-ink)] w-6 text-right">{val.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* 7일 예보 */}
        {days.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">7일 예보</p>
            <div className="divide-y divide-[var(--color-border-light)]">
              {days.slice(0, 7).map((day, idx) => {
                const m = meta(day.element);
                const conditionText = day.condition.replace(/\s*\d+\.?\d*°C$/, "");
                return (
                  <div key={day.date} className="flex items-center gap-3 py-2.5">
                    <span className="w-10 text-sm font-semibold text-[var(--color-ink)] shrink-0">{dayLabel(day.date, idx)}</span>
                    <span className="text-xl shrink-0">{m.emoji}</span>
                    <span className="text-xs text-[var(--color-ink-muted)] flex-1 truncate">{conditionText}</span>
                    <span className={`text-xs font-semibold ${m.color} shrink-0`}>{m.label}</span>
                    <span className="text-xs text-[var(--color-ink-faint)] shrink-0">
                      {day.temp_min != null ? Math.round(day.temp_min) : "--"}°·{day.temp_max != null ? Math.round(day.temp_max) : "--"}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 오늘 조언 */}
        {(fortune?.tips?.length ?? 0) > 0 && (
          <KkachiTip>{fortune!.tips.join("\n")}</KkachiTip>
        )}

        {/* 사주 분석 CTA */}
        {loggedIn && fortune && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink)]">왜 이 점수가 나왔을까요?</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">사주 구조와 오늘 일진의 관계를 심층 분석으로 확인해보세요</p>
            </div>
            <Link href="/analysis" className="shrink-0 px-4 py-2 rounded-full bg-[var(--color-gold)] text-white text-xs font-semibold whitespace-nowrap">
              사주 분석하기
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
