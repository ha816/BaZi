"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnalysisInput } from "@/types/analysis";
import { getHome, getToday, type HomeData, type TodayData } from "@/lib/api";
import { detectLocation, type LocationInfo } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import MorningBrief from "@/components/MorningBrief";
import FeedPost from "@/components/FeedPost";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { ELEMENT_META, FORECAST_LEVEL_META } from "@/lib/elementColors";
import { charArtSrc, onCharArtError } from "@/lib/characterArt";
import { useStorageValue } from "@/lib/useStorageValue";
import { track } from "@/lib/track";
import { SINSAL_INFO, SINSAL_ORDER, SIPSIN_INFO } from "@/components/tabs/natal/data";

// 홈 — 까치가 물어다 준 오늘 (specs/home/index.md, 2026-10-24). 로그인은 GET /members/{id}/home 한 번

const FALLBACK_IMG = "/kkachi/normal_kkachi_00.png";
const MAX_PROFILES = 10;

/** 오늘 궁합 배지 — 숫자 없이 기호·색만 */
const COMPAT_BADGE: Record<string, { glyph: string; cls: string }> = {
  "좋음": { glyph: "♥", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  "보통": { glyph: "·", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  "주의": { glyph: "!", cls: "bg-amber-100 text-amber-800 border-amber-200" },
};

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{children}</span>;
}

/** 홈 카드 공통 틀(CLAUDE.md 카드 규약) — 칸 소제목 없이 카드마다 안에 제목 */
const FEED_CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-3.5";

// ① 오늘의 나 — 내 캐릭터 + 까치 말풍선(아침 한 마디). 점수는 윗줄 배지로만
function TodayHero({ me }: { me: NonNullable<HomeData["me"]> }) {
  const f = me.fortune;
  const el = ELEMENT_META[f.day_element] ?? ELEMENT_META["土"];
  const level = FORECAST_LEVEL_META[f.level] ?? FORECAST_LEVEL_META["평범한 날"];
  return (
    <section className={`mx-4 mt-4 ${FEED_CARD}`}>
      <h2 className="font-heading text-[15px] font-bold text-[var(--color-ink)]">오늘의 나</h2>
      <div className="flex items-center gap-1.5 flex-wrap mt-2 mb-3">
        <Badge cls={level.color}>{level.icon} {f.level}</Badge>
        <Badge cls="bg-[var(--color-ivory)] text-[var(--color-ink-muted)] border-[var(--color-border-light)]">{f.total_score}점</Badge>
        <Badge cls={`${el.bg} text-[var(--color-ink-muted)] border-[var(--color-border-light)]`}>{el.emoji} {f.day_element}의 날</Badge>
        {f.solar_term && <Badge cls="bg-emerald-50 text-emerald-700 border-emerald-200">🌿 {f.solar_term}</Badge>}
        {f.son_eomneun_nal && <Badge cls="bg-indigo-50 text-indigo-700 border-indigo-200">👻 손없는 날</Badge>}
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex flex-col items-center shrink-0 w-24">
          <img
            src={charArtSrc(me.character.art_key, me.character.key)}
            alt={me.character.title}
            onError={onCharArtError(me.character.key, level.image)}
            className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-border-light)] bg-[var(--color-gold-faint)] animate-float"
          />
          <p className="mt-1.5 text-[11px] font-semibold text-[var(--color-ink-muted)] text-center leading-tight">{me.character.title}</p>
        </div>
        <div className="relative flex-1 min-w-0 rounded-2xl bg-[var(--color-ivory)] px-3.5 py-3 break-keep">
          {/* 말풍선 꼬리 — 캐릭터 쪽 */}
          <span className="absolute -left-1.5 top-6 w-3 h-3 rotate-45 bg-[var(--color-ivory)]" aria-hidden />
          <MorningBrief data={f} />
        </div>
      </div>
      <Link href="/siun" className="block mt-3.5 text-center py-2.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-ivory)] text-sm font-semibold active:opacity-80">
        오늘 시운 자세히 →
      </Link>
    </section>
  );
}

