"use client";

import { useState } from "react";
import Link from "next/link";
import type { HomeData } from "@/lib/api";
import { dayNoOf } from "@/lib/news";
import { charArtSrc, onCharArtError } from "@/lib/characterArt";
import { SINSAL_INFO, SINSAL_ORDER, SIPSIN_INFO } from "@/components/tabs/natal/data";

// 사주 한 입 — 만세력 섹션의 신살 9 + 십신 10을 날마다 하나씩. 2026-10-26 홈 ②에서 시작, 2026-11-06 별도 카드, 2026-11-08 까치 신문(/news)으로 옮김(specs/news §3-A 2).
// 로그인(내 사람들 있음): 나 포함 내 사람들 중 누군가 가진 것 가운데 날짜 순번 + "내 사람들에게도 있을까?" [확인하기 →] → 가진 사람 캐릭터 얼굴 줄.
// 그 밖(비로그인·사람 없음): 19일 순번 상식 + [내 사주에도 있을까? →] /analysis. 홈 까치 신문 카드 머리기사는 pickBite로 같은 것을 가리킨다.

const FALLBACK_IMG = "/kkachi/normal_kkachi_00.png";
const TITLE = "font-heading text-[15px] font-bold text-[var(--color-ink)]";

type Bite = { kind: string; name: string; hanja: string; tagline: string; desc: string; img: string; field: "sinsal" | "sipsin"; mark: string };
const BITES: Bite[] = [
  ...SINSAL_ORDER.map((name) => ({ kind: "신살(神殺)", name, hanja: SINSAL_INFO[name].hanja, tagline: SINSAL_INFO[name].tagline, desc: SINSAL_INFO[name].desc, img: `/kkachi/sinsal/sinsal_${name}.png`, field: "sinsal" as const, mark: name })),
  ...Object.entries(SIPSIN_INFO).map(([hanja, v]) => ({ kind: "십신(十神)", name: v.korean, hanja, tagline: v.tagline, desc: v.desc, img: `/kkachi/sipsin/sipsin_${v.korean}.png`, field: "sipsin" as const, mark: hanja })),
];

type Marks = { sinsal: string[]; sipsin: string[] } | undefined;

/** 오늘의 사주 한 입 — marks(홈 응답 me·people의 marks) 중 누군가 가진 것 가운데 날짜 순번, 아무도 없으면 19일 순번 */
export function pickBite(date: string, marks: Marks[] = []): Bite {
  const held = BITES.filter((b) => marks.some((m) => m?.[b.field].includes(b.mark)));
  return held.length ? held[dayNoOf(date) % held.length] : BITES[dayNoOf(date) % BITES.length];
}

export default function SajuBiteCard({ date, people = [], me = null, className = "" }: { date: string; people?: HomeData["people"]; me?: HomeData["me"]; className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const bite = pickBite(date, [me?.marks, ...people.map((p) => p.marks)]);
  const has = (m: Marks) => !!m?.[bite.field].includes(bite.mark);
  const holders = [
    ...(me && has(me.marks) ? [{ id: me.profile_id, name: me.name, character: me.character, isMe: true }] : []),
    ...people.filter((p) => has(p.marks)).map((p) => ({ id: p.profile_id, name: p.name, character: p.character, isMe: false })),
  ];
  const guest = !me && people.length === 0;

  return (
    <section className={className}>
      <h2 className={TITLE}>사주 한 입 — {bite.kind}</h2>
      <div className="flex items-start gap-3 mt-2">
        <img src={bite.img} alt="" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        <div className="flex-1 min-w-0 break-keep">
          <p className="text-sm text-[var(--color-ink)] leading-snug">{bite.name}({bite.hanja}) — {bite.tagline}</p>
          <p className="text-xs text-[var(--color-ink-light)] leading-relaxed mt-1">{bite.desc}</p>
        </div>
      </div>
      {guest ? (
        <Link href="/analysis" className="inline-block text-xs font-semibold text-[var(--color-gold)] mt-2 ml-[68px]">내 사주에도 있을까? →</Link>
      ) : !revealed ? (
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
