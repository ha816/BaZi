"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import GradeTag, { gradeOfRelation } from "@/components/GradeTag";
import { getZodiacWeek, type ZodiacWeek } from "@/lib/api";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { parseStored, useStorageValue } from "@/lib/useStorageValue";
import { track } from "@/lib/track";
import type { AnalysisInput } from "@/types/analysis";

// 띠 상세 (2026-11-06, specs/zodiac/index.md) — 옛 신문의 "띠별 운세" 한 면 + 이번 주 좋은 날. GET /kkachi/zodiac/week 한 번:
// 내 띠(오늘 한 줄) → 이번 주 좋은 날(7칸, 일진 띠와 내 띠의 합·충) → 띠별 오늘(12줄). 로그인은 기본 프로필, 비로그인은 /analysis 입력값.
// 카드 머리는 제목 + 소제목 두 줄까지(홈 카드 규약). 문장은 전부 백엔드(zodiac[].advice).

const CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-4";
const TITLE = "font-heading text-[15px] font-bold text-[var(--color-ink)]";
const SUB = "text-sm text-[var(--color-ink-muted)] leading-snug mt-0.5 break-keep";
const BADGE = "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

function dayLabel(iso: string, i: number) {
  if (i === 0) return "오늘";
  if (i === 1) return "내일";
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY[d.getDay()]})`;
}

export default function ZodiacPage() {
  const memberId = useStorageValue(MEMBER_ID_KEY);
  const inputRaw = useStorageValue("kkachi_analysis_input", "session");
  const [data, setData] = useState<ZodiacWeek | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);  // 이번 주 좋은 날의 기준 띠(지지) — 처음엔 내 띠, 없으면 오늘의 띠
  const [dayIdx, setDayIdx] = useState(0);

  useEffect(() => {
    if (memberId === null || inputRaw === null) return; // 하이드레이션 전
    getZodiacWeek({ memberId, input: parseStored<AnalysisInput>(inputRaw) })
      .then((d) => {
        setData(d);
        track("zodiac_view", { page: "zodiac", logged_in: !!memberId, personal: !!d.me });
      })
      .catch(() => setFailed(true));
  }, [memberId, inputRaw]);

  if (memberId === null || inputRaw === null) return null;

  const today = data?.today;
  const byBranch = (b: string) => today?.zodiac.find((z) => z.branch === b) ?? today?.zodiac[0];
  const myBranch = data?.me?.branch ?? null;
  const focus = picked ?? myBranch ?? today?.animal.branch ?? null;
  const focusInfo = focus ? byBranch(focus) : undefined;
  const mine = myBranch ? byBranch(myBranch) : undefined;

  return (
    <main className="page">
      <div className="page__inner">
        <PageHeader
          title="오늘의 띠"
          description={today ? `${today.day_kor}(${today.day_pillar}) — ${today.animal.color} ${today.animal.korean}의 날` : "오늘 일진의 띠와 12띠의 하루"}
        />

        {failed && <div className={`${CARD} text-center text-sm text-[var(--color-ink-muted)]`}>까치가 오늘 일진을 가져오지 못했어요. 잠시 뒤 다시 열어 주세요.</div>}
        {!failed && !data && <LoadingSpinner />}

        {data && today && (
          <>
            {mine ? (
              <section className={CARD}>
                <div className="flex items-center justify-between">
                  <h2 className={TITLE}>내 띠</h2>
                  <GradeTag grade={gradeOfRelation(mine.relation)} size="md" />{/* 홈 격자와 같은 등급 라벨(2026-11-06) — 보통이면 없음 */}
                </div>
                <p className={SUB}>{mine.emoji} {mine.korean}띠 · {mine.years.join("·")}년생</p>
                <div className="mt-3 rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5 break-keep">
                  <p className="text-[15px] text-[var(--color-ink)] leading-relaxed">{mine.advice}</p>
                  <p className="text-[11px] text-[var(--color-ink-faint)] mt-1.5">
                    오늘 일진 {today.animal.emoji} {today.animal.korean}의 날과 {mine.korean}띠는 {mine.relation === "나" ? "같은 띠예요" : mine.relation === "보통" ? "특별한 관계가 없어요" : `${mine.relation}이에요`}
                  </p>
                </div>
              </section>
            ) : (
              <section className={CARD}>
                <h2 className={TITLE}>내 띠</h2>
                <p className={SUB}>
                  {memberId ? (
                    <>기본 프로필을 정하면 내 띠로 봐요. <Link href="/profile" className="underline underline-offset-2 text-[var(--color-gold)]">프로필 →</Link></>
                  ) : (
                    <>내 사주를 먼저 보면 내 띠로 봐요. <Link href="/analysis" className="underline underline-offset-2 text-[var(--color-gold)]">내 사주 보기 →</Link></>
                  )}
                </p>
              </section>
            )}

            <section className={CARD}>
              <h2 className={TITLE}>이번 주 좋은 날</h2>
              <p className={SUB}>{focusInfo ? `${focusInfo.emoji} ${focusInfo.korean}띠 기준 · ` : ""}날마다 일진의 띠와 맺는 합·충으로 봐요</p>
              <div className="grid grid-cols-7 gap-1 mt-3">
                {data.days.map((d, i) => {
                  const rel = focus ? d.zodiac.find((z) => z.branch === focus)?.relation ?? "보통" : "보통";
                  return (
                    <button type="button" key={d.date} onClick={() => setDayIdx(i)} aria-pressed={i === dayIdx}
                      className={`relative flex flex-col items-center rounded-xl border py-1.5 ${i === dayIdx ? "border-[var(--color-ink)] bg-[var(--color-ivory)]" : "border-[var(--color-border-light)] bg-white"}`}>
                      <span className="text-[10px] text-[var(--color-ink-faint)]">{dayLabel(d.date, i).replace(/\(.\)$/, "")}</span>
                      <span className="text-lg leading-none mt-1">{d.animal.emoji}</span>
                      <span className="text-[9px] text-[var(--color-ink-muted)] mt-0.5">{d.day_kor}</span>
                      <GradeTag grade={gradeOfRelation(rel)} corner />{/* 관계 점 대신 홈 격자와 같은 등급 라벨(2026-11-06) */}
                    </button>
                  );
                })}
              </div>
              <DayBox day={data.days[dayIdx]} index={dayIdx} focus={focusInfo} />
            </section>

            <section className={CARD}>
              <h2 className={TITLE}>띠별 오늘</h2>
              <p className={SUB}>{today.animal.emoji} {today.animal.korean}의 날, 12띠의 하루 — 라벨은 일진 띠와의 관계예요</p>
              <ul className="mt-3 divide-y divide-[var(--color-border-light)]">
                {today.zodiac.map((z) => {
                  const focused = z.branch === focus;
                  return (
                    <li key={z.branch}>
                      <button type="button" onClick={() => { setPicked(z.branch); setDayIdx(0); }} aria-pressed={focused}
                        className={`w-full text-left py-2.5 active:opacity-80 ${focused ? "bg-[var(--color-ivory)] -mx-2 px-2 rounded-xl" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{z.emoji}</span>
                          <span className="text-[13px] font-bold text-[var(--color-ink)]">{z.korean}띠</span>
                          <span className="text-[11px] text-[var(--color-ink-faint)]">{z.years.join("·")}년생</span>
                          {z.branch === myBranch && <span className="text-[9px] font-bold px-1 rounded-full bg-[var(--color-ink)] text-white">나</span>}
                          <GradeTag grade={gradeOfRelation(z.relation)} size="md" className="ml-auto" />
                        </div>
                        <p className="text-[13px] text-[var(--color-ink)] leading-relaxed mt-1 pl-[1.6rem] break-keep">{z.advice}</p>
                      </button>
                    </li>
                  );
                })}
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

