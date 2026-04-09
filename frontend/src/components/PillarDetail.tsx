"use client";

import { getElementInfo } from "@/lib/elementColors";
import TermBadge from "./TermBadge";

interface Props {
  pillars: string[];
  dayStem: string;
  basic?: boolean;
  pillarSummary?: string;
  highlightBranches?: boolean;
}

const PILLAR_LABELS = ["태어난 해", "태어난 달", "태어난 날", "태어난 시간"];
const PILLAR_SUB = ["조상·사회", "부모·성장", "나·배우자", "자녀·노년"];
const PILLAR_TERMS = ["년주", "월주", "일주", "시주"];
const PILLAR_TERMS_HAN = ["年柱", "月柱", "日柱", "時柱"];

const STEM_ELEMENT: Record<string, string> = {
  갑: "木", 을: "木", 병: "火", 정: "火", 무: "土",
  기: "土", 경: "金", 신: "金", 임: "水", 계: "水",
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

const BRANCH_ELEMENT: Record<string, string> = {
  자: "水", 축: "土", 인: "木", 묘: "木", 진: "土", 사: "火",
  오: "火", 미: "土", 신: "金", 유: "金", 술: "土", 해: "水",
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

function getCharElement(char: string, isStem: boolean): string {
  return (isStem ? STEM_ELEMENT : BRANCH_ELEMENT)[char] ?? "";
}

export default function PillarDetail({ pillars, dayStem, basic = false, pillarSummary, highlightBranches = false }: Props) {
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
          const stemEl = getCharElement(stem, true);
          const branchEl = getCharElement(branch, false);
          const stemInfo = stemEl ? getElementInfo(stemEl) : null;
          const branchInfo = branchEl ? getElementInfo(branchEl) : null;
          return (
            <div
              key={i}
              className="rounded-xl text-center border transition-shadow border-[var(--color-border-light)] bg-[var(--color-card)]"
            >
              <div className="px-3 py-3 border-b border-[var(--color-border-light)]">
                <div className="text-sm font-medium text-[var(--color-ink)]">
                  {PILLAR_LABELS[i]}
                </div>
                <div className="text-xs text-[var(--color-ink-faint)]">
                  {basic
                    ? PILLAR_TERMS_HAN[i]
                    : <>{PILLAR_SUB[i]} <span className="opacity-60">(<TermBadge term={PILLAR_TERMS[i]} />)</span></>
                  }
                </div>
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
