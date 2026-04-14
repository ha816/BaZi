"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DailyFortune, DailyWeather, HourlyWeather, Profile } from "@/types/analysis";
import { getForecast, getWeather, listProfiles } from "@/lib/api";
import { detectLocation } from "@/lib/location";
import DailyFortunePanel from "@/components/DailyFortune";
import FeedPost from "@/components/FeedPost";
import LoadingSpinner from "@/components/LoadingSpinner";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { ELEMENT_META, FORECAST_LEVEL_META } from "@/lib/elementColors";

// ── 운세 포스트 (로그인, 프로필별) ─────────────────────────────────────────
function FortunePost({ profile, memberId }: { profile: Profile; memberId: string }) {
  const [forecast, setForecast] = useState<DailyFortune[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getForecast(memberId, profile.id, 7)
      .then(setForecast)
      .finally(() => setLoading(false));
  }, [memberId, profile.id]);

  const today = forecast?.[0];
  const meta = today ? FORECAST_LEVEL_META[today.level] ?? FORECAST_LEVEL_META["평범한 날"] : null;

  return (
    <FeedPost
      name={profile.name}
      handle={`${new Date(profile.birth_dt).getFullYear()}년생 · ${profile.gender === "male" ? "남" : "여"} · ${profile.city}`}
      avatarChar={profile.name[0]}
      avatarClass="bg-[var(--color-ink)]"
      caption={
        today && meta ? (
          <span>
            <span className="font-semibold">{profile.name}</span>{" "}
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
              {meta.icon} {today.level} {today.total_score}점
            </span>
            {" "}{today.description}
          </span>
        ) : null
      }
      actions={
        <div className="space-y-1">
          {/* 운세 상세 토글 */}
          {forecast && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-xs text-[var(--color-gold)] font-medium"
            >
              {open ? "접기 ▲" : "오늘/내일/주간 운세 보기 ▼"}
            </button>
          )}
          {open && forecast && (
            <div className="pt-2">
              <DailyFortunePanel forecast={forecast} loading={false} />
            </div>
          )}
          <div className="flex gap-4 pt-1">
            <Link href="/fortune" className="text-xs text-[var(--color-gold)] font-medium hover:opacity-80 transition-opacity">
              오늘운세 자세히 →
            </Link>
            <Link href={`/analysis?profileId=${profile.id}`} className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
              사주 분석 →
            </Link>
            <Link href="/compatibility" className="text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-gold)] transition-colors">
              궁합 보기 →
            </Link>
          </div>
        </div>
      }
    >
      {/* 컨텐츠: 오늘 일진 */}
      <div className="px-4 py-6 bg-[var(--color-ivory-warm)] flex items-center gap-5">
        {loading ? (
          <LoadingSpinner />
        ) : today ? (
          <>
            <span className="font-heading text-6xl font-bold text-[var(--color-ink)]">{today.day_pillar}</span>
            <div className="space-y-1">
              <p className="text-sm text-[var(--color-ink-muted)]">{today.day_element} · {today.level}</p>
              {today.weather && <p className="text-xs text-[var(--color-ink-faint)]">{today.weather.condition}</p>}
              <div className="flex gap-2 flex-wrap pt-1">
                {today.tips.map((tip, i) => (
                  <span key={i} className="text-xs bg-white border border-[var(--color-border-light)] rounded-full px-2.5 py-0.5 text-[var(--color-ink-muted)]">
                    {tip}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">운세를 불러오는 중...</p>
        )}
      </div>
    </FeedPost>
  );
}

const DAY_LABELS = ["오늘", "내일", "모레"];

function HourlyRow({ h }: { h: HourlyWeather }) {
  const m = ELEMENT_META[h.element] ?? ELEMENT_META["土"];
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-white/50 last:border-0">
      <span className="text-xs text-[var(--color-ink-muted)] w-10 shrink-0">{h.hour}</span>
      <span className="text-base">{m.emoji}</span>
      <span className={`text-[10px] font-bold ${m.color} w-10 shrink-0`}>{m.label}</span>
      <span className="text-xs text-[var(--color-ink)] flex-1">{h.condition}</span>
      <span className="text-xs font-semibold text-[var(--color-ink)]">{h.temperature}°</span>
    </div>
  );
}

