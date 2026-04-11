"use client";

import { getElementInfo } from "@/lib/elementColors";
import TermBadge from "./TermBadge";
import type { PillarElementInfo } from "@/types/analysis";

interface Props {
  pillars: string[];
  dayStem: string;
  pillarElements?: PillarElementInfo[];
  basic?: boolean;
  pillarSummary?: string;
  highlightBranches?: boolean;
  highlightDayStem?: boolean;
}

const PILLAR_LABELS = ["태어난 해", "태어난 달", "태어난 날", "태어난 시간"];
const PILLAR_SUB = ["조상·사회", "부모·성장", "나·배우자", "자녀·노년"];
const PILLAR_TERMS = ["년주", "월주", "일주", "시주"];
const PILLAR_TERMS_HAN = ["年柱", "月柱", "日柱", "時柱"];

const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

const BRANCH_ELEMENT: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

export default function PillarDetail({ pillars, dayStem, pillarElements, basic = false, pillarSummary, highlightBranches = false, highlightDayStem = false }: Props) {
  return (
    <div>
      {pillarSummary && (
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-5 px-1">
          {pillarSummary}
        </p>
      )}

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {pillars.map((pillar, i) => {
          const stem = pillar[0];
          const branch = pillar[1];
          const stemEl = pillarElements?.[i]?.stem_element ?? STEM_ELEMENT[stem] ?? "";
          const branchEl = pillarElements?.[i]?.branch_element ?? BRANCH_ELEMENT[branch] ?? "";
          const stemInfo = stemEl ? getElementInfo(stemEl) : null;
          const branchInfo = branchEl ? getElementInfo(branchEl) : null;
          const isDayPillar = highlightDayStem && i === 2;
          return (
            <div
              key={i}
              className="rounded-xl text-center border transition-shadow"
              style={isDayPillar
                ? { borderColor: "var(--color-gold)", backgroundColor: "var(--color-gold-faint)" }
                : { borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)" }
              }
            >
              <div className="px-3 py-3 border-b" style={{ borderColor: isDayPillar ? "var(--color-gold)" : "var(--color-border-light)" }}>
                <div className="text-sm font-medium text-[var(--color-ink)]">
                  {PILLAR_LABELS[i]}
                </div>
                <div className="text-xs text-[var(--color-ink-faint)]">
                  {basic
                    ? PILLAR_TERMS_HAN[i]
                    : <>{PILLAR_SUB[i]} <span className="opacity-60">(<TermBadge term={PILLAR_TERMS[i]} />)</span></>
                  }
                </div>
                {isDayPillar && (
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--color-gold)" }}>기준 일간</div>
                )}
              </div>

              <div className="px-3 py-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">
                  하늘
                </div>
                <div
                  className="font-heading text-3xl md:text-4xl font-bold"
                  style={{ color: stemInfo?.color ?? "var(--color-ink)" }}
                >
                  {stem}
                </div>
                {stemInfo && (
                  <div className="text-xs mt-1" style={{ color: stemInfo.color }}>
                    {stemInfo.korean}({stemInfo.label})
                  </div>
                )}
              </div>

              <div className="mx-4 h-px bg-[var(--color-border-light)]" />

              <div
                className={`px-3 py-4 rounded-b-xl ${
                  highlightBranches
                    ? "bg-[var(--color-gold-faint)]"
                    : ""
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">
                  땅
                </div>
                <div
                  className="font-heading text-3xl md:text-4xl font-bold"
                  style={{ color: branchInfo?.color ?? "var(--color-ink)" }}
                >
                  {branch}
                </div>
                {branchInfo && (
                  <div className="text-xs mt-1" style={{ color: branchInfo.color }}>
                    {branchInfo.korean}({branchInfo.label})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
