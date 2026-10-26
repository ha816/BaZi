"use client";

import { useEffect, useState } from "react";
import { CompatCharacterBox, PairArt, RevealGate } from "./CompatTotal";
import type { CompatTabProps } from "./types";

const OPENING_MS = 1300;
const KKACHI_IMG = "/kkachi/normal_kkachi_00.png";

interface Props extends CompatTabProps {
  /** 이미 공개했으면(문답에서 뒤로 돌아옴) 드럼롤 없이 인사부터 */
  revealed: boolean;
  onReveal: () => void;
  /** 설문조사("이럴 때 두 분은?" 문답) 문항이 있을 때만 — 없으면 "궁합 분석 보기" 하나 */
  onScenario?: () => void;
  onDone: () => void;
}

/** 궁합 결과 직후 한 장(?step=intro) — 두근두근 드럼롤 → 캐릭터 칭호·점수 공개 → 까치 인사
 *  → [📋 설문조사 ?step=scenario] / [궁합 분석 보기 → "인연 지도 펼치는 중…"] (분석 ResultIntro와 같은 흐름·같은 이름, 건너뛰기 가능) */
export default function CompatIntro({ revealed, onReveal, onScenario, onDone, ...props }: Props) {
  const { data, name1, name2 } = props;
  const [phase, setPhase] = useState<"gate" | "hello" | "opening">(revealed ? "hello" : "gate");

  useEffect(() => {
    if (phase !== "opening") return;
    const t = setTimeout(onDone, OPENING_MS);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  return (
    <div className="fixed inset-x-0 top-0 bottom-[var(--nav-h)] mb-0 z-[70] overflow-y-auto bg-[var(--color-ivory)]" role="dialog" aria-modal="true" aria-label="궁합 결과 인트로">
      <div className="min-h-full max-w-md mx-auto px-4 pt-4 pb-6 flex flex-col">
        <div className="flex items-center justify-between h-10">
          <span className="text-xs font-semibold text-[var(--color-gold)]">✓ 궁합 분석 완료</span>
          {phase !== "opening" && (
            <button type="button" onClick={onDone} className="px-3 py-2 -mr-3 text-xs text-[var(--color-ink-faint)]">
              건너뛰기
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center py-4">
          {phase === "gate" && (
            <RevealGate name1={name1} name2={name2} roles={data.character?.roles ?? []} onReveal={() => { onReveal(); setPhase("hello"); }} />
          )}

          {phase === "hello" && (
            <div className="space-y-3 text-center">
              <div className="char-reveal">
                <CompatCharacterBox {...props} />
              </div>
              {/* 까치가 건네는 첫 마디 — 분석 인트로와 같은 기본 까치 그림 */}
              <div className="flex items-center gap-3 text-left score-pop" style={{ animationDelay: "0.7s" }}>
                <img src={KKACHI_IMG} alt="까치" className="w-16 h-16 flex-shrink-0 rounded-full object-cover" style={{ objectPosition: "50% 60%" }} />
                <div className="flex-1 rounded-2xl rounded-tl-sm bg-white border border-[var(--color-border-light)] px-3.5 py-2.5 text-sm leading-relaxed text-[var(--color-ink)] break-keep">
                  <p><strong>{name1}님</strong>과 <strong>{name2}님</strong>의 궁합을 풀어드릴게요.</p>
                  {onScenario && (
                    <p className="mt-1 text-[var(--color-ink-muted)]">아래 설문조사를 하면 사주가 두 분을 얼마나 맞히는지 알려드려요. (바로 분석으로 가도 되구요)</p>
                  )}
                </div>
              </div>
              {/* 엄지 자리 — 화면이 작아도 스크롤 없이 누를 수 있게 아래에 붙인다 */}
              <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-3 bg-[var(--color-ivory)]">
                <div className="space-y-2 score-pop" style={{ animationDelay: "1s" }}>
                  {onScenario && (
                    <button
                      type="button"
                      onClick={onScenario}
                      className="w-full py-3.5 rounded-xl text-base font-semibold active:opacity-70 border border-[var(--color-border)] bg-white text-[var(--color-ink)]"
                    >
                      📋 설문조사
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhase("opening")}
                    className={`w-full py-3.5 rounded-xl text-base font-semibold active:opacity-70 ${onScenario ? "border border-[var(--color-border)] bg-white text-[var(--color-ink)]" : "btn-shimmer"}`}
                  >
                    💞 궁합 분석 보기
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "opening" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <PairArt roles={data.character?.roles ?? []} />
              <p className="font-heading text-lg text-[var(--color-ink-light)] break-keep">
                두 분의 인연 지도를<br />펼치는 중…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
