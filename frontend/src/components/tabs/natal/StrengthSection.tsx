"use client";

import { useState } from "react";
import type { NatalResult } from "@/types/analysis";
import CollapsibleSectionHeader from "@/components/CollapsibleSectionHeader";
import KkachiTip from "@/components/KkachiTip";

const STRENGTH_IMG: Record<string, string> = {
  "신강(身強)": "/kkachi/strength/신강.png",
  "신약(身弱)": "/kkachi/strength/신약.png",
};

/** 신강·신약(身強·身弱) — 기운 % 게이지 + 그림 + 풀이. 만세력 탭에서 십신 위 */
export default function StrengthSection({ natal }: { natal: NatalResult }) {
  const [showStrength, setShowStrength] = useState(false);
  const strengthPct = Math.min(100, Math.max(0, natal.strength_pct ?? 50));
  const strengthColor = natal.strength_label === "신강(身強)" ? "var(--color-fire)" : "var(--color-water)";

  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신강·신약(身強·身弱)">
        나의 일간(日干) <strong className="text-[var(--color-ink)]">{natal.day_stem_korean}({natal.day_stem})</strong>가 사주 전체에서 얼마나 힘 있는지 보여주는 척도예요.
        <strong className="text-[var(--color-ink)]"> 신강</strong>이면 자기 주도적인 추진력이, <strong className="text-[var(--color-ink)]">신약</strong>이면 환경·사람의 도움을 활용하는 흐름이 두드러집니다. 강약을 알아야 어떤 오행이 용신인지 정해져요.
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          나의 타고난 기운(<strong className="text-[var(--color-ink)]">{natal.day_stem_korean}({natal.day_stem})</strong>)이 사주 안에서 얼마나 영향력 있는지 점수로 보여드릴게요. 신강이면 자기 페이스로 밀고 가는 힘이, 신약이면 환경·사람과 함께 펼쳐지는 결이 두드러져요.
        </KkachiTip>
        {!showStrength ? (
          <button
            onClick={() => setShowStrength(true)}
            className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
          >
            ✨ 나의 신강·신약 확인하기
          </button>
        ) : (
          <>
            <div>
              <div className="relative h-3 rounded-full overflow-hidden bg-[var(--color-parchment)]">
                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
                <div
                  className="absolute top-0 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.abs(strengthPct - 50)}%`,
                    left: strengthPct >= 50 ? "50%" : `${strengthPct}%`,
                    backgroundColor: strengthColor,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1.5">
                <span className="text-[var(--color-water)]">신약(身弱)</span>
                <span className="font-semibold" style={{ color: strengthColor }}>
                  기운 {strengthPct}% · {natal.strength_label}
                </span>
                <span className="text-[var(--color-fire)]">신강(身強){natal.hour_unknown ? " · 세 기둥 기준" : ""}</span>
              </div>
            </div>

            <img
              src={STRENGTH_IMG[natal.strength_label] ?? "/kkachi/normal_kkachi_00.png"}
              alt={natal.strength_label}
              className="w-1/2 mx-auto block rounded-xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/kkachi/normal_kkachi_00.png"; }}
            />
            <KkachiTip>{natal.narratives.strength_tip}</KkachiTip>
          </>
        )}
      </div>
    </div>
  );
}