/** 이번 주 좋은 날에서 고른 하루 — 일진·손없는 날·절기 + 기준 띠와의 관계 + 그날 그 띠의 한 줄 */
function DayBox({ day, index, focus }: { day: ZodiacWeek["days"][number]; index: number; focus?: ZodiacWeek["today"]["zodiac"][number] }) {
  const entry = focus ? day.zodiac.find((z) => z.branch === focus.branch) : undefined;
  return (
    <div className="mt-3 rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5 break-keep">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[11px] text-[var(--color-ink-muted)]">
          <span className="font-bold text-[var(--color-ink)]">{dayLabel(day.date, index)}</span> · {day.day_kor}({day.day_pillar}) — {day.animal.color} {day.animal.korean}의 날
        </p>
        {day.solar_term && <span className={`${BADGE} bg-emerald-50 text-emerald-700 border-emerald-200`}>🌿 {day.solar_term}</span>}
        {day.son_eomneun_nal && <span className={`${BADGE} bg-indigo-50 text-indigo-700 border-indigo-200`}>👻 손없는 날</span>}
      </div>
      {focus && entry && (
        <>
          <p className="text-[13px] text-[var(--color-ink)] leading-relaxed mt-1">
            <GradeTag grade={gradeOfRelation(entry.relation)} size="md" className="mr-1.5 align-middle" />
            {focus.emoji} {focus.korean}띠에겐 {entry.relation === "나" ? "같은 띠가 주인공인 날" : entry.relation === "보통" ? "특별한 합·충이 없는 날" : `일진 띠와 ${entry.relation}인 날`}이에요.
          </p>
          <p className="text-[12px] text-[var(--color-ink-muted)] mt-0.5">✦ {entry.advice}</p>
        </>
      )}
    </div>
  );
}
