"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import SajuBiteCard from "@/components/SajuBiteCard";
import { getHome, getToday, type HomeData, type TodayData } from "@/lib/api";
import { KKACHI_NEWS } from "@/lib/news";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { useStorageValue } from "@/lib/useStorageValue";
import { track } from "@/lib/track";

// 까치 신문 (2026-11-08, specs/news/index.md) — 홈에서 떼어 낸 읽을거리 한 면: 새소식(전부) → 사주 한 입 → 다음 절기 → 손없는 날(14일).
// 로그인은 GET /members/{id}/home 한 번(today + 사주 한 입용 marks), 비로그인은 GET /kkachi/today 한 번. 카드 머리는 제목 + 소제목 두 줄까지(홈 카드 규약).

const CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-4";
const TITLE = "font-heading text-[15px] font-bold text-[var(--color-ink)]";
const SUB = "text-sm text-[var(--color-ink-muted)] leading-snug mt-0.5 break-keep";
const ASIDE = "text-xs text-[var(--color-ink-faint)] shrink-0";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const longDate = (iso: string) => { const d = parse(iso); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY[d.getDay()]}요일`; };
const shortDate = (iso: string) => { const d = parse(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY[d.getDay()]}요일`; };
const chipDate = (iso: string) => { const d = parse(iso); return `${d.getMonth() + 1}/${d.getDate()} ${WEEKDAY[d.getDay()]}`; };

export default function NewsPage() {
  const memberId = useStorageValue(MEMBER_ID_KEY);
  const [today, setToday] = useState<TodayData | null>(null);
  const [home, setHome] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false);
  const [moreNews, setMoreNews] = useState(false);

  useEffect(() => {
    if (memberId === null) return; // 하이드레이션 전
    const load = memberId
      ? getHome(memberId).then((h) => { setHome(h); return h.today; }).catch(() => getToday())  // 지워진 회원 등 — 날짜판으로
      : getToday();
    load.then((t) => { setToday(t); track("news_view", { page: "news", logged_in: !!memberId }); }).catch(() => setFailed(true));
  }, [memberId]);

  if (memberId === null) return null;

  const [latest, ...older] = KKACHI_NEWS;
  const term = today?.solar_term ?? null;
  const termWhen = term ? (term.days === 0 ? "오늘" : term.days === 1 ? "내일" : `${term.days}일 뒤`) : "";

  return (
    <main className="page">
      <div className="page__inner">
        <PageHeader
          title="까치 신문"
          description={today ? `${longDate(today.date)} · ${today.day_kor}(${today.day_pillar}) — ${today.animal.color} ${today.animal.korean}의 날` : "새소식 · 사주 한 입 · 절기 · 손없는 날"}
        />

        {failed && <div className={`${CARD} text-center text-sm text-[var(--color-ink-muted)]`}>까치가 오늘 소식을 가져오지 못했어요. 잠시 뒤 다시 열어 주세요.</div>}
        {!failed && !today && <LoadingSpinner />}

        {today && (
          <>
            {/* 1. 새소식 — 최신 한 건은 30일이 지나도 늘, 나머지는 접힌 "지난 소식" */}
            <section className={CARD}>
              <div className="flex items-baseline justify-between">
                <h2 className={TITLE}>새소식</h2>
                <span className={ASIDE}>{latest.date.slice(5).replace("-", ".")}</span>
              </div>
              <Link href={latest.href ?? "#"} className="flex items-start gap-3 mt-1 active:opacity-80">
                <span className="text-2xl shrink-0 leading-none mt-0.5">{latest.emoji}</span>
                <span className="flex-1 min-w-0 break-keep">
                  <span className={`block ${SUB} !mt-0 text-[var(--color-ink)]`}>{latest.title}</span>
                  <span className="block text-xs text-[var(--color-ink-muted)] leading-relaxed mt-1">{latest.body}</span>
                </span>
              </Link>
              {older.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[var(--color-border-light)]">
                  <button type="button" onClick={() => setMoreNews((v) => !v)} className="text-xs font-semibold text-[var(--color-gold)] active:opacity-70">
                    지난 소식 {older.length}개 {moreNews ? "▴" : "▾"}
                  </button>
                  {moreNews && (
                    <ul className="mt-1.5 space-y-1">
                      {older.map((n) => (
                        <li key={n.date}>
                          <Link href={n.href ?? "#"} className="flex items-baseline gap-2 text-xs active:opacity-70">
                            <span className="text-[var(--color-ink-faint)] shrink-0">{n.date.slice(5).replace("-", ".")}</span>
                            <span className="text-[var(--color-ink-light)] break-keep">{n.emoji} {n.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            {/* 2. 사주 한 입 — 홈에서 옮김. 로그인은 내 사람들 기준 + 확인하기, 그 밖은 19일 순번 + /analysis */}
            <SajuBiteCard date={today.date} people={home?.people} me={home?.me ?? null} className={CARD} />

            {/* 3. 절기 — 늘 다음 절기 하나(오늘이 절기면 오늘) */}
            {term && (
              <section className={CARD}>
                <div className="flex items-baseline justify-between">
                  <h2 className={TITLE}>절기</h2>
                  <span className={ASIDE}>{termWhen}</span>
                </div>
                <p className={SUB}>🌾 {term.name} · {shortDate(term.date)}</p>
                <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-1.5 break-keep">{term.tip}</p>
              </section>
            )}

            {/* 4. 손없는 날 — 오늘부터 14일 안 날짜 칩, 오늘은 금색 */}
            <section className={CARD}>
              <div className="flex items-baseline justify-between">
                <h2 className={TITLE}>손없는 날</h2>
                {today.son_eomneun_nal && <span className={ASIDE}>오늘</span>}
              </div>
              <p className={SUB}>이사·계약하기 좋은 날로 꼽혀요 — 음력 9·10·19·20·29·30일</p>
              {today.son_eomneun_days.length ? (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {today.son_eomneun_days.map((d) => {
                    const isToday = d === today.date;
                    return (
                      <span key={d} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isToday ? "bg-[var(--color-gold)] border-[var(--color-gold)] text-white" : "bg-[var(--color-ivory)] border-[var(--color-border-light)] text-[var(--color-ink)]"}`}>
                        👻 {isToday ? "오늘 " : ""}{chipDate(d)}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-ink-muted)] mt-2">2주 안에는 없어요.</p>
              )}
            </section>
          </>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-[var(--color-ink-muted)] active:opacity-70">← 홈으로</Link>
        </div>
      </div>
    </main>
  );
}
