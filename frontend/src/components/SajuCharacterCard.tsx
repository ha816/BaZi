"use client";

import { useEffect, useRef, useState } from "react";
import type { SajuCharacter } from "@/types/analysis";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";
import { getElementInfo } from "@/lib/elementColors";

const ELEMENT_READING: Record<string, string> = { 木: "목", 火: "화", 土: "토", 金: "금", 水: "수" };
export const FALLBACK_IMG = "/kkachi/normal_kkachi_00.png";

// 슬롯에서 도는 10천간 — 마지막엔 내 일간(stem)에서 멈춘다
const STEMS = [
  { stem: "甲", label: "갑목", emoji: "🌳", element: "木" },
  { stem: "乙", label: "을목", emoji: "🌿", element: "木" },
  { stem: "丙", label: "병화", emoji: "☀️", element: "火" },
  { stem: "丁", label: "정화", emoji: "🕯️", element: "火" },
  { stem: "戊", label: "무토", emoji: "⛰️", element: "土" },
  { stem: "己", label: "기토", emoji: "🌾", element: "土" },
  { stem: "庚", label: "경금", emoji: "⚔️", element: "金" },
  { stem: "辛", label: "신금", emoji: "💎", element: "金" },
  { stem: "壬", label: "임수", emoji: "🌊", element: "水" },
  { stem: "癸", label: "계수", emoji: "💧", element: "水" },
];
// 슬롯 한 칸씩 넘기는 간격(ms) — 점점 느려지다 멈춘다. 합계 ≈ 1.9초
const SPIN_STEPS = [60, 60, 60, 60, 60, 70, 70, 80, 90, 100, 115, 130, 150, 175, 205, 240, 280];
const LANDED_MS = 550;

interface Props {
  character: SajuCharacter;
  name?: string;
}

/** 공개 전 — 실루엣 + "○○님의 캐릭터는?" → 10천간 슬롯이 돌다 내 일간에서 멈춘 뒤 공개 (궁합 RevealGate와 같은 흐름) */
export function RevealGate({ c, name, onReveal }: { c: SajuCharacter; name?: string; onReveal: () => void }) {
  const target = Math.max(0, STEMS.findIndex((s) => s.stem === c.stem));
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);
  const [idx, setIdx] = useState(0);
  const [imgSrc, setImgSrc] = useState(`/kkachi/saju_character/${c.key}.webp`);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handle = () => {
    if (spinning) return;
    setSpinning(true);
    // 마지막 칸이 target에 오도록 시작 칸을 역산
    const n = SPIN_STEPS.length;
    const start = (((target - n) % STEMS.length) + STEMS.length) % STEMS.length;
    setIdx(start);
    let t = 0;
    SPIN_STEPS.forEach((ms, i) => {
      t += ms;
      timers.current.push(setTimeout(() => setIdx((start + i + 1) % STEMS.length), t));
    });
    timers.current.push(setTimeout(() => setLanded(true), t));
    timers.current.push(setTimeout(onReveal, t + LANDED_MS));
  };

  const cur = STEMS[idx];
  const curEl = getElementInfo(cur.element);
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <p className="font-heading text-lg font-bold text-[var(--color-ink)] heart-thump">
        두근두근 🐦<br />
        <span className="text-[var(--color-gold)]">{name ? `${name}님` : "이 사주"}</span>의 캐릭터는?
      </p>
      <div className={`relative w-44 h-44 rounded-full overflow-hidden border-4 border-[var(--color-gold-faint)] ${spinning ? "char-silhouette--shake" : "animate-float"}`}>
        {/* 실루엣으로 미리 보여 주며 그림도 미리 받아 둔다 */}
        <img
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover char-silhouette"
          onError={() => setImgSrc(FALLBACK_IMG)}
        />
        <span className={`absolute inset-0 flex items-center justify-center font-heading text-6xl font-bold text-white/90 ${spinning ? "opacity-0" : ""} transition-opacity`} aria-hidden>?</span>
      </div>
      {spinning && (
        <div
          className={`stem-slot ${landed ? "stem-slot--landed" : ""}`}
          style={{ borderColor: curEl.borderColor, backgroundColor: curEl.bgColor, color: curEl.color }}
          aria-live="polite"
        >
          <span key={idx} className="stem-slot__item">
            <span className="text-2xl">{cur.emoji}</span>
            <span className="font-heading text-xl font-bold">{cur.stem}</span>
            <span className="text-sm font-semibold">{cur.label}</span>
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={handle}
        disabled={spinning}
        className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
      >
        {landed ? "짠! ✨" : spinning ? "일간을 찾는 중…" : "🎁 내 캐릭터 확인하기"}
      </button>
    </div>
  );
}

