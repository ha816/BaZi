"use client";

import { getElementInfo } from "@/lib/elementColors";
import TermBadge from "./TermBadge";
import type { JizanGanItem, PillarElementInfo } from "@/types/analysis";

const SIPSIN_KOR: Record<string, string> = {
  比肩: "비견", 劫財: "겁재", 食神: "식신", 傷官: "상관",
  偏財: "편재", 正財: "정재", 偏官: "편관", 正官: "정관",
  偏印: "편인", 正印: "정인",
};

interface Props {
  pillars: string[];
  dayStem: string;
  pillarElements?: PillarElementInfo[];
  basic?: boolean;
  pillarSummary?: string;
  highlightBranches?: boolean;
  highlightDayStem?: boolean;
  jizanGan?: JizanGanItem[][];
  gongmang?: boolean[];
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

const STEM_KOR: Record<string, string> = {
  甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무",
  己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
};

const BRANCH_KOR: Record<string, string> = {
  子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
  午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
};

export default function PillarDetail({ pillars, dayStem, pillarElements, basic = false, pillarSummary, highlightBranches = false, highlightDayStem = false, jizanGan, gongmang }: Props) {
  return (
    <div>
      {pillarSummary && (
        <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-5 px-1">
          {pillarSummary}
        </p>
      )}

      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {[3, 2, 1, 0].map((origI, i) => {
          const pillar = pillars[origI] ?? "";
          const stem = pillar[0];
          const branch = pillar[1];
          const stemEl = pillarElements?.[origI]?.stem_element ?? STEM_ELEMENT[stem] ?? "";
          const branchEl = pillarElements?.[origI]?.branch_element ?? BRANCH_ELEMENT[branch] ?? "";
          const stemInfo = stemEl ? getElementInfo(stemEl) : null;
          const branchInfo = branchEl ? getElementInfo(branchEl) : null;
          const isDayPillar = highlightDayStem && origI === 2;
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
                {basic ? (
                  <div className="text-sm font-medium text-[var(--color-ink)]">
                    {PILLAR_LABELS[origI]}<span className="text-xs font-normal text-[var(--color-ink-faint)] ml-0.5">({PILLAR_TERMS_HAN[origI]})</span>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-medium text-[var(--color-ink)]">{PILLAR_LABELS[origI]}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">
                      {PILLAR_SUB[origI]} <span className="opacity-60">(<TermBadge term={PILLAR_TERMS[origI]} />)</span>
                    </div>
                  </>
                )}
                {isDayPillar && (
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--color-gold)" }}>기준 일간</div>
                )}
                {gongmang?.[origI] && (
                  <div className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded mt-1" style={{ background: "var(--color-border-light)", color: "var(--color-ink-faint)" }}>空亡</div>
                )}
              </div>

              <div className="px-3 py-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)] mb-1">
                  천간(天干)
                </div>
                <div
                  className="font-heading text-2xl md:text-3xl font-bold"
                  style={{ color: stemInfo?.color ?? "var(--color-ink)" }}
                >
                  {STEM_KOR[stem]}({stem})
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
                  지지(地支)
                </div>
                <div
                  className="font-heading text-2xl md:text-3xl font-bold"
                  style={{ color: branchInfo?.color ?? "var(--color-ink)" }}
                >
                  {BRANCH_KOR[branch]}({branch})
                </div>
                {branchInfo && (
                  <div className="text-xs mt-1" style={{ color: branchInfo.color }}>
                    {branchInfo.korean}({branchInfo.label})
                  </div>
                )}
                {jizanGan?.[origI] && jizanGan[origI].length > 0 && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--color-border-light)" }}>
                    <div className="text-[9px] text-[var(--color-ink-faint)] mb-1">지장간</div>
                    <div className="flex flex-col gap-0.5">
                      {jizanGan[origI].map((jg, ji) => (
                        <div key={ji} className="text-[10px] text-[var(--color-ink-muted)]">
                          {jg.stem} <span className="opacity-70">{SIPSIN_KOR[jg.sipsin_name] ?? jg.sipsin_name}</span>
                        </div>
                      ))}
                    </div>
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
