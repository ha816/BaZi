"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getHoroscopeWeek, type HoroscopeWeek, type SkySign } from "@/lib/api";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { parseStored, useStorageValue } from "@/lib/useStorageValue";
import { track } from "@/lib/track";
import type { AnalysisInput } from "@/types/analysis";

// 별자리 상세 (2026-11-06, specs/stars/index.md) — 옛 신문의 "별자리별 운세" 한 면. GET /horoscope/week 한 번:
// 내 별자리(개인판) → 이번 주 달의 길 → 12별자리 오늘. 로그인은 기본 프로필, 비로그인은 /analysis 입력값, 둘 다 없으면 일반판만.
// 카드 머리는 제목 + 소제목 두 줄까지(홈 카드 규약).

const CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-4";
const TITLE = "font-heading text-[15px] font-bold text-[var(--color-ink)]";
const SUB = "text-sm text-[var(--color-ink-muted)] leading-snug mt-0.5 break-keep";

/** 오늘 달과의 관계 → 색(홈 격자와 같은 표) */
const RELATION_DOT: Record<string, string> = {
  "합": "bg-[var(--color-gold)]",
  "삼각": "bg-emerald-500",
  "육각": "bg-emerald-500",
  "사각": "bg-amber-500",
  "충": "bg-amber-500",
  "보통": "bg-[var(--color-border)]",
};
const RELATION_LABEL: Record<string, string> = {
  "합": "달이 머무는 날", "삼각": "기운 받는 날", "육각": "기운 받는 날", "사각": "조심할 날", "충": "조심할 날", "보통": "보통인 날",
};
/** 출생 차트 세 자리 — 기호·이름·뜻 한 줄 */
const CHART_POINTS: { key: "sun" | "moon" | "asc"; symbol: string; name: string; meaning: string }[] = [
  { key: "sun", symbol: "☉", name: "태양", meaning: "의지와 정체성 — 흔히 말하는 '내 별자리'" },
  { key: "moon", symbol: "☽", name: "달", meaning: "감정과 컨디션 — 하루의 기분을 읽는 자리" },
  { key: "asc", symbol: "↑", name: "상승", meaning: "첫인상과 몸 — 태어난 시각에 동쪽에서 떠오르던 별자리" },
];
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