// ② 오늘 내 사람들 — 캐릭터 얼굴 줄 + 나와 오늘의 궁합 배지
function PeopleRow({ people, canAdd, hasMe }: { people: HomeData["people"]; canAdd: boolean; hasMe: boolean }) {
  const best = people
    .filter((p) => p.compat?.level === "좋음")
    .sort((a, b) => (b.compat?.score ?? 0) - (a.compat?.score ?? 0))[0];
  return (
    <section className={`mx-4 mt-3 ${FEED_CARD}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-[15px] font-bold text-[var(--color-ink)]">오늘 내 사람들</h2>
        <Link href="/profile" className="text-xs text-[var(--color-ink-faint)]">관리</Link>
      </div>
      <div className="-mx-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-4 min-w-max pb-1">
          {people.map((p) => {
            const badge = p.compat ? COMPAT_BADGE[p.compat.level] : null;
            return (
              <Link key={p.profile_id} href={`/compatibility?p2=${p.profile_id}`} className="flex flex-col items-center gap-1 w-16">
                <div className="relative">
                  <img
                    src={charArtSrc(p.character.art_key, p.character.key)}
                    alt=""
                    onError={onCharArtError(p.character.key, FALLBACK_IMG)}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-border-light)] bg-[var(--color-gold-faint)]"
                  />
                  {badge && (
                    <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border text-[11px] font-bold flex items-center justify-center ${badge.cls}`} aria-label={`오늘 궁합 ${p.compat?.level}`}>
                      {badge.glyph}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[var(--color-ink-muted)] truncate w-16 text-center">{p.name}</span>
              </Link>
            );
          })}
          {canAdd && (
            <Link href="/profile" className="flex flex-col items-center gap-1 w-16">
              <span className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-2xl text-[var(--color-ink-faint)]">+</span>
              <span className="text-[11px] font-medium text-[var(--color-ink-faint)]">사람 추가</span>
            </Link>
          )}
        </div>
      </div>
      {people.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--color-ink-faint)]">궁금한 사람을 추가하면 오늘 둘의 궁합을 알려 줘요</p>
      ) : best && hasMe ? (
        <p className="mt-2 text-xs text-[var(--color-ink-light)] leading-relaxed break-keep">
          <span className="font-semibold text-emerald-700">♥ {best.name}님과</span> — {best.compat?.headline}
        </p>
      ) : null}
    </section>
  );
}

// ③ 까치 소식 (specs/home §3-5) — 공지 · 오늘의 띠 · 사주 한 입, 종류마다 한 장

/** 운영자가 쓰는 새소식 — 맨 위가 최신, 30일 안 것 하나만 홈에 뜬다. 새 소식은 맨 위에 한 줄 */
const KKACHI_NEWS: { date: string; emoji: string; title: string; body: string; href?: string }[] = [
  { date: "2026-10-25", emoji: "🪪", title: "사주 분석도 궁합처럼 골라서", body: "저장한 프로필을 카드에서 바로 고르거나, 직접 입력해 저장 없이 바로 볼 수 있어요.", href: "/analysis" },
  { date: "2026-10-18", emoji: "💞", title: "궁합에 시운 탭이 생겼어요", body: "두 분의 오늘·내일·모레 궁합과 2주 안에 함께하기 좋은 날을 알려 드려요.", href: "/compatibility" },
];
const NEWS_DAYS = 30;

/** 사주 한 입 — 만세력 섹션의 신살 9 + 십신 10을 날마다 하나씩(19일 주기) */
const BITES = [
  ...SINSAL_ORDER.map((name) => ({ kind: "신살(神殺)", name, hanja: SINSAL_INFO[name].hanja, tagline: SINSAL_INFO[name].tagline, desc: SINSAL_INFO[name].desc, img: `/kkachi/sinsal/sinsal_${name}.png` })),
  ...Object.entries(SIPSIN_INFO).map(([hanja, v]) => ({ kind: "십신(十神)", name: v.korean, hanja, tagline: v.tagline, desc: v.desc, img: `/kkachi/sipsin/sipsin_${v.korean}.png` })),
];

