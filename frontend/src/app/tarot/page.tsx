"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import TarotCard from "@/components/TarotCard";
import { getHome, getTarotToday, type TarotToday } from "@/lib/api";
import { MEMBER_ID_KEY } from "@/lib/constants";
import { parseStored, useStorageValue } from "@/lib/useStorageValue";
import { track } from "@/lib/track";
import type { AnalysisInput } from "@/types/analysis";

// 오늘의 타로카드 자세히 (V9-1, 2026-11-05, specs/tarot/index.md) — 로그인은 홈 묶음(me.tarot) 재사용, 비로그인은 /analysis 입력값으로 GET /tarot/today.
// 둘 다 없으면 날짜 카드(모두 같은 카드) + 내 사주 보기 안내. 카드는 늘 앞면 — 뒤집기 의식은 홈 카드에서만(2026-11-06 사용자 "액션으로 보여줄 필요 없어")

const CARD = "rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] px-4 py-4";
const ORIENTATION_BADGE: Record<string, string> = {
  "정방향": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "역방향": "bg-amber-100 text-amber-800 border-amber-200",
};
const AREAS: { key: "love" | "work" | "money"; label: string }[] = [
  { key: "love", label: "연애" },
  { key: "work", label: "일" },
  { key: "money", label: "재물" },
];
const DISCLAIMER = "타로는 앞날을 맞히는 도구가 아니라 지금 마음을 비춰 보는 거울이에요.";

export default function TarotPage() {
  const memberId = useStorageValue(MEMBER_ID_KEY);
  const inputRaw = useStorageValue("kkachi_analysis_input", "session");
  const [data, setData] = useState<TarotToday | null>(null);
  const [name, setName] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (memberId === null || inputRaw === null) return; // 하이드레이션 전
    track("tarot_view", { page: "tarot", logged_in: !!memberId });
    const load = async () => {
      if (memberId) {
        const home = await getHome(memberId);
        if (home.me) {
          setData(home.me.tarot);
          setName(home.me.name);
        } else {
          setData(home.today.tarot);
        }
        return;
      }
      setData(await getTarotToday(parseStored<AnalysisInput>(inputRaw)));
      try { setName(sessionStorage.getItem("kkachi_analysis_name") ?? ""); } catch { /* 이름 없이 */ }
    };
    load().catch(() => setFailed(true));
  }, [memberId, inputRaw]);

  if (memberId === null || inputRaw === null) return null;

  const person = data?.identity === "person";
  const c = data?.card;

  return (
    <main className="page">
      <div className="page__inner">
        <PageHeader
          title="오늘의 타로카드"
          description={person && name ? `${name}님의 카드예요. 하루 한 장, 사람마다 정해진 카드` : "하루 한 장, 사람·날짜마다 정해진 카드예요"}
        />

        {failed && (
          <div className={`${CARD} text-center text-sm text-[var(--color-ink-muted)]`}>까치가 카드를 가져오지 못했어요. 잠시 뒤 다시 열어 주세요.</div>
        )}
        {!failed && !data && <LoadingSpinner />}

        {data && c && (
          <section className={CARD}>
            <div className="flex flex-col items-center">
              <TarotCard card={c} flipped size="lg" />
              <div className="mt-4 w-full break-keep">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-heading text-xl font-bold text-[var(--color-ink)]">{c.name}</h2>
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${ORIENTATION_BADGE[c.orientation]}`}>{c.orientation}</span>
                </div>
                <p className="text-[11px] text-[var(--color-ink-faint)] text-center mt-0.5">
                  1909 클래식 덱 · {c.arcana === "major" ? "메이저" : `${c.suit} 수트`} {c.number}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {c.keywords.map((k) => (
                    <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-ivory)] text-[var(--color-ink)] border border-[var(--color-border-light)]">{k}</span>
                  ))}
                </div>
                <p className="text-[15px] text-[var(--color-ink)] leading-relaxed text-center mt-3">{c.line}</p>
                {data.cross && (
                  <div className="mt-3 rounded-xl bg-[var(--color-ivory)] px-3.5 py-2.5">
                    <p className="text-[12px] text-[var(--color-ink-muted)] leading-relaxed break-keep">
                      {`오늘 일진과 함께 보면, ${data.cross}`.split(". ").map((s, i, a) => <span key={i} className="block">{i < a.length - 1 ? `${s}.` : s}</span>)}
                    </p>
                  </div>
                )}
                <dl className="mt-4 divide-y divide-[var(--color-border-light)] border-t border-[var(--color-border-light)]">
                  {AREAS.map((a) => (
                    <div key={a.key} className="flex gap-3 py-2.5">
                      <dt className="shrink-0 w-10 text-xs font-bold text-[var(--color-gold)] pt-0.5">{a.label}</dt>
                      <dd className="text-[13px] text-[var(--color-ink)] leading-relaxed">{c[a.key]}</dd>
                    </div>
                  ))}
                </dl>
                {!person && (
                  <p className="text-xs text-[var(--color-ink-muted)] text-center mt-3">
                    모두에게 같은 카드예요.{" "}
                    {memberId ? (
                      <Link href="/profile" className="underline underline-offset-2 text-[var(--color-gold)]">기본 프로필을 정하면 내 카드를 뽑아요</Link>
                    ) : (
                      <Link href="/analysis" className="underline underline-offset-2 text-[var(--color-gold)]">내 사주를 먼저 보면 내 카드가 나와요</Link>
                    )}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed text-center mt-4 break-keep">{DISCLAIMER}</p>
          </section>
        )}

        <p className="text-center">
          <Link href="/" className="text-xs font-semibold text-[var(--color-ink-muted)]">← 홈으로</Link>
        </p>
      </div>
    </main>
  );
}
