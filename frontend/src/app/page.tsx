"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnalysisInput } from "@/types/analysis";
import { getHome, getToday, type HomeData, type SkyData, type TarotToday, type TodayData } from "@/lib/api";
import { detectLocation, type LocationInfo } from "@/lib/location";
import AnalysisForm from "@/components/AnalysisForm";
import MorningBrief from "@/components/MorningBrief";
import TarotCard, { TAROT_FLIPPED_KEY, TAROT_SHUFFLE_MS } from "@/components/TarotCard";
import { HourlyLuckCard } from "@/components/SiunCards";
import FeedPost from "@/components/FeedPost";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { FORECAST_LEVEL_META } from "@/lib/elementColors";
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
/** 카드 머리 규칙(2026-11-06 사용자 확정): 제목 = 카드 이름 한 줄(오늘의 나·오늘 내 사람들·오늘의 띠·별자리·타로카드·사주 한 입·절기·새소식) + 소제목 한 줄까지. 셋째 줄은 두지 않는다 */
const FEED_TITLE = "font-heading text-[15px] font-bold text-[var(--color-ink)]";
/** 제목 아래 소제목 한 줄(회색, PageHeader 설명과 같은 톤) — 그날의 문장이나 카드 설명. 제목·오른쪽 부가 정보에 있는 "오늘"·"내일"은 되풀이하지 않는다(자리 부족, 2026-11-06) */
const FEED_SUB = "text-sm text-[var(--color-ink-muted)] leading-snug mt-0.5 break-keep";
/** 제목 줄 오른쪽 부가 정보(절기 언제·새소식 날짜 — 사주 한 입의 종류는 2026-11-06부터 제목에 "사주 한 입 — 십신(十神)") */
const FEED_ASIDE = "text-xs text-[var(--color-ink-faint)]";
/** 상세 페이지로 가는 링크 — 글자는 늘 "자세히 →"(오늘의 나 → /siun, 타로카드 → /tarot), 자리는 제목 줄 오른쪽 끝. [관리 →]도 같은 모양(2026-11-06 사용자 규칙) */
const FEED_LINK = "shrink-0 text-xs font-semibold text-[var(--color-gold)] whitespace-nowrap active:opacity-70";

// ① 오늘의 나 — 내 캐릭터 + 까치 말풍선(아침 한 마디). 점수는 배지 줄로만, [자세히 →](/siun)는 제목 줄 오른쪽(2026-11-06)
function TodayHero({ me }: { me: NonNullable<HomeData["me"]> }) {
  const f = me.fortune;
  const level = FORECAST_LEVEL_META[f.level] ?? FORECAST_LEVEL_META["평범한 날"];
  return (
    <section className={`mx-4 mt-4 ${FEED_CARD} pb-2`}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className={FEED_TITLE}>오늘의 나</h2>
        <Link href="/siun" className={FEED_LINK}>자세히 →</Link>
      </div>
      <div className="flex gap-3 items-start">
        <div className="flex flex-col items-center shrink-0 w-24">
          <div className="relative">
            <img
              src={charArtSrc(me.character.art_key, me.character.key)}
              alt={me.character.title}
              onError={onCharArtError(me.character.key, level.image)}
              className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-border-light)] bg-[var(--color-gold-faint)]"
            />
            {/* 오늘 레벨 도장 — 그림 위쪽에 운수대통 직인처럼 쾅 찍힌다(globals.css .seal-stamp, 2026-11-06 사용자 제안 · 아래쪽 → 위쪽 같은 날). 배지 줄은 없앰 */}
            <span
              className={`seal-stamp absolute inset-x-0 -top-1 mx-auto w-max text-[10px] font-bold px-2 py-0.5 rounded-md border-2 shadow-sm whitespace-nowrap ${level.color}`}
              style={{ "--seal-rot": "-8deg" } as React.CSSProperties}
            >
              {level.icon} {f.level}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] font-semibold text-[var(--color-ink-muted)] text-center leading-tight">{me.character.title}</p>
        </div>
        <div className="relative flex-1 min-w-0 rounded-2xl bg-[var(--color-ivory)] px-3.5 py-3 break-keep">
          {/* 말풍선 꼬리 — 캐릭터 쪽 */}
          <span className="absolute -left-1.5 top-6 w-3 h-3 rotate-45 bg-[var(--color-ivory)]" aria-hidden />
          <MorningBrief data={f} stripName={me.name} compact />
        </div>
      </div>
      {/* 오늘~모레 — 날마다 머리줄(날짜·점수·날씨·레벨) + 3시간 타일. 주간 시운 칸은 2026-11-06 여기에 합침 */}
      <HourlyLuckCard days={me.week} yongshin={f.yongshin} count={3} embedded className="mt-3 pt-3 border-t border-[var(--color-border-light)]" />
    </section>
  );
}