function dayLabel(iso: string, i: number) {
  if (i === 0) return "오늘";
  if (i === 1) return "내일";
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY[d.getDay()]})`;
}

export default function StarsPage() {
  const memberId = useStorageValue(MEMBER_ID_KEY);
  const inputRaw = useStorageValue("kkachi_analysis_input", "session");
  const [data, setData] = useState<HoroscopeWeek | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);  // 12별자리 중 펼쳐 볼 것(달의 길 기준) — 처음엔 내 별자리
  const [dayIdx, setDayIdx] = useState(0);

  useEffect(() => {
    if (memberId === null || inputRaw === null) return; // 하이드레이션 전
    const input = parseStored<AnalysisInput>(inputRaw);
    let name = "";
    try { name = sessionStorage.getItem("kkachi_analysis_name") ?? ""; } catch { /* 이름 없이 */ }
    getHoroscopeWeek({ memberId, input, name })
      .then((d) => {
        setData(d);
        track("stars_view", { page: "stars", logged_in: !!memberId, personal: !!d.me });
      })
      .catch(() => setFailed(true));
  }, [memberId, inputRaw]);

  if (memberId === null || inputRaw === null) return null;

  const byKey = (key: string) => data?.today.signs.find((s) => s.key === key) ?? data?.today.signs[0];
  const mySun = data?.me?.chart.sun ?? null;
  const focus = picked ?? mySun ?? data?.today.moon ?? null;  // 달의 길에서 따라갈 별자리
  const focusSign = focus ? byKey(focus) : undefined;
  const moon = data ? byKey(data.today.moon) : undefined;
  const today = data?.me?.days[0];  // 개인판 오늘(있을 때)

  return (
    <main className="page">
      <div className="page__inner">
        <PageHeader
          title="오늘의 별자리"
          description={moon && data ? `달이 ${moon.symbol} ${moon.korean}자리를 지나요 · ${data.today.moon_phase}` : "출생 차트와 오늘 하늘로 보는 하루"}
        />

        {failed && <div className={`${CARD} text-center text-sm text-[var(--color-ink-muted)]`}>까치가 하늘을 읽지 못했어요. 잠시 뒤 다시 열어 주세요.</div>}
        {!failed && !data && <LoadingSpinner />}

        {data && (
          <>
            {data.me && today && focusSign && mySun ? (
              <MyStarsCard me={data.me} today={today} sign={byKey(mySun)!} byKey={byKey} />
            ) : (
              <section className={CARD}>
                <h2 className={TITLE}>내 별자리</h2>
                <p className={SUB}>
                  {memberId ? (
                    <>기본 프로필을 정하면 내 출생 차트로 봐요. <Link href="/profile" className="underline underline-offset-2 text-[var(--color-gold)]">프로필 →</Link></>
                  ) : (
                    <>내 사주를 먼저 보면 출생 차트로 봐요. <Link href="/analysis" className="underline underline-offset-2 text-[var(--color-gold)]">내 사주 보기 →</Link></>
                  )}
                </p>
              </section>
            )}

            <MoonPathCard data={data} focus={focusSign} dayIdx={dayIdx} setDayIdx={setDayIdx} />

            <section className={CARD}>
              <h2 className={TITLE}>별자리별 오늘</h2>
              <p className={SUB}>달이 {moon?.symbol} {moon?.korean}자리에 있을 때 12별자리의 하루 — 색은 오늘 달과의 관계예요</p>
              <ul className="mt-3 divide-y divide-[var(--color-border-light)]">
                {data.today.signs.map((s) => (
                  <SignRow key={s.key} sign={s} mine={s.key === mySun} focused={s.key === focus} onPick={() => { setPicked(s.key); setDayIdx(0); }} />
                ))}
              </ul>
            </section>
          </>
        )}

        <p className="text-center">
          <Link href="/" className="text-xs font-semibold text-[var(--color-ink-muted)]">← 홈으로</Link>
        </p>
      </div>
    </main>
  );
}

/** 내 별자리 — 오늘 개인판(이름 접두 headline) + 출생 차트 세 자리와 뜻. 상승이 2시간 블록 안에서 바뀌면 "처녀 또는 천칭" */
function MyStarsCard({ me, today, sign, byKey }: { me: NonNullable<HoroscopeWeek["me"]>; today: NonNullable<HoroscopeWeek["me"]>["days"][number]; sign: SkySign; byKey: (k: string) => SkySign | undefined }) {
  const chart = me.chart;
  const chartText = (key: "sun" | "moon" | "asc") => {
    if (key === "asc") return chart.asc_signs.length ? chart.asc_signs.map((k) => byKey(k)?.korean ?? k).join(" 또는 ") : null;
    const k = chart[key];
    return `${byKey(k)?.korean ?? k}${chart.uncertain.includes(key) ? "?" : ""}`;
  };
  return (
    <section className={CARD}>
      <h2 className={TITLE}>내 별자리</h2>{/* 레벨 배지(✨ 평범한 날)는 2026-11-06 뺌(사용자) */}
      <p className={SUB}>{sign.symbol} {sign.korean}자리 · {sign.range}</p>
      <div className="mt-3 rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5 break-keep">
        <p className="text-[15px] text-[var(--color-ink)] leading-relaxed">{today.headline}</p>
        <p className="text-[13px] text-[var(--color-ink-muted)] mt-1">✦ {today.action}</p>
        {today.caution && <p className="text-[13px] text-[var(--color-ink-muted)] mt-0.5">✕ {today.caution}</p>}
        <p className="text-[11px] text-[var(--color-ink-faint)] mt-1.5">행운의 아이템 · {today.lucky_item}</p>
      </div>
      <dl className="mt-3 divide-y divide-[var(--color-border-light)] border-t border-[var(--color-border-light)]">
        {CHART_POINTS.map((p) => {
          const text = chartText(p.key);
          return (
            <div key={p.key} className="flex gap-3 py-2">
              <dt className="shrink-0 w-14 text-xs font-bold text-[var(--color-gold)] pt-0.5">{p.symbol} {p.name}</dt>
              <dd className="min-w-0 break-keep">
                <p className="text-[13px] font-semibold text-[var(--color-ink)]">
                  {text ?? <span className="font-normal text-[var(--color-ink-faint)]">출생 시간을 넣으면 보여요</span>}
                </p>
                <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed">
                  {p.meaning}
                  {p.key === "asc" && chart.asc_signs.length > 1 && " — 태어난 시(2시간) 안에서 바뀌어 둘 다 적어요"}
                </p>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/** 이번 주 달의 길 — 7일 가로 띠(날짜·달 별자리·고른 별자리와의 관계 색), 누르면 그날 한 줄. 기준이 내 별자리일 때만 그날의 내 문장(개인판) */
function MoonPathCard({ data, focus, dayIdx, setDayIdx }: { data: HoroscopeWeek; focus?: SkySign; dayIdx: number; setDayIdx: (i: number) => void }) {
  const byKey = (key: string) => data.today.signs.find((s) => s.key === key);
  const day = data.days[dayIdx];
  const mine = data.me && focus?.key === data.me.chart.sun ? data.me.days[dayIdx] : undefined;
  const forFocus = focus ? day.signs.find((s) => s.key === focus.key) : undefined;
  const relation = mine?.relation ?? forFocus?.relation ?? "보통";
  const dayMoon = byKey(day.moon);
  return (
    <section className={CARD}>
      <h2 className={TITLE}>이번 주 달의 길</h2>
      <p className={SUB}>달은 2~3일마다 별자리를 옮겨요{focus ? ` · ${focus.symbol} ${focus.korean}자리 기준` : ""}</p>
      <div className="grid grid-cols-7 gap-1 mt-3">
        {data.days.map((d, i) => {
          const m = byKey(d.moon);
          const rel = focus ? d.signs.find((s) => s.key === focus.key)?.relation ?? "보통" : "보통";
          return (
            <button type="button" key={d.date} onClick={() => setDayIdx(i)} aria-pressed={i === dayIdx}
              className={`flex flex-col items-center rounded-xl border py-1.5 ${i === dayIdx ? "border-[var(--color-ink)] bg-[var(--color-ivory)]" : "border-[var(--color-border-light)] bg-white"}`}>
              <span className="text-[10px] text-[var(--color-ink-faint)]">{dayLabel(d.date, i).replace(/\(.\)$/, "")}</span>
              <span className="text-lg leading-none mt-1">{m?.symbol}</span>
              <span className="text-[9px] text-[var(--color-ink-muted)] mt-0.5">{m?.korean}</span>
              <span className={`w-1.5 h-1.5 rounded-full mt-1 ${RELATION_DOT[rel]}`} aria-label={RELATION_LABEL[rel]} />
            </button>
          );
        })}
      </div>
      <div className="mt-3 rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5 break-keep">
        <p className="text-[11px] text-[var(--color-ink-muted)]">
          <span className="font-bold text-[var(--color-ink)]">{dayLabel(day.date, dayIdx)}</span> · 달 {dayMoon?.symbol} {dayMoon?.korean}자리 · {day.moon_phase}
        </p>
        {mine ? (
          <>
            <p className="text-[13px] text-[var(--color-ink)] leading-relaxed mt-1">{mine.headline}</p>
            <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">✦ {mine.action}</p>
            {mine.caution && <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">✕ {mine.caution}</p>}
          </>
        ) : focus ? (
          <p className="text-[13px] text-[var(--color-ink)] leading-relaxed mt-1">
            {focus.symbol} {focus.korean}자리에겐 {RELATION_LABEL[relation]}이에요{relation === "보통" ? "." : ` — 달과 ${relation}.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** 별자리별 오늘 한 줄 — 누르면 펼쳐지고 달의 길 기준이 그 별자리로 바뀐다 */