/** 띠 칸 테두리·라벨 — 관계 값(백엔드)에 따라 색만 고른다 */
const ZODIAC_TONE: Record<string, string> = {
  "나": "border-[var(--color-gold)] bg-[var(--color-gold-faint)]",
  "삼합": "border-emerald-300 bg-emerald-50",
  "육합": "border-emerald-300 bg-emerald-50",
  "충": "border-amber-300 bg-amber-50",
  "원진": "border-amber-300 bg-amber-50",
  "보통": "border-[var(--color-border-light)] bg-white",
};

function KkachiFeed({ today, myBranch }: { today: TodayData; myBranch?: string }) {
  const dayNo = Math.floor(Date.parse(today.date) / 86_400_000);
  const news = KKACHI_NEWS.find((n) => dayNo - Math.floor(Date.parse(n.date) / 86_400_000) <= NEWS_DAYS);
  const bite = BITES[dayNo % BITES.length];
  const term = today.solar_term;
  const termWhen = term ? (term.days === 0 ? "오늘" : term.days === 1 ? "내일" : `${term.days}일 뒤`) : "";

  return (
    <section className="mt-3 px-4 space-y-3">

      {news && (
        <Link href={news.href ?? "#"} className={`${FEED_CARD} flex items-start gap-3 active:opacity-80`}>
          <span className="text-2xl shrink-0">{news.emoji}</span>
          <span className="flex-1 min-w-0 break-keep">
            <span className="block text-[10px] font-bold text-[var(--color-gold)]">새소식 · {news.date.slice(5).replace("-", ".")}</span>
            <span className="block text-sm font-semibold text-[var(--color-ink)] leading-snug mt-0.5">{news.title}</span>
            <span className="block text-xs text-[var(--color-ink-muted)] leading-relaxed mt-1">{news.body}</span>
          </span>
        </Link>
      )}

      <div className={FEED_CARD}>
        <p className="text-[10px] font-bold text-[var(--color-gold)]">오늘의 띠</p>
        <p className="font-heading text-[15px] font-bold text-[var(--color-ink)] mt-0.5">
          {today.animal.emoji} 오늘은 {today.day_kor}({today.day_pillar})일 — {today.animal.color} {today.animal.korean}의 날
        </p>
        <div className="grid grid-cols-6 gap-1.5 mt-3">
          {today.zodiac.map((z) => (
            <div key={z.branch} className={`relative flex flex-col items-center rounded-xl border py-1.5 ${ZODIAC_TONE[z.relation]}`}>
              <span className="text-xl leading-none">{z.emoji}</span>
              <span className="text-[10px] text-[var(--color-ink-muted)] mt-1">{z.korean}</span>
              {z.branch === myBranch && (
                <span className="absolute -top-1.5 -right-1 text-[9px] font-bold px-1 rounded-full bg-[var(--color-ink)] text-white">나</span>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-[var(--color-ink-faint)]">
          <span><span className="text-emerald-600">●</span> 기운 받는 띠</span>
          <span><span className="text-amber-500">●</span> 조심할 띠</span>
          <span><span className="text-[var(--color-gold)]">●</span> 오늘의 주인공</span>
        </div>
        <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-2 break-keep">{today.line}</p>
      </div>

      <div className={FEED_CARD}>
        {term ? (
          <>
            <p className="text-[10px] font-bold text-[var(--color-gold)]">절기 · {termWhen}</p>
            <p className="font-heading text-[15px] font-bold text-[var(--color-ink)] mt-0.5">🌾 {termWhen === "오늘" ? "오늘은" : `${termWhen}는`} {term.name}</p>
            <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-1.5 break-keep">{term.tip}</p>
          </>
        ) : (
          <div className="flex items-start gap-3">
            <img src={bite.img} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} className="w-14 h-14 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0 break-keep">
              <p className="text-[10px] font-bold text-[var(--color-gold)]">사주 한 입 · {bite.kind}</p>
              <p className="font-heading text-[15px] font-bold text-[var(--color-ink)] mt-0.5">{bite.name}({bite.hanja}) — {bite.tagline}</p>
              <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-1">{bite.desc}</p>
              <Link href="/analysis" className="inline-block text-xs font-semibold text-[var(--color-gold)] mt-1.5">내 사주에도 있을까? →</Link>
            </div>
          </div>
        )}
        {today.son_eomneun_nal && (
          <p className="text-xs text-[var(--color-ink-muted)] mt-2 pt-2 border-t border-[var(--color-border-light)]">👻 오늘은 손없는 날 — 이사·계약하기 좋은 날로 꼽혀요</p>
        )}
      </div>
    </section>
  );
}

// 불러오는 동안 — ①과 같은 자리·크기, ② 얼굴 원 3개
function HomeSkeleton() {
  return (
    <div className="animate-pulse" aria-busy>
      <div className="mx-4 mt-4 rounded-2xl bg-[var(--color-ivory-warm)] px-4 py-3.5 h-[356px]">
        <div className="h-4 w-40 rounded-full bg-white/70 mb-3" />
        <div className="flex gap-3">
          <div className="w-24 h-24 rounded-full bg-white/70 shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-4 rounded bg-white/70" />
            <div className="h-3 w-4/5 rounded bg-white/70" />
            <div className="h-3 w-3/5 rounded bg-white/70" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 px-4 mt-12">
        {[0, 1, 2].map((i) => <div key={i} className="w-16 h-16 rounded-full bg-[var(--color-ivory-warm)]" />)}
      </div>
    </div>
  );
}

function LoggedInHome({ memberId }: { memberId: string }) {
  const [home, setHome] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false);
  const tracked = useRef(false);

  const load = useCallback(() => {
    getHome(memberId)
      .then((h) => {
        setHome(h);
        if (!tracked.current) {
          tracked.current = true;
          track("home_view", { logged_in: true, profiles: h.people.length + (h.me ? 1 : 0) });
        }
      })
      .catch(() => setFailed(true));
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  if (failed) {
    return (
      <div className={`mx-4 mt-4 ${FEED_CARD} text-center`}>
        <img src={FALLBACK_IMG} alt="" className="w-20 h-20 mx-auto object-contain mb-2" />
        <p className="text-sm text-[var(--color-ink-muted)] mb-3">까치가 소식을 가져오지 못했어요</p>
        <button type="button" onClick={() => { setFailed(false); load(); }} className="px-4 py-2 rounded-xl bg-[var(--color-ink)] text-[var(--color-ivory)] text-sm font-semibold">다시 시도</button>
      </div>
    );
  }
  if (!home) return <HomeSkeleton />;

  const total = home.people.length + (home.me ? 1 : 0);
  if (total === 0) {
    return (
      <div className={`mx-4 mt-4 ${FEED_CARD} text-center`}>
        <img src={FALLBACK_IMG} alt="" className="w-24 h-24 mx-auto object-contain mb-3 animate-float" />
        <p className="font-heading text-base font-semibold text-[var(--color-ink)] leading-snug mb-1">내 사주를 등록하면 까치가 매일 아침 소식을 물어다 줘요</p>
        <p className="text-xs text-[var(--color-ink-faint)] mb-4">첫 프로필이 곧 기본 프로필(나)이 돼요</p>
        <Link href="/profile" className="inline-block px-5 py-2.5 rounded-xl bg-[var(--color-ink)] text-[var(--color-ivory)] text-sm font-semibold">내 사주 등록</Link>
      </div>
    );
  }

  return (
    <>
      {home.me ? (
        <TodayHero me={home.me} />
      ) : (
        <div className={`mx-4 mt-4 ${FEED_CARD} text-sm text-[var(--color-ink-muted)]`}>
          기본 프로필(나)을 정하면 오늘의 소식을 여기서 받아요. <Link href="/profile" className="underline underline-offset-2 text-[var(--color-gold)]">정하러 가기</Link>
        </div>
      )}
      <PeopleRow people={home.people} canAdd={total < MAX_PROFILES} hasMe={!!home.me} />
      <KkachiFeed today={home.today} myBranch={home.me?.zodiac_branch} />
    </>
  );
}

// 비로그인 — 나는 어떤 캐릭터일까? 오행이 겹치지 않는 맛보기 4장 + 물음표 실루엣 → 바로 아래 퀵스타트 폼
const PREVIEW_KEYS = ["갑_강", "병_약", "경_강", "계_약"];

function GuestHero({ location }: { location: LocationInfo | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 입력값을 sessionStorage에 두고 /analysis?step=intro로 — 결과 주소라 그 페이지가 자동으로 분석하고 인트로에서 캐릭터를 공개한다
  // (주소 없이 /analysis로 오면 입력 화면부터)
  const handleSubmit = (input: AnalysisInput, name: string) => {
    setBusy(true);
    sessionStorage.setItem("kkachi_analysis_input", JSON.stringify(input));
    sessionStorage.setItem("kkachi_analysis_name", name);
    sessionStorage.removeItem("kkachi_profile_input");
    router.push("/analysis?step=intro");
  };

  return (
    <section className="px-4 pt-5 pb-6 border-b border-[var(--color-border-light)] bg-[var(--color-card)]">
      <h1 className="font-heading text-xl font-bold text-[var(--color-ink)] text-center">나는 어떤 캐릭터일까?</h1>
      <p className="text-xs text-[var(--color-ink-muted)] text-center mt-1 leading-relaxed">생년월일만 넣으면 30초 만에 사주 캐릭터를 찾아 드려요</p>
      <div className="flex items-center justify-center gap-1.5 my-5" aria-hidden>
        {PREVIEW_KEYS.slice(0, 2).map((k) => (
          <img key={k} src={charArtSrc(null, k)} alt="" className="w-14 h-14 rounded-full object-cover opacity-60 border-2 border-white shadow-sm" />
        ))}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--color-gold-faint)] animate-float mx-1">
          <img src={charArtSrc(null, "무_강")} alt="" className="w-full h-full object-cover char-silhouette" />
          <span className="absolute inset-0 flex items-center justify-center font-heading text-4xl font-bold text-white/90">?</span>
        </div>
        {PREVIEW_KEYS.slice(2).map((k) => (
          <img key={k} src={charArtSrc(null, k)} alt="" className="w-14 h-14 rounded-full object-cover opacity-60 border-2 border-white shadow-sm" />
        ))}
      </div>
      <AnalysisForm quick onSubmit={handleSubmit} loading={busy} defaultCity={location?.city} defaultLongitude={location?.longitude} />
      <p className="mt-3 text-center text-[11px] text-[var(--color-ink-faint)]">
        로그인하면 매일 아침 오늘의 소식을 받아요{" "}
        <Link href="/join" className="underline underline-offset-2 text-[var(--color-gold)]">로그인</Link>
      </p>
    </section>
  );
}

// 서비스 영상 — 비로그인 맨 아래에만(유지 여부는 스펙 §6 열린 결정)
function VideoPost() {
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

function GuestHome() {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);
  useEffect(() => {
    track("home_view", { logged_in: false });
    detectLocation().then((loc) => { if (loc) setLocation(loc); }).catch(() => {});
    getToday().then(setToday).catch(() => {}); // 실패하면 까치 소식 칸을 숨긴다
  }, []);
  return (
    <>
      <GuestHero location={location} />
      {today && <KkachiFeed today={today} />}
      <VideoPost />
    </>
  );
}

export default function Home() {
  const memberId = useStorageValue(MEMBER_ID_KEY);
  const dateLabel = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  if (memberId === null) return null; // 하이드레이션 전 — 로그인 여부를 아직 모른다

  return (
    <main className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto">
        <header className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-[var(--color-border-light)] bg-white sticky top-0 z-20">
          <p className="font-heading text-lg font-bold text-[var(--color-ink)]">{dateLabel}</p>
        </header>
        {memberId ? <LoggedInHome memberId={memberId} /> : <GuestHome />}
      </div>
    </main>
  );
}
