// Optimized Siun Timeline
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProfiles, getForecast, getFeedbackMap, postFeedback } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import MorningBrief from "@/components/MorningBrief";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import { track } from "@/lib/track";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { useStorageValue } from "@/lib/useStorageValue";
import { ELEMENT_META, FORECAST_LEVEL_META, getElementInfo } from "@/lib/elementColors";
import { getZodiacEmoji } from "@/lib/zodiac";
import type { DailyDomainScore, DailyFortune, Profile, HourlyWeather } from "@/types/analysis";

const DOMAIN_LABELS: Record<string, string> = {
  직업운: "직업운", 재물운: "재물운", 건강운: "건강운", 애정운: "애정운", 학업운: "학업운",
  건강: "건강운", 재물: "재물운", 연애: "연애운", 학업: "학업운", 직업: "직업운"
};

const LEVEL_BAR: Record<string, string> = {
  좋음: "bg-emerald-400", 보통: "bg-amber-400", 주의: "bg-rose-400",
};

const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };

const GANJI_KO: Record<string, string> = {
  甲:"갑",乙:"을",丙:"병",丁:"정",戊:"무",己:"기",庚:"경",辛:"신",壬:"임",癸:"계",
  子:"자",丑:"축",寅:"인",卯:"묘",辰:"진",巳:"사",午:"오",未:"미",申:"신",酉:"유",戌:"술",亥:"해",
};

function toKorean(ganji: string | null | undefined) {
  if (!ganji) return "";
  return ganji.split("").map((c) => GANJI_KO[c] ?? c).join("");
}