/** 나의 캐릭터 — 일간 × 신강/신약 20유형 (백엔드 natal.character). 그림은 /kkachi/saju_character/{key}.webp.
 *  만세력 탭 신강·신약 아래 — 신강·신약처럼 "확인하기"를 눌러야 본문이 열린다. 슬롯 공개 연출(RevealGate)은 분석 직후 인트로에서 */
export default function SajuCharacterCard({ character: c, name }: Props) {
  const [open, setOpen] = useState(false);
  const el = getElementInfo(c.element);
  const pct = Math.min(100, Math.max(0, c.strength_pct));
  const tone = c.strong ? "var(--color-fire)" : "var(--color-water)";
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="나의 캐릭터">
        나를 상징하는 <strong className="text-[var(--color-ink)]">일간(日干)</strong>에, 일간의 힘이 센지 여린지를 보는{" "}
        <strong className="text-[var(--color-ink)]">신강·신약(身強·身弱)</strong>으로 뽑아본 나의 캐릭터예요.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-3">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
          >
            ✨ 나의 캐릭터 확인하기
          </button>
        ) : (
        <>
        <KkachiTip>
          {`일간(日干) **${c.stem_korean}${ELEMENT_READING[c.element] ?? ""}(${c.stem}${c.element})**에 기운의 세기 **${c.strength_label}**을 더해 만든 ${name ? `${name}님의` : "이 사주의"} 까치 캐릭터예요.`}
        </KkachiTip>
        <img
          src={`/kkachi/saju_character/${c.key}.webp`}
          alt={c.title}
          className="w-full aspect-square rounded-xl object-cover char-reveal"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
        />
        <div className="text-center space-y-1 score-pop" style={{ animationDelay: "0.35s" }}>
          <p className="font-heading text-xl font-bold text-[var(--color-ink)]">{c.title}</p>
          <p className="text-sm text-[var(--color-ink-muted)]">{c.line}</p>
        </div>
        <div className="grid grid-cols-2 rounded-xl border border-[var(--color-border-light)] divide-x divide-[var(--color-border-light)] text-center">
          <div className="px-2 py-2.5">
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: el.color }}>선호하는 일</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {c.jobs.map((j, i) => (
                <span
                  key={j}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold break-keep score-pop"
                  style={{ backgroundColor: el.bgColor, color: el.color, border: `1px solid ${el.borderColor}`, animationDelay: `${0.6 + i * 0.1}s` }}
                >
                  {j}
                </span>
              ))}
            </div>
          </div>
          <div className="px-2 py-2.5">
            <p className="text-[11px] font-semibold mb-1.5 text-[var(--color-ink-muted)]">선호하지 않는 일</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {(c.jobs_avoid ?? []).map((j, i) => (
                <span
                  key={j}
                  className="rounded-full px-2.5 py-1 text-[11px] break-keep text-[var(--color-ink-muted)] bg-[var(--color-parchment)] border border-[var(--color-border-light)] score-pop"
                  style={{ animationDelay: `${0.6 + i * 0.1}s` }}
                >
                  {j}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border-light)] px-3 py-2">
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-[var(--color-water)]">신약(身弱)</span>
            <span className="font-semibold" style={{ color: tone }}>기운 {pct}% · {c.strength_label}</span>
            <span className="text-[var(--color-fire)]">신강(身強)</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden bg-[var(--color-parchment)]">
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
            {/* 가운데(50%)에서 신강·신약 쪽으로 차오른다 */}
            <div
              className="absolute top-0 h-full rounded-full bar-grow"
              style={{ width: `${Math.abs(pct - 50)}%`, left: pct >= 50 ? "50%" : `${pct}%`, backgroundColor: tone, transformOrigin: pct >= 50 ? "left" : "right" }}
            />
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
