"use client";

import { useEffect, useState } from "react";
import type { SajuCharacter } from "@/types/analysis";
import { RevealGate, FALLBACK_IMG } from "@/components/SajuCharacterCard";
import { charArtSrc, onCharArtError } from "@/lib/characterArt";

const ELEMENTS = ["나무", "불", "흙", "쇠", "물"];
const OPENING_MS = 1300;

interface Props {
  character: SajuCharacter;
  name: string;
  year: number;
  /** 이미 공개했으면(설문에서 뒤로 돌아옴) 슬롯 없이 인사부터 */
  revealed: boolean;
  /** 캐릭터를 공개했다 — 설문에서 뒤로 돌아오면 슬롯 없이 인사부터 */
  onReveal: () => void;
  /** 설문 문항이 있을 때만 — 없으면 "내 사주 분석 보기" 하나 */
  onSurvey?: () => void;
  onDone: () => void;
}

/** 분석 직후 대시보드 전에 한 장(?step=intro) — 캐릭터 공개 → 캐릭터가 인사 → [설문조사] / [내 사주 분석 보기 → "운세 지도 펼치는 중…"] (전체 화면, 건너뛰기 가능) */
export default function ResultIntro({ character: c, name, year, revealed, onReveal, onSurvey, onDone }: Props) {
  const [phase, setPhase] = useState<"gate" | "hello" | "opening">(revealed ? "hello" : "gate");
  const who = name ? `${name}님` : "당신";
  const img = charArtSrc(c.art_key, c.key);

  useEffect(() => {
    if (phase !== "opening") return;
    const t = setTimeout(onDone, OPENING_MS);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  return (
    <div className="fixed inset-x-0 top-0 bottom-[var(--nav-h)] mb-0 z-[70] overflow-y-auto bg-[var(--color-ivory)]" role="dialog" aria-modal="true" aria-label="분석 결과 인트로">
      <div className="min-h-full max-w-md mx-auto px-4 pt-4 pb-6 flex flex-col">
        <div className="flex items-center justify-between h-10">
          <span className="text-xs font-semibold text-[var(--color-gold)]">✓ 분석 완료</span>
          {phase !== "opening" && (
            <button type="button" onClick={onDone} className="px-3 py-2 -mr-3 text-xs text-[var(--color-ink-faint)]">
              건너뛰기
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center py-4">
          {phase === "gate" && (
            <RevealGate c={c} name={name} onReveal={() => { onReveal(); setPhase("hello"); }} />
          )}

          {phase === "hello" && (
            <div className="space-y-4 text-center">
              <img
                src={img}
                alt={c.title}
                className="w-[min(15rem,27vh)] mx-auto aspect-square rounded-2xl object-cover char-reveal"
                onError={onCharArtError(c.key, FALLBACK_IMG)}
              />
              <div className="space-y-1 score-pop" style={{ animationDelay: "0.35s" }}>
                <p className="text-xs font-semibold text-[var(--color-gold)]">{who}의 캐릭터</p>
                <p className="font-heading text-2xl font-bold text-[var(--color-ink)]">{c.title}</p>
                <p className="text-sm text-[var(--color-ink-muted)]">{c.line}</p>
              </div>
              {/* 까치가 건네는 첫 마디 — 화면 곳곳의 KkachiTip과 같은 기본 까치 그림 */}
              <div className="flex items-center gap-3 text-left score-pop" style={{ animationDelay: "0.7s" }}>
                <img src={FALLBACK_IMG} alt="까치" className="w-20 h-20 flex-shrink-0 rounded-full object-cover" style={{ objectPosition: "50% 60%" }} />
                <div className="flex-1 rounded-2xl rounded-tl-sm bg-white border border-[var(--color-border-light)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-ink)] break-keep">
                  <p>반갑습니다. <strong>{who}</strong>!<br />{year}년 기준으로 사주를 풀어드릴게요.</p>
                  {onSurvey && (
                    <p className="mt-1 text-[var(--color-ink-muted)]">아래 설문조사를 하면 이 풀이가 나와 얼마나 맞는지 알려드려요. (바로 분석으로 가도 되구요)</p>
                  )}
                </div>
              </div>
              {/* 엄지 자리 — 화면이 작아도 스크롤 없이 누를 수 있게 아래에 붙인다 */}
              <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-3 bg-[var(--color-ivory)]">
                <div className="space-y-2 score-pop" style={{ animationDelay: "1s" }}>
                  {onSurvey && (
                    <button
                      type="button"
                      onClick={onSurvey}
                      className="w-full py-3.5 rounded-xl text-base font-semibold active:opacity-70 border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                    >
                      📋 설문조사
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhase("opening")}
                    className={`w-full py-3.5 rounded-xl text-base font-semibold active:opacity-70 ${onSurvey ? "border border-[var(--color-border)] bg-white text-[var(--color-ink)]" : "btn-shimmer"}`}
                  >
                    🗺️ 내 사주 분석 보기
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "opening" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex gap-4">
                {ELEMENTS.map((el, i) => (
                  <span key={el} className="ink-pulse text-lg font-heading text-[var(--color-ink-muted)]" style={{ animationDelay: `${i * 0.2}s` }}>{el}</span>
                ))}
              </div>
              <p className="font-heading text-lg text-[var(--color-ink-light)] break-keep">
                {who}의 기운에 맞춘<br />운세 지도를 펼치는 중…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