export default function SiunPage() {
  const [forecast, setForecast] = useState<DailyFortune[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const storedMember = useStorageValue(MEMBER_ID_KEY);
  const memberId = storedMember || null;
  const loggedIn = !!memberId;
  // 로딩은 effect 안 setState 대신 "무엇까지 불러왔나"로 파생한다
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [forecastFor, setForecastFor] = useState<string | null>(null);
  const loading = storedMember === null || (loggedIn && !profilesLoaded);
  const forecastLoading = !!profile && forecastFor !== profile.id;
  const [activeTab, setActiveTab] = useState("오늘");
  // 지난 7일 "맞았어요?" — tab_id "daily:YYYY-MM-DD" → 1(맞음)/0(아님)
  const [reviews, setReviews] = useState<Record<string, number>>({});

  useEffect(() => {
    if (storedMember === null) return; // 하이드레이션 전
    const src = new URLSearchParams(window.location.search).get("src");
    track(src === "push" ? "push_click" : "daily_view", { logged_in: !!storedMember });
    if (!storedMember) return;
    listProfiles(storedMember)
      .then((ps) => {
        const sorted = [...ps].sort((a, b) => (a.is_self === b.is_self ? 0 : a.is_self ? -1 : 1));
        setProfiles(sorted);
        setProfile(sorted.find((p) => p.is_self) ?? sorted[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setProfilesLoaded(true));
  }, [storedMember]);

  useEffect(() => {
    if (!memberId || !profile) return;
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const startStr = start.toLocaleDateString("en-CA");
    Promise.all([
      getForecast(memberId, profile.id, 31, startStr),
      getFeedbackMap(memberId, profile.id, "daily:").catch(() => ({} as Record<string, number>)),
    ])
      .then(([f, r]) => { if (f) setForecast(f); setReviews(r); })
      .catch(() => {})
      .finally(() => setForecastFor(profile.id));
  }, [memberId, profile]);

  const rateDay = (date: string, rating: number) => {
    if (!memberId || !profile) return;
    const tabId = `daily:${date}`;
    setReviews((r) => ({ ...r, [tabId]: rating }));
    track("daily_review_rate", { rating, date });
    postFeedback(memberId, profile.id, tabId, rating).catch(() => {});
  };

  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayIdx = forecast.findIndex(f => f.date === todayStr);

  const todayFortune = todayIdx !== -1 ? forecast[todayIdx] : null;
  const tmrFortune = todayIdx !== -1 && todayIdx + 1 < forecast.length ? forecast[todayIdx+1] : null;
  const datFortune = todayIdx !== -1 && todayIdx + 2 < forecast.length ? forecast[todayIdx+2] : null;
  const sahFortune = todayIdx !== -1 && todayIdx + 3 < forecast.length ? forecast[todayIdx+3] : null;
  // 지난 7일 — 최근 날짜가 위로
  const pastWeek = todayIdx > 0 ? forecast.slice(Math.max(0, todayIdx - 7), todayIdx).reverse() : [];
  const ratedCount = pastWeek.filter((d) => reviews[`daily:${d.date}`] !== undefined).length;
  const hitCount = pastWeek.filter((d) => reviews[`daily:${d.date}`] === 1).length;

  const elMeta = (el: string) => ELEMENT_META[el] ?? ELEMENT_META["土"];

  const renderDailyContent = (data: DailyFortune, label: string) => {
    const levelMeta = FORECAST_LEVEL_META[data.level] ?? FORECAST_LEVEL_META["평범한 날"];
    const weather = data.weather;
    const tm = weather ? elMeta(weather.element) : null;
    const conditionText = weather?.condition.replace(/\s*\d+\.?\d*°C$/, "") ?? "";
    const yongshin = data.yongshin;
    const nowHour = new Date().getHours();
    const isToday = label === "오늘";

    // 오늘인 경우: 현재 -2시간부터 + 내일 + 모레까지 합쳐서 연속된 타임라인 제공
    const filteredHours = (() => {
      if (!isToday) return []; // 내일/모레 탭은 시간대 제거 (이전 요청사항)
      
      const todayHours = (weather?.hours ?? []).filter((h: HourlyWeather) => {
        const hr = parseInt(h.hour.replace(/[^0-9]/g, ""));
        return hr >= Math.max(0, nowHour - 2);
      }).map(h => ({ ...h, dateLabel: "오늘" }));

      const tmrHours = (tmrFortune?.weather?.hours ?? []).map(h => ({ ...h, dateLabel: "내일" }));
      const datHours = (datFortune?.weather?.hours ?? []).map(h => ({ ...h, dateLabel: "모레" }));
      const sahHours = (sahFortune?.weather?.hours ?? []).map(h => ({ ...h, dateLabel: "글피" }));

      return [...todayHours, ...tmrHours, ...datHours, ...sahHours];
    })();

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="rounded-2xl border border-[var(--color-border-light)] shadow-sm overflow-hidden bg-[var(--color-card)]">
          {/* 아침 한 마디 + 일진·점수 */}
          {(() => {
            const stemEl = getElementInfo(data.day_pillar[0] ?? "");
            const heroBg = ELEMENT_META[stemEl.label]?.bg ?? "bg-[var(--color-ivory-warm)]";
            return (
              <>
                <div className={`px-6 pt-5 pb-4 ${heroBg}`}>
                  <MorningBrief data={data} dayLabel={label} />
                </div>
                <div className={`px-6 py-3 flex items-center justify-between border-y border-[var(--color-border-light)] ${heroBg}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-3xl font-bold leading-none" style={{ color: stemEl.color }}>
                      {data.day_pillar}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: stemEl.color }}>
                      {toKorean(data.day_pillar)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-[var(--color-ink-muted)]">종합</span>
                    <span className="font-heading text-3xl font-bold leading-none text-[var(--color-ink)]">{data.total_score}</span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 데이터 섹션 */}
          <div className="px-6 py-5 space-y-4">
            {/* 대운/세운/월운 그리드 */}
            {(data.daeun_ganji || data.seun_ganji || data.wol_ganji) && (() => {
              const gridCards = [
                data.daeun_ganji ? { label: "대운", ganji: data.daeun_ganji, highlight: data.yongshin_in_daeun ?? false } : null,
                data.seun_ganji  ? { label: `세운`, ganji: data.seun_ganji, highlight: data.yongshin_in_seun ?? false } : null,
                data.wol_ganji   ? { label: `월운`, ganji: data.wol_ganji, highlight: data.yongshin_in_wol ?? false } : null,
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
            {Object.keys(data.domain_scores).length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.domain_scores).map(([key, ds]: [string, DailyDomainScore]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-ink-light)]">{DOMAIN_LABELS[key] ?? key}</span>
                      <span className="font-medium text-[var(--color-ink)]">{ds.score}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-ivory-warm)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${LEVEL_BAR[ds.level as string] ?? "bg-amber-400"}`} style={{ width: `${ds.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 날씨 배지 + 팁 */}
            <div className="border-t border-[var(--color-border-light)] pt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full ${levelMeta.color}`}>
                  {levelMeta.icon} {data.level}
                </span>
                {data.son_eomneun_nal && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold border px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border-indigo-200">
                    👻 손없는 날
                  </span>
                )}
                {tm && weather && (
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold border px-3 py-1 rounded-full ${tm.color} ${tm.bg} border-current/20`}>
                    {tm.emoji} {conditionText} {weather.element} {Math.round(weather.temperature)}°
                  </span>
                )}
              </div>
              {data.tips && data.tips.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {data.tips.map((tip, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-[var(--color-ink-light)]">
                      <span className="text-[var(--color-gold)] flex-shrink-0">✦</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 시간별 기운 — 오늘만 표시 */}
        {isToday && filteredHours.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--color-ink-muted)]">
                {isToday ? "이 시간대가 좋아요" : "시간대별 기운"}
              </p>
              {isToday && yongshin && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 font-semibold">최고 = {yongshin}</span>
                  <span className="text-[10px] text-amber-600 font-semibold">좋음 = {GENERATES[yongshin] || "상생"}</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto -mx-1 px-1 py-1" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-1 w-max items-end">
                {filteredHours.map((h: HourlyWeather & { dateLabel?: string }, i: number) => {
                  const rel = (isToday && yongshin)
                    ? h.element === yongshin ? "match"
                    : GENERATES[h.element] === yongshin ? "generates"
                    : "neutral"
                    : "neutral";
                  const highlight = rel === "match"
                    ? "bg-emerald-50 ring-1 ring-emerald-300 rounded-xl"
                    : rel === "generates"
                    ? "bg-amber-50 ring-1 ring-amber-200 rounded-xl"
                    : "";
                  
                  // 날짜가 바뀔 때 표시 (오늘 -> 내일 등)
                  const showDate = i === 0 || h.dateLabel !== filteredHours[i - 1].dateLabel;

                  return (
                    <div key={i} className="flex flex-col gap-1">
                      {showDate && (
                        <span className="text-[10px] font-bold text-[var(--color-gold)] ml-1 mb-0.5 w-full text-center">{h.dateLabel}</span>
                      )}
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
        )}

        {/* 주간 시운 */}
        {forecast.length > 0 && (
          <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-4 pt-4 pb-1">
            <p className="text-xs font-semibold text-[var(--color-ink-muted)] mb-2">주간 시운</p>
            <div className="divide-y divide-[var(--color-border-light)]">
              {forecast.slice(todayIdx, todayIdx + 7).map((day, idx) => {
                const w = day.weather;
                if (!w) return null;
                const m = elMeta(w.element);
                const ct = w.condition.replace(/\s*\d+\.?\d*°C$/, "");
                const d = new Date(day.date);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
                const lMeta = FORECAST_LEVEL_META[day.level] ?? FORECAST_LEVEL_META["평범한 날"];
                
                return (
                  <div key={day.date} className="flex items-center gap-2 py-2.5">
                    <span className="w-9 text-[11px] font-bold text-[var(--color-ink-faint)] shrink-0">{dateStr}</span>
                    <span className="text-xl shrink-0">{m.emoji}</span>
                    <div className="flex flex-1 items-center gap-1.5 min-w-0">
                      <span className="text-xs text-[var(--color-ink-muted)] truncate">{ct}</span>
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
        )}

      </div>
    );
  };

  const renderPastWeek = () => (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 py-4 space-y-1">
        <p className="font-heading text-base font-semibold text-[var(--color-ink)]">까치가 한 말, 맞았나요?</p>
        <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
          지난 7일의 아침 한 마디를 돌아보고 맞았는지 표시해 주세요.
          {ratedCount > 0 && <> 표시한 {ratedCount}일 중 <span className="font-semibold text-[var(--color-gold)]">{hitCount}일</span>이 맞았어요.</>}
        </p>
      </div>

      {pastWeek.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--color-ink-faint)]">아직 돌아볼 지난 일진이 없어요.</p>
      )}

      {pastWeek.map((day) => {
        const d = new Date(day.date + "T12:00:00");
        const dateLabel = `${d.getMonth() + 1}/${d.getDate()} (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`;
        const stemEl = getElementInfo(day.day_pillar[0] ?? "");
        const lMeta = FORECAST_LEVEL_META[day.level] ?? FORECAST_LEVEL_META["평범한 날"];
        const rating = reviews[`daily:${day.date}`];
        return (
          <div key={day.date} className="rounded-2xl bg-[var(--color-card)] border border-[var(--color-border-light)] shadow-sm px-5 py-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-xs font-bold text-[var(--color-ink-faint)] shrink-0">{dateLabel}</span>
                <span className="font-heading text-lg font-bold leading-none" style={{ color: stemEl.color }}>{day.day_pillar}</span>
                <span className="text-[11px] text-[var(--color-ink-faint)]">{toKorean(day.day_pillar)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-base">{lMeta.icon}</span>
                <span className="text-sm font-black text-[var(--color-ink)]">{day.total_score}</span>
              </div>
            </div>
            <MorningBrief data={day} dayLabel="이날" stripName={profile?.name} compact />
            <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border-light)] pt-3">
              <span className="text-xs text-[var(--color-ink-muted)]">{rating === undefined ? "맞았어요?" : rating === 1 ? "맞았다고 표시했어요" : "아니었다고 표시했어요"}</span>
              <div className="flex gap-1.5">
                {[{ v: 1, icon: "👍", label: "맞았어요" }, { v: 0, icon: "👎", label: "아니에요" }].map(({ v, icon, label }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => rateDay(day.date, v)}
                    aria-pressed={rating === v}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                      rating === v
                        ? "border-[var(--color-gold)] bg-[var(--color-gold-light)]/20 text-[var(--color-gold)]"
                        : "border-[var(--color-border-light)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const tabs = ["지난주", "오늘", "내일", "모레", "글피"];

  return (
    <main className="min-h-screen py-6 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        {/* 헤더 */}
        <header className="space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">시운(時運)</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">나와 소중한 사람들의 기운이 만나는 순간을 분석합니다.</p>
        </header>

        {loading && <LoadingSpinner />}

        {/* 프로필 선택 트레이 */}
        {!loading && loggedIn && profiles.length > 0 && (
          <div className="py-2 overflow-x-auto no-scrollbar -mx-4 px-4 border-b border-[var(--color-border-light)] bg-white/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex gap-4 min-w-max">
              {profiles.map((p) => {
                const isActive = profile?.id === p.id;
                return (
                  <button 
                    key={p.id} 
                    onClick={() => setProfile(p)} 
                    className="flex flex-col items-center gap-1 transition-opacity hover:opacity-80"
                  >
                    <div className={`w-12 h-12 rounded-full p-0.5 border-2 transition-all ${isActive ? "border-[var(--color-gold)] scale-110 shadow-sm" : "border-gray-200"}`}>
                      <div className="w-full h-full rounded-full bg-[var(--color-gold-faint)] flex items-center justify-center text-2xl overflow-hidden">
                        {getZodiacEmoji(p.birth_dt)}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold truncate w-12 text-center ${isActive ? "text-[var(--color-gold)]" : "text-[var(--color-ink-muted)]"}`}>
                      {p.is_self ? "나" : p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 아침 알림 켜기 */}
        {!loading && loggedIn && profile && <PushSubscribeButton />}

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
        {!loading && loggedIn && profile && (
          <nav className="flex p-1 bg-[var(--color-parchment)] rounded-xl border border-[var(--color-border-light)] shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); track("daily_tab", { tab }); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-white text-[var(--color-gold)] shadow-sm"
                    : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        )}

        {forecastLoading && (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {!loading && !forecastLoading && loggedIn && activeTab === "지난주" && renderPastWeek()}
        {!loading && !forecastLoading && loggedIn && activeTab === "오늘" && todayFortune && renderDailyContent(todayFortune, "오늘")}
        {!loading && !forecastLoading && loggedIn && activeTab === "내일" && tmrFortune && renderDailyContent(tmrFortune, "내일")}
        {!loading && !forecastLoading && loggedIn && activeTab === "모레" && datFortune && renderDailyContent(datFortune, "모레")}
        {!loading && !forecastLoading && loggedIn && activeTab === "글피" && sahFortune && renderDailyContent(sahFortune, "글피")}
      </div>
    </main>
  );
}
