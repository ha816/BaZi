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
  직업운: "직업운", 재물운: "재물운", 건강운: "건강운", 애정운: "애정운", 학업운: "학업운",
};

const LEVEL_BAR: Record<string, string> = {
  좋음: "bg-emerald-400", 보통: "bg-amber-400", 주의: "bg-rose-400",
};

const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

const GANJI_KO: Record<string, string> = {
  甲:"갑",乙:"을",丙:"병",丁:"정",戊:"무",己:"기",庚:"경",辛:"신",壬:"임",癸:"계",
  子:"자",丑:"축",寅:"인",卯:"묘",辰:"진",巳:"사",午:"오",未:"미",申:"신",酉:"유",戌:"술",亥:"해",
};

function toKorean(ganji: string) {
  return ganji.split("").map((c) => GANJI_KO[c] ?? c).join("");
}

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
              {/* 핵심 요약 카드 */}
              <div className="rounded-2xl border border-[var(--color-border-light)] shadow-sm overflow-hidden bg-[var(--color-card)]">
                {/* 히어로 — 일진 + 점수 + 날씨 */}
                {(() => {
                  const stemEl = getElementInfo(fortune.day_pillar[0] ?? "");
                  const heroBg = ELEMENT_META[stemEl.label]?.bg ?? "bg-[var(--color-ivory-warm)]";
                  return (
                    <div className={`px-6 py-6 flex items-center gap-10 ${heroBg}`}>
                      {/* 일진 */}
                      <div className="flex flex-col flex-shrink-0 gap-0.5">
                        <span className="text-lg font-semibold leading-none tracking-wide" style={{ color: stemEl.color }}>
                          {toKorean(fortune.day_pillar)}
                        </span>
                        <span className="font-heading text-7xl font-bold leading-none" style={{ color: stemEl.color }}>
                          {fortune.day_pillar}
                        </span>
                      </div>
                      {/* 종합 운세 */}
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-lg font-semibold leading-none tracking-wide text-[var(--color-ink-muted)]">종합 운세</span>
                        <span className="font-heading text-7xl font-bold leading-none text-[var(--color-ink)]">{fortune.total_score}</span>
                      </div>
                    </div>
                  );
                })()}


                {/* 데이터 섹션 */}
                <div className="px-6 py-5 space-y-4">
                  {/* 대운/세운/월운 그리드 */}
                  {(fortune.daeun_ganji || fortune.seun_ganji || fortune.wol_ganji) && (() => {
                    const gridCards = [
                      fortune.daeun_ganji ? { label: "대운", ganji: fortune.daeun_ganji, highlight: fortune.yongshin_in_daeun ?? false } : null,
                      fortune.seun_ganji  ? { label: `세운(${new Date().getFullYear()}년)`, ganji: fortune.seun_ganji, highlight: fortune.yongshin_in_seun ?? false } : null,
                      fortune.wol_ganji   ? { label: `월운(${new Date().getMonth() + 1}월)`, ganji: fortune.wol_ganji, highlight: fortune.yongshin_in_wol ?? false } : null,
                    ].filter(Boolean) as { label: string; ganji: string; highlight: boolean }[];
                    return (
                      <div className="grid grid-cols-3 gap-2">
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

                  {/* 영역별 점수 */}
                  {Object.keys(fortune.domain_scores).length > 0 && (
                    <>
                      {/* 영역별 점수 */}
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(fortune.domain_scores).map(([key, ds]) => (
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
                    </>
                  )}

                  {/* description + tips */}
                  {(fortune.description || (fortune.tips && fortune.tips.length > 0)) && (
                    <div className="border-t border-[var(--color-border-light)] pt-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {levelMeta && (
                          <span className={`inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full ${levelMeta.color}`}>
                            {levelMeta.icon} {fortune.level}
                          </span>
                        )}
                        {tm && todayWeather && (
                          <span className={`inline-flex items-center gap-1.5 text-sm font-bold border px-3 py-1 rounded-full ${tm.color} ${tm.bg} border-current/20`}>
                            {tm.emoji} {conditionText} {Math.round(todayWeather.temperature)}°
                          </span>
                        )}
                      </div>
                      {fortune.description && (
                        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{fortune.description}</p>
                      )}
                      {fortune.tips && fortune.tips.length > 0 && (
                        <ul className="space-y-1">
                          {fortune.tips.map((tip, i) => (
                            <li key={i} className="flex gap-1.5 text-xs text-[var(--color-ink-light)]">
                              <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* 시간별 기운 */}
              {hourSlots.length > 0 && (
                <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[var(--color-ink-muted)]">이 시간대가 좋아요</p>
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
                            <span className={`text-[11px] font-bold leading-none ${elMeta(h.element).color}`}>{h.element}</span>
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
        {!loading && loggedIn && activeTab === "내일" && forecast[1] && (() => {
          const tmr = forecast[1];
          const tmrMeta = FORECAST_LEVEL_META[tmr.level] ?? FORECAST_LEVEL_META["평범한 날"];
          const tmrWeather = tmr.weather as typeof todayWeather;
          const tmrEl = tmrWeather ? elMeta(tmrWeather.element) : null;
          const tmrCondition = tmrWeather?.condition.replace(/\s*\d+\.?\d*°C$/, "") ?? "";
          const tmrSlots = hourSlots.filter(({ day }) => day === "내일");
          return (
            <>
              {/* 핵심 요약 카드 */}
              <div className="rounded-2xl border border-[var(--color-border-light)] shadow-sm overflow-hidden bg-[var(--color-card)]">
                {(() => {
                  const stemEl = getElementInfo(tmr.day_pillar[0] ?? "");
                  const heroBg = ELEMENT_META[stemEl.label]?.bg ?? "bg-[var(--color-ivory-warm)]";
                  return (
                    <div className={`px-6 py-6 flex items-center gap-10 ${heroBg}`}>
                      <div className="flex flex-col flex-shrink-0 gap-0.5">
                        <span className="text-lg font-semibold leading-none tracking-wide" style={{ color: stemEl.color }}>
                          {toKorean(tmr.day_pillar)}
                        </span>
                        <span className="font-heading text-7xl font-bold leading-none" style={{ color: stemEl.color }}>
                          {tmr.day_pillar}
                        </span>
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-lg font-semibold leading-none tracking-wide text-[var(--color-ink-muted)]">종합 운세</span>
                        <span className="font-heading text-7xl font-bold leading-none text-[var(--color-ink)]">{tmr.total_score}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="px-6 py-5 space-y-4">
                  {(tmr.daeun_ganji || tmr.seun_ganji || tmr.wol_ganji) && (() => {
                    const gridCards = [
                      tmr.daeun_ganji ? { label: "대운", ganji: tmr.daeun_ganji, highlight: tmr.yongshin_in_daeun ?? false } : null,
                      tmr.seun_ganji  ? { label: `세운(${new Date().getFullYear()}년)`, ganji: tmr.seun_ganji, highlight: tmr.yongshin_in_seun ?? false } : null,
                      tmr.wol_ganji   ? { label: `월운(${new Date().getMonth() + 1}월)`, ganji: tmr.wol_ganji, highlight: tmr.yongshin_in_wol ?? false } : null,
                    ].filter(Boolean) as { label: string; ganji: string; highlight: boolean }[];
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        {gridCards.map(({ label, ganji, highlight }) => {
                          const stemEl = getElementInfo(ganji[0] ?? "");
                          return (
                            <div key={label} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 border ${highlight ? "border-[var(--color-gold)] bg-[var(--color-gold-light)]/10" : "border-[var(--color-border-light)]"}`}>
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

                  {Object.keys(tmr.domain_scores).length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(tmr.domain_scores).map(([key, ds]) => (
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
                  )}

                  {(tmr.description || (tmr.tips && tmr.tips.length > 0)) && (
                    <div className="border-t border-[var(--color-border-light)] pt-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full ${tmrMeta.color}`}>
                          {tmrMeta.icon} {tmr.level}
                        </span>
                        {tmrEl && tmrWeather && (
                          <span className={`inline-flex items-center gap-1.5 text-sm font-bold border px-3 py-1 rounded-full ${tmrEl.color} ${tmrEl.bg} border-current/20`}>
                            {tmrEl.emoji} {tmrCondition} {Math.round(tmrWeather.temperature)}°
                          </span>
                        )}
                      </div>
                      {tmr.description && (
                        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{tmr.description}</p>
                      )}
                      {tmr.tips && tmr.tips.length > 0 && (
                        <ul className="space-y-1">
                          {tmr.tips.map((tip, i) => (
                            <li key={i} className="flex gap-1.5 text-xs text-[var(--color-ink-light)]">
                              <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 내일 시간별 기운 */}
              {tmrSlots.length > 0 && (
                <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[var(--color-ink-muted)]">이 시간대가 좋아요</p>
                    {tmr.yongshin && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-semibold">최고 = 용신({tmr.yongshin})</span>
                        <span className="text-[10px] text-amber-600 font-semibold">좋아요 = 용신 生</span>
                      </div>
                    )}
                  </div>
                  <div className="overflow-x-auto -mx-1 px-1 py-1" style={{ scrollbarWidth: "none" }}>
                    <div className="flex gap-1 w-max">
                      {tmrSlots.map(({ h }, i) => {
                        const rel = tmr.yongshin
                          ? h.element === tmr.yongshin ? "match"
                          : GENERATES[h.element] === tmr.yongshin ? "generates"
                          : "neutral"
                          : "neutral";
                        const highlight = rel === "match"
                          ? "bg-emerald-50 ring-1 ring-emerald-300 rounded-xl"
                          : rel === "generates"
                          ? "bg-amber-50 ring-1 ring-amber-200 rounded-xl"
                          : "";
                        return (
                          <div key={i} className={`flex flex-col items-center gap-1.5 px-2.5 py-2 min-w-[52px] ${highlight}`}>
                            <span className="text-[11px] text-[var(--color-ink-faint)] leading-none">{h.hour}</span>
                            <span className="text-2xl">{elMeta(h.element).emoji}</span>
                            <span className={`text-[11px] font-bold leading-none ${elMeta(h.element).color}`}>{h.element}</span>
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
            </>
          );
        })()}

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
