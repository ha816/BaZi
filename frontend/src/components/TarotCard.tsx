"use client";

import { useState } from "react";
import type { TarotCardData } from "@/lib/api";

/** sessionStorage — 오늘 카드를 뒤집은 날짜(홈·/tarot 공유). 날이 바뀌면 다시 뒷면 */
export const TAROT_FLIPPED_KEY = "kkachi_tarot_flipped";
/** 뒤집기 전 셔플 떨림 길이(ms) — globals.css .tarot-shuffle(0.12s × 7)과 맞춤 */
export const TAROT_SHUFFLE_MS = 900;

interface Props {
  card: TarotCardData;
  flipped: boolean;
  shuffling?: boolean;
  /** 있으면 뒷면이 버튼이 된다(누르면 뒤집기). 없으면 보기만 */
  onFlip?: () => void;
  size?: "sm" | "lg";
  className?: string;
}

/**
 * 타로 카드 한 장 — 뒷면(CSS 문양 + 까치) ↔ 앞면(1909 클래식 덱 그림, 역방향은 그림만 180°).
 * 뒤집기 연출은 globals.css .tarot-scene/.tarot-card. 홈 오늘의 카드 · /tarot 공용 (V9-1, 2026-11-05)
 */
export default function TarotCard({ card, flipped, shuffling = false, onFlip, size = "sm", className = "" }: Props) {
  const [broken, setBroken] = useState(false);
  const width = size === "lg" ? "w-44" : "w-28";
  const reversed = card.orientation === "역방향";
  const inner = (
    <div className={`tarot-card ${flipped ? "tarot-card--flipped" : ""} ${reversed ? "tarot-card--reversed" : ""} ${shuffling ? "tarot-shuffle" : ""}`}>
      <div className="tarot-card__face tarot-card__face--back">
        <img src="/kkachi/icon-192.png" alt="" className="w-[42%] aspect-square object-cover rounded-full border-2 border-[var(--color-gold)] opacity-90 shadow-sm" />
      </div>
      <div className="tarot-card__face tarot-card__face--front bg-[var(--color-ivory)]">
        {broken ? (
          <div className="w-full h-full flex items-center justify-center p-2 text-center font-heading text-sm font-bold text-[var(--color-ink)] break-keep">{card.name}</div>
        ) : (
          <img
            src={`/kkachi/tarot/${card.key}.webp`}
            alt={`${card.name} ${card.orientation}`}
            className="w-full h-full object-cover"
            onError={() => setBroken(true)}
          />
        )}
      </div>
    </div>
  );
  if (onFlip && !flipped) {
    return (
      <button type="button" onClick={onFlip} aria-label="카드 뒤집기" className={`tarot-scene ${width} ${className} active:scale-[0.98] transition-transform`}>
        {inner}
      </button>
    );
  }
  return <div className={`tarot-scene ${width} ${className}`}>{inner}</div>;
}
