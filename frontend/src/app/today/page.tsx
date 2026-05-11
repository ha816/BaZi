"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProfiles, getForecast } from "@/lib/api";
import { DetailView, WeeklyView } from "@/components/DailyFortune";
import ScoreBar from "@/components/ScoreBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { ELEMENT_META, FORECAST_LEVEL_META, getElementInfo } from "@/lib/elementColors";
import type { DailyFortune, Profile } from "@/types/analysis";

const DOMAIN_LABELS: Record<string, string> = {
  직업운: "직업운", 재물운: "재물운", 건강운: "건강운", 애정운: "연애운", 학업운: "학업운",
};

const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

function dayLabel(dateStr: string, idx: number) {
  if (idx === 0) return "오늘";
  if (idx === 1) return "내일";
  const d = new Date(dateStr);
  return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
}

export default function TodayPage() {
  const [forecast, setForecast] = useState<DailyFortune[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDomains, setShowDomains] = useState(false);
  const [activeTab, setActiveTab] = useState<"오늘" | "내일" | "주간">("오늘");

  useEffect(() => {
    const memberId = localStorage.getItem(MEMBER_ID_KEY);
    if (memberId) {
      setLoggedIn(true);
      listProfiles(memberId)
        .then((profiles) => {
          const self = profiles.find((p) => p.is_self) ?? profiles[0] ?? null;
          setProfile(self);
          if (self) return getForecast(memberId, self.id, 7);
        })
        .then((f) => { if (f) setForecast(f); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fortune = forecast[0] ?? null;
  const elMeta = (el: string) => ELEMENT_META[el] ?? ELEMENT_META["土"];
  const todayWeather = fortune?.weather ?? null;
  const yongshin = fortune?.yongshin ?? null;
  const levelMeta = fortune ? (FORECAST_LEVEL_META[fortune.level] ?? FORECAST_LEVEL_META["평범한 날"]) : null;

  const nowHour = new Date().getHours();
  const hourSlots = [
    ...(todayWeather?.hours?.filter((h) => parseInt(h.hour) >= nowHour) ?? []).map((h) => ({ day: "오늘", h })),
    ...(forecast[1]?.weather?.hours ?? []).map((h) => ({ day: "내일", h })),
    ...(forecast[2]?.weather?.hours ?? []).map((h) => ({ day: "모레", h })),
  ];

  return (
    <main className="min-h-screen py-6 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">

        {/* 헤더 */}
        <header>
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">시운(時運)</h1>
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

        {/* 탭 바 */}
        {!loading && loggedIn && (
          <div className="flex gap-0.5 p-0.5 bg-[var(--color-parchment)] rounded-lg w-fit">
            {(["오늘", "내일", "주간"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === t
                    ? "bg-white text-[var(--color-ink)] shadow-sm"
                    : "text-[var(--color-ink-faint)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* ── 오늘 탭 ── */}
        {!loading && loggedIn && activeTab === "오늘" && fortune && (() => {
          const tm = todayWeather ? elMeta(todayWeather.element) : null;
          const conditionText = todayWeather?.condition.replace(/\s*\d+\.?\d*°C$/, "") ?? "";
          return (
            <>
              {/* 핵심 요약 카드 — 점수 + 날씨 */}
              <div
                className="rounded-2xl border shadow-sm px-6 py-5 space-y-4"
                style={tm ? { backgroundColor: `color-mix(in srgb, var(--color-card) 70%, transparent)` } : {}}
              >
                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    {levelMeta && (
                      <>
                        <span className={`text-xs font-bold border px-2 py-0.5 rounded-full ${levelMeta.color}`}>{fortune.level}</span>
                        <p className="font-heading text-5xl font-thin text-[var(--color-ink)] leading-none mt-1">{fortune.total_score}</p>
                        {fortune.day_pillar && (
                          <p className="text-[10px] text-[var(--color-ink-faint)] mt-1">일진 {fortune.day_pillar}</p>
                        )}
                      </>
                    )}
                  </div>
                  {todayWeather && (
                    <div className="flex items-center gap-3 px-4">
                      {tm && (
                        <div className={`w-24 h-24 rounded-2xl flex flex-col items-center justify-center gap-1 ${tm.bg}`}>
                          <span className="text-4xl leading-none">{tm.emoji}</span>
                          <span className={`text-[11px] font-bold ${tm.color}`}>{tm.label}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-3xl font-thin text-[var(--color-ink)] leading-none">{Math.round(todayWeather.temperature)}°</p>
                        <p className="text-[10px] text-[var(--color-ink-faint)] mt-1 whitespace-nowrap">
                          {todayWeather.temp_min != null ? Math.round(todayWeather.temp_min) : "--"}° · {todayWeather.temp_max != null ? Math.round(todayWeather.temp_max) : "--"}°
                        </p>
                        <p className="text-[10px] text-[var(--color-ink-faint)] truncate max-w-[72px]">{conditionText}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 설명 + 영역별 점수 토글 */}
                <div className="border-t border-[var(--color-border-light)] pt-4 space-y-3">
                  {fortune.description && (
                    <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{fortune.description}</p>
                  )}
                  {Object.keys(fortune.domain_scores).length > 0 && (
                    <>
                      {/* 대운/세운/월운/일운 그리드 */}
                      {(() => {
                        const gridCards = [
                          fortune.daeun_ganji ? { label: "대운", ganji: fortune.daeun_ganji, highlight: fortune.yongshin_in_daeun ?? false } : null,
                          fortune.seun_ganji  ? { label: `세운(${new Date().getFullYear()}년)`, ganji: fortune.seun_ganji, highlight: fortune.yongshin_in_seun ?? false } : null,
                          fortune.wol_ganji   ? { label: `월운(${new Date().getMonth() + 1}월)`, ganji: fortune.wol_ganji, highlight: fortune.yongshin_in_wol ?? false } : null,
                          { label: "일운(오늘)", ganji: fortune.day_pillar, highlight: fortune.yongshin_in_il ?? false },
                        ].filter(Boolean) as { label: string; ganji: string; highlight: boolean }[];
                        return (
                          <div className="grid grid-cols-4 gap-2">
                            {gridCards.map(({ label, ganji, highlight }) => {
                              const stemEl = getElementInfo(ganji[0] ?? "");
                              return (
                                <div
                                  key={label}
                                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 border ${highlight ? "border-[var(--color-gold)] bg-[var(--color-gold-light)]/10" : "border-[var(--color-border-light)]"}`}
                                >
                                  <span className="text-[9px] text-[var(--color-ink-faint)] leading-none text-center">{label}</span>
                                  <span className="font-heading text-lg font-bold leading-none" style={{ color: stemEl.color }}>{ganji[0]}</span>
                                  <span className="font-heading text-lg leading-none text-[var(--color-ink-muted)]">{ganji[1]}</span>
                                  {highlight && <span className="text-[8px] font-bold text-[var(--color-gold)] leading-none">용신</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => setShowDomains((v) => !v)}
                        className="text-[11px] font-semibold text-[var(--color-gold)] flex items-center gap-1"
                      >
                        {showDomains ? "접기 ▲" : "영역별 행운 점수 보기 ▼"}
                      </button>
                      {showDomains && (
                        <div className="space-y-2 pt-1">
                          {Object.entries(fortune.domain_scores)
                            .sort(([, a], [, b]) => b.score - a.score)
                            .map(([key, val]) => (
                              <div key={key} className="flex items-center gap-3">
                                <span className="w-14 text-xs text-[var(--color-ink-muted)] shrink-0">{DOMAIN_LABELS[key] ?? key}</span>
                                <ScoreBar score={val.score} />
                                <span className="text-xs font-semibold text-[var(--color-ink)] w-6 text-right">{val.score}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 상세 운세 — DetailView */}
              <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-5">
                <DetailView data={fortune} />
              </div>

              {/* 시간별 기운 */}
              {hourSlots.length > 0 && (
                <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[var(--color-ink-muted)]">시간별 기운</p>
                    {yongshin && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-semibold">최고 = 용신({yongshin})</span>
                        <span className="text-[10px] text-amber-600 font-semibold">좋아요 = 용신 生</span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto -mx-1 px-1 py-1" style={{ scrollbarWidth: "none" }}>
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
                            <span className="text-2xl">{elMeta(h.element).emoji}</span>
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

              {/* 7일 예보 */}
              {forecast.length > 0 && (
                <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-1">
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">7일 예보</p>
                  <div className="divide-y divide-[var(--color-border-light)]">
                    {forecast.slice(0, 7).map((day, idx) => {
                      const w = day.weather;
                      if (!w) return null;
                      const m = elMeta(w.element);
                      const ct = w.condition.replace(/\s*\d+\.?\d*°C$/, "");
                      return (
                        <div key={day.date} className="flex items-center gap-3 py-2.5">
                          <span className="w-10 text-sm font-semibold text-[var(--color-ink)] shrink-0">{dayLabel(day.date, idx)}</span>
                          <span className="text-xl shrink-0">{m.emoji}</span>
                          <span className="text-xs text-[var(--color-ink-muted)] flex-1 truncate">{ct}</span>
                          <span className={`text-xs font-semibold ${m.color} shrink-0`}>{m.label}</span>
                          <span className="text-xs text-[var(--color-ink-faint)] shrink-0">
                            {w.temp_min != null ? Math.round(w.temp_min) : "--"}°·{w.temp_max != null ? Math.round(w.temp_max) : "--"}°
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">왜 이 점수가 나왔을까요?</p>
                  <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">사주 구조와 오늘 일진의 관계를 심층 분석으로 확인해보세요</p>
                </div>
                <Link href="/analysis" className="shrink-0 px-4 py-2 rounded-full bg-[var(--color-gold)] text-white text-xs font-semibold whitespace-nowrap">
                  사주 분석하기
                </Link>
              </div>
            </>
          );
        })()}

        {/* ── 내일 탭 ── */}
        {!loading && loggedIn && activeTab === "내일" && forecast[1] && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-5">
            <DetailView data={forecast[1]} />
          </div>
        )}

        {/* ── 주간 탭 ── */}
        {!loading && loggedIn && activeTab === "주간" && forecast.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm p-5">
            <WeeklyView forecast={forecast} />
          </div>
        )}

      </div>
    </main>
  );
}