// ② 오늘 내 사람들 — 캐릭터 얼굴 줄 + 나와 오늘의 궁합 배지 + 오늘 가장 좋은 사람 한 줄 "{이름}님 — 레벨 문장"(♥ 기호·이유 문장 없음, 2026-11-06 사용자) (사주 한 입은 2026-11-06 별도 카드 SajuBiteCard로)
function PeopleRow({ people, canAdd, me }: { people: HomeData["people"]; canAdd: boolean; me: HomeData["me"] }) {
  const best = people
    .filter((p) => p.compat?.level === "좋음")
    .sort((a, b) => (b.compat?.score ?? 0) - (a.compat?.score ?? 0))[0];
  return (
    <section className={`mx-4 mt-3 ${FEED_CARD}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={FEED_TITLE}>오늘 내 사람들</h2>
        <Link href="/profile" className={FEED_LINK}>관리 →</Link>
      </div>
      <div className="-mx-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-4 min-w-max pt-1 pb-1">
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
      ) : best && me ? (
        <p className="mt-2 text-xs text-[var(--color-ink-light)] leading-relaxed break-keep">
          <span className="font-semibold text-emerald-700">{best.name}님</span> — {best.compat?.headline}
        </p>
      ) : null}
    </section>
  );
}

// 사주 한 입(로그인) — 신살·십신 하나 + "내 사람들에게도 있을까?" [확인하기] → 그 기운을 가진 사람(나 포함)의 캐릭터 얼굴 줄.
// 2026-11-06 ② 카드 안에서 별도 카드로(사용자), 결과는 글("…에게 있어요") 대신 얼굴 줄로(사용자 "결과도 어색해 — 캐릭터 카드로"). 확인 상태는 저장하지 않는다.
// 오늘의 것은 나 포함 내 사람들 중 누군가 가진 신살·십신 가운데 날짜 순번으로 고른다(사용자 "누르면 가진 사람이 나와야" — 비로그인의 19일 순번과 다름).
// 아무도 아무것도 없을 때만 날짜 순번 그대로
function SajuBiteCard({ date, people, me }: { date: string; people: HomeData["people"]; me: HomeData["me"] }) {
  const [revealed, setRevealed] = useState(false);
  const marks = [me?.marks, ...people.map((p) => p.marks)];
  const held = BITES.filter((b) => marks.some((m) => m?.[b.field].includes(b.mark)));
  const bite = held.length ? held[dayNoOf(date) % held.length] : biteOf(date);
  const has = (m: { sinsal: string[]; sipsin: string[] } | undefined) => !!m?.[bite.field].includes(bite.mark);
  const holders = [
    ...(me && has(me.marks) ? [{ id: me.profile_id, name: me.name, character: me.character, isMe: true }] : []),
    ...people.filter((p) => has(p.marks)).map((p) => ({ id: p.profile_id, name: p.name, character: p.character, isMe: false })),
  ];
  return (
    <section className={`mx-4 mt-3 ${FEED_CARD}`}>
      <BiteIntro bite={bite} />
      {!revealed ? (
        <button type="button" onClick={() => setRevealed(true)} className="mt-3 w-full flex items-center justify-between gap-2 rounded-xl bg-[var(--color-gold-faint)] px-3.5 py-2.5 text-left active:opacity-80">
          <span className="text-[13px] font-semibold text-[var(--color-ink)] break-keep">
            {bite.name}({bite.hanja}), {people.length ? "내 사람들에게도 있을까?" : "나에게도 있을까?"}
          </span>
          <span className="shrink-0 text-xs font-bold text-[var(--color-gold)]">확인하기 →</span>
        </button>
      ) : (
        <div className="mt-3 rounded-xl bg-[var(--color-gold-faint)] px-3.5 py-2.5 break-keep">
          {holders.length ? (
            <>
              <p className="text-[10px] font-bold text-[var(--color-gold)]">{bite.name}({bite.hanja}) 가진 사람 · {holders.length}명</p>
              <div className="flex gap-3 mt-2 overflow-x-auto no-scrollbar">
                {holders.map((h) => (
                  <div key={h.id} className="flex flex-col items-center gap-1 w-14 shrink-0">
                    <div className="relative">
                      <img
                        src={charArtSrc(h.character.art_key, h.character.key)}
                        alt=""
                        onError={onCharArtError(h.character.key, FALLBACK_IMG)}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-gold)] bg-white"
                      />
                      {h.isMe && <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full bg-[var(--color-ink)] text-white">나</span>}
                    </div>
                    <span className="text-[11px] text-[var(--color-ink)] truncate w-14 text-center">{h.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[12px] text-[var(--color-ink-muted)]">오늘 기운을 가진 사람이 없어요 — 내일은 다른 기운이에요.</p>
          )}
        </div>
      )}
    </section>
  );
}

// ③ 까치 소식 (specs/home §3-5) — 사주 한 입 · 새소식(맨 아래, 노출 조건은 열린 결정), 종류마다 한 장 (오늘의 띠는 TodayZodiacCard)

/** 운영자가 쓰는 새소식 — 맨 위가 최신, 30일 안 것 하나만 홈에 뜬다. 새 소식은 맨 위에 한 줄 */
const KKACHI_NEWS: { date: string; emoji: string; title: string; body: string; href?: string }[] = [
  { date: "2026-11-05", emoji: "🃏", title: "오늘의 타로카드가 생겼어요", body: "까치가 매일 아침 타로 카드 한 장을 뽑아 둬요. 홈에서 뒤집어 보세요.", href: "/tarot" },
  { date: "2026-10-25", emoji: "🪪", title: "사주 분석도 궁합처럼 골라서", body: "저장한 프로필을 카드에서 바로 고르거나, 직접 입력해 저장 없이 바로 볼 수 있어요.", href: "/analysis" },
  { date: "2026-10-18", emoji: "💞", title: "궁합에 시운 탭이 생겼어요", body: "두 분의 오늘·내일·모레 궁합과 2주 안에 함께하기 좋은 날을 알려 드려요.", href: "/compatibility" },
];
const NEWS_DAYS = 30;

/** 사주 한 입 — 만세력 섹션의 신살 9 + 십신 10을 날마다 하나씩(19일 주기). field·mark = 홈 응답 marks에서 찾을 키 */
type Bite = { kind: string; name: string; hanja: string; tagline: string; desc: string; img: string; field: "sinsal" | "sipsin"; mark: string };
const BITES: Bite[] = [
  ...SINSAL_ORDER.map((name) => ({ kind: "신살(神殺)", name, hanja: SINSAL_INFO[name].hanja, tagline: SINSAL_INFO[name].tagline, desc: SINSAL_INFO[name].desc, img: `/kkachi/sinsal/sinsal_${name}.png`, field: "sinsal" as const, mark: name })),
  ...Object.entries(SIPSIN_INFO).map(([hanja, v]) => ({ kind: "십신(十神)", name: v.korean, hanja, tagline: v.tagline, desc: v.desc, img: `/kkachi/sipsin/sipsin_${v.korean}.png`, field: "sipsin" as const, mark: hanja })),
];
const dayNoOf = (iso: string) => Math.floor(Date.parse(iso) / 86_400_000);
const biteOf = (iso: string) => BITES[dayNoOf(iso) % BITES.length];

function BiteIntro({ bite }: { bite: Bite }) {
  return (
    <div>
      <h2 className={FEED_TITLE}>사주 한 입 — {bite.kind}</h2>
      <div className="flex items-start gap-3 mt-2">
        <img src={bite.img} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <p className="text-sm text-[var(--color-ink)] leading-snug">{bite.name}({bite.hanja}) — {bite.tagline}</p>
          <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-1">{bite.desc}</p>
        </div>
      </div>
    </div>
  );
}

/** 띠·별자리 칸 테두리·바탕 — 관계 값(백엔드)에 따라 색만 고른다: 오늘의 주인공 금 · 기운 받는 초록 · 조심할 주황 */
const RELATION_TONE: Record<string, string> = {
  "나": "border-[var(--color-gold)] bg-[var(--color-gold-faint)]",
  "합": "border-[var(--color-gold)] bg-[var(--color-gold-faint)]",
  "삼합": "border-emerald-300 bg-emerald-50",
  "육합": "border-emerald-300 bg-emerald-50",
  "삼각": "border-emerald-300 bg-emerald-50",
  "육각": "border-emerald-300 bg-emerald-50",
  "충": "border-amber-300 bg-amber-50",
  "원진": "border-amber-300 bg-amber-50",
  "사각": "border-amber-300 bg-amber-50",
  "보통": "border-[var(--color-border-light)] bg-white",
};

/** 오늘의 띠 배지 — 관계 값(백엔드) → 이름·색. 상자엔 label(기운 받는 띠…), 제목 줄 오른쪽엔 내 띠의 오늘 등급 grade(최고·좋음·보통·주의 — 라벨 없이도
 *  오늘이 내게 이로운 날인지 보이게, 2026-11-06 사용자). 격자 아래 범례 줄 대신(2026-11-06, 오늘의 나와 같은 식으로 컴팩트하게) */
const ZODIAC_RELATION_BADGE: Record<string, { label: string; grade: string; cls: string }> = {
  "나": { label: "오늘의 주인공", grade: "👑 최고", cls: "bg-[var(--color-gold-faint)] text-[var(--color-ink)] border-[var(--color-gold)]" },
  "삼합": { label: "기운 받는 띠", grade: "🌟 좋음", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "육합": { label: "기운 받는 띠", grade: "🌟 좋음", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "충": { label: "조심할 띠", grade: "🚨 주의", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "원진": { label: "조심할 띠", grade: "🚨 주의", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "보통": { label: "보통", grade: "보통", cls: "bg-white text-[var(--color-ink-muted)] border-[var(--color-border-light)]" },
};

// 오늘의 띠 — 오늘 일지와 12띠 관계 + 내 띠 "나" 배지 + 띠별 한 줄(옛 신문 띠별 운세처럼, 칸을 누르면 그 띠). 처음엔 내 띠, 없으면 오늘의 띠 (2026-10-26)
// 2026-11-06 오늘의 나와 같은 식으로 컴팩트하게 — 범례 줄 뺌(관계는 상자 배지), 격자·상자 여백 줄임, 상자 글자 10/12px·굵게 없음
function TodayZodiacCard({ today, myBranch, className = "" }: { today: TodayData; myBranch?: string; className?: string }) {
  const [picked, setPicked] = useState(myBranch ?? today.animal.branch);
  const sel = today.zodiac.find((z) => z.branch === picked) ?? today.zodiac[0];
  const mine = myBranch ? today.zodiac.find((z) => z.branch === myBranch) : undefined;
  return (
    <div className={`${FEED_CARD} ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className={FEED_TITLE}>오늘의 띠</h2>
        <span className="flex items-center gap-2">
          {/* 내 띠의 오늘 등급 — 어떤 칸을 눌렀든 늘 내 띠 기준(기본 프로필 있을 때만) */}
          {mine && <Badge cls={ZODIAC_RELATION_BADGE[mine.relation].cls}>{mine.emoji} {ZODIAC_RELATION_BADGE[mine.relation].grade}</Badge>}
          <Link href="/zodiac" className={FEED_LINK}>자세히 →</Link>
        </span>
      </div>
      <p className={FEED_SUB}>
        {today.day_kor}({today.day_pillar})일 — {today.animal.color} {today.animal.korean}의 날
      </p>
      <div className="grid grid-cols-6 gap-1 mt-2">
        {today.zodiac.map((z) => (
          <button type="button" key={z.branch} onClick={() => setPicked(z.branch)} aria-pressed={z.branch === sel.branch}
            className={`relative flex flex-col items-center rounded-xl border py-1 ${RELATION_TONE[z.relation]} ${z.branch === sel.branch ? "ring-2 ring-[var(--color-ink)]/70" : ""}`}>
            <span className="text-lg leading-none">{z.emoji}</span>
            <span className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">{z.korean}</span>
            {z.branch === myBranch && (
              <span className="absolute -top-1.5 -right-1 text-[9px] font-bold px-1 rounded-full bg-[var(--color-ink)] text-white">나</span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-2 rounded-xl bg-[var(--color-ivory)] px-3 py-2 break-keep">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-[var(--color-ink-muted)]">
            <span className="text-[var(--color-ink)]">{sel.emoji} {sel.korean}띠</span> · {sel.years.join("·")}년생
          </p>
          <Badge cls={`${ZODIAC_RELATION_BADGE[sel.relation].cls} shrink-0`}>{ZODIAC_RELATION_BADGE[sel.relation].label}</Badge>
        </div>
        <p className="text-[12px] text-[var(--color-ink)] leading-relaxed mt-0.5">{sel.advice}</p>
      </div>
    </div>
  );
}

type Horoscope = NonNullable<HomeData["me"]>["horoscope"];

/** 오늘의 별자리 상자의 관계 말 — 격자 아래 범례 줄 대신(2026-11-06, 띠 카드와 같은 식). 보통은 적지 않는다 */
const STAR_RELATION_LABEL: Record<string, string> = {
  "합": "달이 머무는 별자리", "삼각": "기운 받는 별자리", "육각": "기운 받는 별자리", "사각": "조심할 별자리", "충": "조심할 별자리",
};

// 오늘의 별자리 — 오늘 달·태양 별자리 + 내 출생 차트 칩(☉☽↑) + 12별자리 격자(칸을 누르면 그 별자리 한 줄·행운의 아이템).
// 내 태양 별자리 칸은 달·상승까지 넣은 개인판(me.horoscope) 문장 — 이름 접두는 뗀다(stripName, 2026-11-06 오늘의 나와 같게 "어차피 알고 있어"), 처음엔 내 별자리(없으면 오늘 달의 별자리) (2026-10-30)
// 2026-11-06 띠 카드와 같은 식으로 컴팩트하게 — 범례 줄 뺌(관계 말은 상자 첫 줄), 격자·상자 여백 줄임, 상자 글자 10/12/11px·굵게 없음
function TodayStarsCard({ sky, mine, stripName, className = "" }: { sky: SkyData; mine?: Horoscope; stripName?: string; className?: string }) {
  const [picked, setPicked] = useState(mine?.chart.sun ?? sky.moon);
  const byKey = (key: string) => sky.signs.find((s) => s.key === key) ?? sky.signs[0];
  const sel = byKey(picked);
  const moon = byKey(sky.moon);
  const text = mine && sel.key === mine.chart.sun ? mine : sel;
  const prefix = stripName ? `${stripName}님, ` : "";
  const headline = text === mine && text.headline.startsWith(prefix) ? text.headline.slice(prefix.length) : text.headline;
  const level = FORECAST_LEVEL_META[text.level] ?? FORECAST_LEVEL_META["평범한 날"];
  const chip = "bg-[var(--color-ivory)] text-[var(--color-ink)] border-[var(--color-border-light)]";
  return (
    <div className={`${FEED_CARD} ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className={FEED_TITLE}>오늘의 별자리</h2>
        <Link href="/stars" className={FEED_LINK}>자세히 →</Link>
      </div>
      <p className={FEED_SUB}>
        달이 {moon.symbol} {moon.korean}자리를 지나요 · {sky.moon_phase}
      </p>
      {mine && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge cls={chip}>☉ {byKey(mine.chart.sun).korean}</Badge>
          <Badge cls={chip}>☽ {byKey(mine.chart.moon).korean}{mine.chart.uncertain.includes("moon") ? "?" : ""}</Badge>
          {mine.chart.asc ? (
            <Badge cls={chip}>↑ {mine.chart.asc_signs.map((k) => byKey(k).korean).join(" 또는 ")}</Badge>
          ) : (
            <span className="text-[10px] text-[var(--color-ink-faint)]">출생 시간을 넣으면 첫인상 별자리까지 봐요</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-6 gap-1 mt-2">
        {sky.signs.map((s) => (
          <button type="button" key={s.key} onClick={() => setPicked(s.key)} aria-pressed={s.key === sel.key}
            className={`relative flex flex-col items-center rounded-xl border py-1 ${RELATION_TONE[s.relation]} ${s.key === sel.key ? "ring-2 ring-[var(--color-ink)]/70" : ""}`}>
            <span className="text-lg leading-none">{s.symbol}</span>
            <span className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">{s.korean}</span>
            {s.key === mine?.chart.sun && (
              <span className="absolute -top-1.5 -right-1 text-[9px] font-bold px-1 rounded-full bg-[var(--color-ink)] text-white">나</span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-2 rounded-xl bg-[var(--color-ivory)] px-3 py-2 break-keep">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-[var(--color-ink-muted)]">
            <span className="text-[var(--color-ink)]">{sel.symbol} {sel.korean}자리</span> · {sel.range}{STAR_RELATION_LABEL[sel.relation] ? ` · ${STAR_RELATION_LABEL[sel.relation]}` : ""}
          </p>
          <Badge cls={`${level.color} shrink-0`}>{level.icon} {text.level}</Badge>
        </div>
        <p className="text-[12px] text-[var(--color-ink)] leading-relaxed mt-0.5">{headline}</p>
        <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">✦ {text.action}</p>
        {text.caution && <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">✕ {text.caution}</p>}
        <p className="text-[10px] text-[var(--color-ink-faint)] mt-1">행운의 아이템 · {text.lucky_item}</p>
      </div>
    </div>
  );
}

const ORIENTATION_BADGE: Record<string, string> = {
  "정방향": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "역방향": "bg-amber-100 text-amber-800 border-amber-200",
};

// 오늘의 타로카드 — 1909 클래식 덱 한 장(사람·날짜로 정해짐). 뒷면 → 누르면 셔플 떨림 → 앞면·이름·정/역·한 줄 → 일진 교차 한 줄(사람 카드만).
// 뒤집은 날짜는 sessionStorage에 두어 다시 와도 또 안 뒤집는다 (V9-1, 2026-11-05)
function TodayTarotCard({ tarot, className = "" }: { tarot: TarotToday; className?: string }) {
  const stored = useStorageValue(TAROT_FLIPPED_KEY, "session");
  const [flippedNow, setFlippedNow] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const flipped = flippedNow || stored === tarot.date;
  const person = tarot.identity === "person";
  const c = tarot.card;
  const flip = () => {
    if (shuffling || flipped) return;
    setShuffling(true);
    setTimeout(() => {
      setShuffling(false);
      setFlippedNow(true);
      try { sessionStorage.setItem(TAROT_FLIPPED_KEY, tarot.date); } catch { /* 저장 못 해도 이번 화면은 뒤집힌다 */ }
      track("tarot_flip", { spread: "daily", orientation: c.orientation, identity: tarot.identity });
    }, TAROT_SHUFFLE_MS);
  };
  return (
    <div className={`${FEED_CARD} ${className}`}>
      <div className="flex items-baseline justify-between">
        <h2 className={FEED_TITLE}>오늘의 타로카드</h2>
        <Link href="/tarot" className={FEED_LINK}>자세히 →</Link>
      </div>
      <p className={FEED_SUB}>
        {person ? "하루 한 장, 사람마다 정해진 카드예요" : "내 사주를 보면 나만의 카드가 생겨요"}
      </p>
      <div className="flex flex-col items-center mt-3">
        <TarotCard card={c} flipped={flipped} shuffling={shuffling} onFlip={flip} size="sm" />
        {!flipped ? (
          <p className="text-xs text-[var(--color-ink-muted)] mt-2">{shuffling ? "카드를 섞는 중…" : "카드를 눌러 뒤집어 보세요"}</p>
        ) : (
          <div className="mt-2.5 w-full score-pop break-keep">
            <div className="flex items-center justify-center gap-2">
              <span className="font-heading text-[15px] font-bold text-[var(--color-ink)]">{c.name}</span>
              <Badge cls={ORIENTATION_BADGE[c.orientation]}>{c.orientation}</Badge>
            </div>
            <p className="text-[13px] text-[var(--color-ink)] leading-relaxed text-center mt-1">{c.line}</p>
            {tarot.cross && (
              <div className="mt-2.5 rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5">
                <p className="text-[12px] text-[var(--color-ink-muted)] leading-relaxed break-keep">
                  {/* 문장마다 한 줄 — "오늘 일진과 함께 보면, 첫 문장." / "둘째 문장." (굵게·가운뎃점 없음, 2026-11-06 사용자) */}
                  {`오늘 일진과 함께 보면, ${tarot.cross}`.split(". ").map((s, i, a) => <span key={i} className="block">{i < a.length - 1 ? `${s}.` : s}</span>)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** showBite: 비로그인만 — 로그인은 사주 한 입이 ② 다음 별도 카드 SajuBiteCard (2026-10-26 ② 안 → 2026-11-06 분리). 비로그인은 사주 한 입과 절기를 둘 다 따로 카드로(2026-11-06 사용자 — 전에는 절기가 있으면 사주 한 입을 숨겼다) */
function KkachiFeed({ today, showBite = false }: { today: TodayData; showBite?: boolean }) {
  const news = KKACHI_NEWS.find((n) => dayNoOf(today.date) - dayNoOf(n.date) <= NEWS_DAYS);
  const term = today.solar_term;
  const termWhen = term ? (term.days === 0 ? "오늘" : term.days === 1 ? "내일" : `${term.days}일 뒤`) : "";

  return (
    <section className="mt-3 px-4 space-y-3">
      {showBite && (
        <div className={FEED_CARD}>
          <BiteIntro bite={biteOf(today.date)} />
          <Link href="/analysis" className="inline-block text-xs font-semibold text-[var(--color-gold)] mt-2 ml-[68px]">내 사주에도 있을까? →</Link>
        </div>
      )}
      {(term || today.son_eomneun_nal) && <div className={FEED_CARD}>
        {term && (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className={FEED_TITLE}>절기</h2>
              <span className={FEED_ASIDE}>{termWhen}</span>
            </div>
            <p className={FEED_SUB}>🌾 {term.name}</p>
            <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-1.5 break-keep">{term.tip}</p>
          </>
        )}
        {today.son_eomneun_nal && (
          <p className={`text-xs text-[var(--color-ink-muted)] ${term ? "mt-2 pt-2 border-t border-[var(--color-border-light)]" : ""}`}>👻 오늘은 손없는 날 — 이사·계약하기 좋은 날로 꼽혀요</p>
        )}
      </div>}

      {news && (
        <Link href={news.href ?? "#"} className={`${FEED_CARD} flex items-start gap-3 active:opacity-80`}>
          <span className="text-2xl shrink-0">{news.emoji}</span>
          <span className="flex-1 min-w-0 break-keep">
            <span className="flex items-baseline justify-between">
              <span className={FEED_TITLE}>새소식</span>
              <span className={FEED_ASIDE}>{news.date.slice(5).replace("-", ".")}</span>
            </span>
            <span className={`block ${FEED_SUB}`}>{news.title}</span>
            <span className="block text-xs text-[var(--color-ink-muted)] leading-relaxed mt-1">{news.body}</span>
          </span>
        </Link>
      )}
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
        <>
          <TodayHero me={home.me} />
          <TodayTarotCard tarot={home.me.tarot} className="mx-4 mt-3" />
          <TodayZodiacCard today={home.today} myBranch={home.me.zodiac_branch} className="mx-4 mt-3" />
          <TodayStarsCard sky={home.today.sky} mine={home.me.horoscope} stripName={home.me.name} className="mx-4 mt-3" />
        </>
      ) : (
        <div className={`mx-4 mt-4 ${FEED_CARD} text-sm text-[var(--color-ink-muted)]`}>
          기본 프로필(나)을 정하면 오늘의 소식을 여기서 받아요. <Link href="/profile" className="underline underline-offset-2 text-[var(--color-gold)]">정하러 가기</Link>
        </div>
      )}
      {!home.me && (
        <>
          <TodayTarotCard tarot={home.today.tarot} className="mx-4 mt-3" />
          <TodayZodiacCard today={home.today} className="mx-4 mt-3" />
          <TodayStarsCard sky={home.today.sky} className="mx-4 mt-3" />
        </>
      )}
      <PeopleRow people={home.people} canAdd={total < MAX_PROFILES} me={home.me} />
      <SajuBiteCard date={home.date} people={home.people} me={home.me} />
      <KkachiFeed today={home.today} />
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
      {today && (
        <>
          <TodayTarotCard tarot={today.tarot} className="mx-4 mt-3" />
          <TodayZodiacCard today={today} className="mx-4 mt-3" />
          <TodayStarsCard sky={today.sky} className="mx-4 mt-3" />
          <KkachiFeed today={today} showBite />
        </>
      )}
      <VideoPost />
    </>
  );
}

export default function Home() {
  const memberId = useStorageValue(MEMBER_ID_KEY);

  if (memberId === null) return null; // 하이드레이션 전 — 로그인 여부를 아직 모른다

  return (
    <main className="min-h-screen pb-8">
      <div className="max-w-lg mx-auto">
        {memberId ? <LoggedInHome memberId={memberId} /> : <GuestHome />}
      </div>
    </main>
  );
}
