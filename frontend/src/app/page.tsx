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
import { getZodiacEmoji } from "@/lib/zodiac";

// ── 상단 스토리 트레이 (Story Tray) ─────────────────────────────────────────
function StoryTray({ profiles, activeId }: { profiles: Profile[]; activeId?: string | null }) {
  if (profiles.length === 0) return null;

  const scrollToPost = (id: string) => {
    const el = document.getElementById(`post-${id}`);
    if (el) {
      const headerOffset = 130; // Header(60) + StoryTray(70)
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="py-4 border-b border-[var(--color-border-light)] bg-white overflow-x-auto no-scrollbar sticky top-[60px] z-10">
      <div className="flex gap-4 px-4 min-w-max">
        {profiles.map((p) => {
          const isActive = p.is_self; 
          return (
            <button key={p.id} onClick={() => scrollToPost(p.id)} className="flex flex-col items-center gap-1">
              <div className={`w-16 h-16 rounded-full p-0.5 border-2 ${isActive ? "border-[var(--color-gold)]" : "border-gray-200"}`}>
                <div className="w-full h-full rounded-full bg-[var(--color-gold-faint)] flex items-center justify-center text-3xl overflow-hidden shadow-inner">
                  {getZodiacEmoji(p.birth_dt)}
                </div>
              </div>
              <span className="text-[10px] font-medium text-[var(--color-ink-muted)] truncate w-16 text-center">
                {p.is_self ? "나" : p.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 운세 포스트 (로그인, 프로필별) ─────────────────────────────────────────
function FortunePost({ profile, memberId }: { profile: Profile; memberId: string }) {
  const [forecast, setForecast] = useState<DailyFortune[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForecast(memberId, profile.id, 7)
      .then(setForecast)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId, profile.id]);

  const today = forecast?.[0];
  const meta = today ? FORECAST_LEVEL_META[today.level] ?? FORECAST_LEVEL_META["평범한 날"] : null;
  const el = today ? ELEMENT_META[today.day_element] ?? ELEMENT_META["土"] : ELEMENT_META["土"];

  // 플로팅 키워드 추출 (상위 3개)
  const keywords = today ? Object.entries(today.domain_scores)
    .map(([key, val]) => ({ key, score: val.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(kw => `#${kw.key}${kw.score > 80 ? "운최고" : kw.score > 60 ? "운좋음" : "운보통"}`) : [];

  return (
    <div id={`post-${profile.id}`}>
      <FeedPost
        name={profile.name}
      handle={`${new Date(profile.birth_dt).getFullYear()}년생 · ${profile.gender === "male" ? "남" : "여"} · ${profile.city}`}
      avatarChar={getZodiacEmoji(profile.birth_dt)}
      avatarClass="bg-[var(--color-gold-faint)] text-2xl"
      caption={
        today && meta ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {today.son_eomneun_nal && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                  👻 손없는 날
                </span>
              )}
            </div>
            <p className="text-sm">
              {today.description.replace(new RegExp(`^${profile.name}\\s*`), "")}
            </p>
          </div>
        ) : null
      }
      actions={
        <div className="space-y-1">
          <div className="flex gap-4 pt-1 border-t border-[var(--color-border-light)] mt-2 py-2">
            <Link href="/analysis" className="text-xs text-[var(--color-ink-faint)]">사주분석하기</Link>
            <Link href="/compatibility" className="text-xs text-[var(--color-ink-faint)]">나와 궁합보기</Link>
          </div>
        </div>
      }
    >
      {/* 비주얼 카드 영역 */}
      <div className={`aspect-[4/3] w-full ${el.bg} flex flex-col items-center justify-center relative overflow-hidden`}>
        {loading ? (
          <LoadingSpinner />
        ) : today && meta ? (
          <>
            {/* 배경 장식 */}
            <div className="absolute top-[-10%] right-[-10%] w-40 h-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-[-5%] left-[-5%] w-32 h-32 rounded-full bg-black/5 blur-2xl" />
            
            {/* 까치 마스코트 */}
            <div className="z-10 flex flex-col items-center relative">
              <img 
                src={meta.image} 
                alt="kkachi" 
                className="w-48 h-48 object-contain animate-float drop-shadow-xl"
              />
              
              {/* 플로팅 키워드 */}
              {keywords.map((kw, i) => (
                <div 
                  key={kw}
                  className={`absolute z-20 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-white/50 text-[10px] font-bold text-[var(--color-ink)] whitespace-nowrap animate-float`}
                  style={{
                    top: i === 0 ? '-10%' : i === 1 ? '20%' : '60%',
                    left: i === 0 ? '-20%' : i === 1 ? '110%' : '-30%',
                    animationDelay: `${i * 0.5}s`
                  }}
                >
                  {kw}
                </div>
              ))}
            </div>

            {/* 하단 정보 태그들 */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-sm ${meta.color.replace('bg-', 'bg-white/40 border-white/60 ')}`}>
                {meta.icon} {today.level} {today.total_score}점
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border bg-white/40 border-white/60 backdrop-blur-md shadow-sm ${el.color}`}>
                <span className="text-xs">{el.emoji}</span> 오늘날씨오행 {today.day_element}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-ink-faint)]">운세를 불러오는 중...</p>
        )}
      </div>
    </FeedPost>
    </div>
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
        const sorted = [...ps].sort((a, b) => (a.is_self === b.is_self ? 0 : a.is_self ? -1 : 1));
        setProfiles(sorted);
        if (sorted.length > 0) setWeatherCity(sorted[0].city);
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
        <header className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[var(--color-border-light)] bg-white sticky top-0 z-20">
          <div>
            <p className="font-heading text-lg font-bold text-[var(--color-ink)]">{dateLabel}</p>
          </div>
        </header>

        {/* 스토리 트레이 */}
        {memberId && profiles.length > 0 && <StoryTray profiles={profiles} />}

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
