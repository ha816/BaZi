"use client";

import { getElementInfo } from "@/lib/elementColors";
import type { NatalResult } from "@/types/analysis";

interface Props {
  natal: NatalResult;
}

export default function PillarOhengGrid({ natal }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[3, 2, 1, 0].map((origI, i) => {
        const pillar = natal.pillars[origI] ?? "";
        const stem = pillar[0] ?? "";
        const branch = pillar[1] ?? "";
        const stemEl = natal.pillar_elements?.[origI]?.stem_element ?? "";
        const branchEl = natal.pillar_elements?.[origI]?.branch_element ?? "";
        const stemInfo = stemEl ? getElementInfo(stemEl) : null;
        const branchInfo = branchEl ? getElementInfo(branchEl) : null;
        const stemKor = natal.pillar_stems_korean?.[origI] ?? "";
        const branchKor = natal.pillar_branches_korean?.[origI] ?? "";
        return (
          <div
            key={i}
            className="rounded-xl text-center border"
            style={{ borderColor: "var(--color-border-light)", backgroundColor: "var(--color-card)" }}
          >
            <div className="px-2 pt-3 pb-1">
              <div
                className="font-heading text-2xl font-bold"
                style={{ color: stemInfo?.color ?? "var(--color-ink)" }}
              >
                {stemKor}({stem})
              </div>
              {stemInfo && (
                <div className="text-[10px] mt-0.5" style={{ color: stemInfo.color }}>
                  {stemInfo.korean}({stemInfo.label})
                </div>
              )}
            </div>

            <div className="px-2 pt-1 pb-3 rounded-b-xl">
              <div
                className="font-heading text-2xl font-bold"
                style={{ color: branchInfo?.color ?? "var(--color-ink)" }}
              >
                {branchKor}({branch})
              </div>
              {branchInfo && (
                <div className="text-[10px] mt-0.5" style={{ color: branchInfo.color }}>
                  {branchInfo.korean}({branchInfo.label})
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