function SignRow({ sign, mine, focused, onPick }: { sign: SkySign; mine: boolean; focused: boolean; onPick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onPick} aria-expanded={focused} className="w-full text-left py-2.5 active:opacity-80">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${RELATION_DOT[sign.relation]}`} aria-hidden />
          <span className="text-lg leading-none">{sign.symbol}</span>
          <span className="text-[13px] font-bold text-[var(--color-ink)]">{sign.korean}자리</span>
          <span className="text-[11px] text-[var(--color-ink-faint)]">{sign.range}</span>
          {mine && <span className="text-[9px] font-bold px-1 rounded-full bg-[var(--color-ink)] text-white">나</span>}
        </div>
        <p className={`text-[13px] text-[var(--color-ink)] leading-relaxed mt-1 pl-[1.4rem] break-keep ${focused ? "" : "line-clamp-1"}`}>{sign.headline}</p>
        {focused && (
          <div className="pl-[1.4rem] mt-1 break-keep">
            <p className="text-[12px] text-[var(--color-ink-muted)]">✦ {sign.action}</p>
            {sign.caution && <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">✕ {sign.caution}</p>}
            <p className="text-[11px] text-[var(--color-ink-faint)] mt-1">행운의 아이템 · {sign.lucky_item}</p>
          </div>
        )}
      </button>
    </li>
  );
}