// ── 날씨 포스트 ────────────────────────────────────────────────────────────
function WeatherPost({ city }: { city: string }) {
  const [days, setDays] = useState<DailyWeather[] | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    getWeather(city).then(setDays).catch(() => {});
  }, [city]);

  const todayMeta = days?.length ? (ELEMENT_META[days[0].element] ?? ELEMENT_META["土"]) : null;

  return (
    <FeedPost
      name="날씨 기운"
      handle={city}
      avatarChar="기"
      avatarClass="bg-gradient-to-br from-sky-400 to-blue-500"
      caption={null}
    >
      <div className={`${todayMeta?.bg ?? "bg-[var(--color-ivory-warm)]"} px-4 py-5`}>
        {!days ? (
          <div className="flex justify-center py-2">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {days.map((day, i) => {
                const m = ELEMENT_META[day.element] ?? ELEMENT_META["土"];
                const isOpen = openIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-all ${isOpen ? "bg-white/80 ring-1 ring-[var(--color-gold-light)]" : "bg-white/60"}`}
                  >
                    <p className="text-xs font-bold text-[var(--color-ink)]">
                      {DAY_LABELS[i]}
                      {day.date && <span className="ml-1">{day.date.slice(5).replace("-", "/")}</span>}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-3xl">{m.emoji}</span>
                      <span className={`text-[10px] font-bold ${m.color}`}>{m.label}</span>
                    </div>
                    <p className="text-xs text-[var(--color-ink)] font-medium text-center leading-tight">{day.condition}</p>
                    <span className="text-[10px] text-[var(--color-ink-faint)]">{isOpen ? "▲" : "▼"}</span>
                  </button>
                );
              })}
            </div>
            {openIdx !== null && days[openIdx].hours?.length ? (
              <div className="bg-white/70 rounded-xl px-3 py-2">
                <p className="text-[10px] text-[var(--color-ink-faint)] mb-1 font-medium">{DAY_LABELS[openIdx]} 시간별 예보</p>
                {days[openIdx].hours!.map((h) => (
                  <HourlyRow key={h.hour} h={h} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </FeedPost>
  );
}

// ── 서비스 영상 포스트 ──────────────────────────────────────────────────────
function VideoPost({ loggedIn }: { loggedIn: boolean }) {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showIcon, setShowIcon] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); setPlaying(true); }
    else { video.pause(); setPlaying(false); }
    setShowIcon(true);
    if (iconTimer.current) clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(false), 900);
  };

  return (
    <FeedPost
      name="사주까치"
      handle="sajukkachi"
      avatarChar="까"
      caption={
        <span>
          <span className="font-semibold">사주까치</span>{" "}
          까치가 울면 반가운 소식이 온다 했죠. 오늘 당신의 기운이 어떤지 알려드릴게요. 🪶
        </span>
      }
      actions={
        !loggedIn ? (
          <div className="flex gap-2">
            <Link href="/analysis" className="flex-1 text-center py-2.5 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg text-sm font-semibold hover:bg-[var(--color-ink-light)] transition-colors">
              내 사주 보기
            </Link>
            <Link href="/join" className="flex-1 text-center py-2.5 border border-[var(--color-gold)] text-[var(--color-gold)] rounded-lg text-sm font-semibold hover:bg-[var(--color-gold)] hover:text-white transition-colors">
              로그인
            </Link>
          </div>
        ) : null
      }
    >
      <div className="aspect-square w-full bg-black overflow-hidden relative cursor-pointer" onClick={togglePlay}>
        <video ref={videoRef} src="/hero.mp4" autoPlay muted={muted} loop playsInline className="w-full h-full object-cover" />

        {/* 재생/일시정지 아이콘 — 탭 시 잠깐 노출 */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showIcon ? "opacity-100" : "opacity-0"}`}>
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {playing ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            )}
          </div>
        </div>

        {/* 음소거 토글 */}
        <button
          onClick={(e) => { e.stopPropagation(); setMuted((v) => !v); }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label={muted ? "소리 켜기" : "소리 끄기"}
        >
          {muted ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          )}
        </button>
      </div>
    </FeedPost>
  );
}

// ── 프로필 없을 때 CTA 포스트 ──────────────────────────────────────────────
function EmptyProfilePost() {
  return (
    <FeedPost
      name="사주까치"
      handle="sajukkachi"
      avatarChar="까"
      caption="프로필을 등록하면 매일 오늘의 운세를 피드에서 바로 확인할 수 있어요. 🌟"
      actions={
        <Link href="/profile" className="block text-center py-2.5 bg-[var(--color-ink)] text-[var(--color-ivory)] rounded-lg text-sm font-semibold hover:bg-[var(--color-ink-light)] transition-colors">
          프로필 추가하기
        </Link>
      }
    >
      <div className="px-4 py-8 bg-[var(--color-ivory-warm)] text-center">
        <p className="font-heading text-4xl mb-2">🪶</p>
        <p className="text-sm text-[var(--color-ink-faint)]">아직 등록된 프로필이 없어요</p>
      </div>
    </FeedPost>
  );
}

// ── 루트 ────────────────────────────────────────────────────────────────────
export default function Home() {
  const [memberId, setMemberId] = useState<string | null | undefined>(undefined);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [weatherCity, setWeatherCity] = useState<string>("Seoul");

  const today = new Date();
  const dateLabel = today.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  useEffect(() => {
    const id = localStorage.getItem(MEMBER_ID_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemberId(id);
    if (id) {
      listProfiles(id).then((ps) => {
        setProfiles(ps);
        if (ps.length > 0) setWeatherCity(ps[0].city);
      }).catch(() => {});
    } else {
      detectLocation().then((loc) => { if (loc) setWeatherCity(loc.city); }).catch(() => {});
    }
  }, []);

  if (memberId === undefined) return null;

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto">
        {/* 상단 헤더 */}
        <header className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[var(--color-border-light)]">
          <div>
            <p className="font-heading text-lg font-bold text-[var(--color-ink)]">{dateLabel}</p>
          </div>
        </header>

        {/* 피드 */}
        <div>
          {/* 로그인: 운세 포스트 */}
          {memberId && profiles.length === 0 && <EmptyProfilePost />}
          {memberId && profiles.map((p) => (
            <FortunePost key={p.id} profile={p} memberId={memberId} />
          ))}

          {/* 날씨 포스트 */}
          <WeatherPost city={weatherCity} />

          {/* 항상: 서비스 영상 포스트 */}
          <VideoPost loggedIn={!!memberId} />
        </div>
      </div>
    </main>
  );
}
