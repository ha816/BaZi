"use client";

import type { PillarRelation, PillarSnapshot } from "@/types/analysis";
import PillarDetail from "./PillarDetail";

const KIND_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  stem_combine:   { label: "천간합", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  branch_combine: { label: "육합",   color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  branch_clash:   { label: "충",     color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  wonjin:         { label: "원진",   color: "#ea580c", bg: "#ffedd5", border: "#fdba74" },
  hyung:          { label: "형",     color: "#9333ea", bg: "#f3e8ff", border: "#d8b4fe" },
  hae:            { label: "해",     color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  pa:             { label: "파",     color: "#6b7280", bg: "#f3f4f6", border: "#d1d5db" },
  samhap:         { label: "삼합",   color: "#0d9488", bg: "#ccfbf1", border: "#5eead4" },
};

// PillarDetail은 [3,2,1,0] 순서로 시→일→월→년 컬럼 렌더링
const PILLAR_COLUMN_KOR: string[] = ["시주", "일주", "월주", "년주"];

interface Props {
  p1: PillarSnapshot;
  p2: PillarSnapshot;
  relations: PillarRelation[];
  name1: string;
  name2: string;
}

export default function PillarPairDiagram({ p1, p2, relations, name1, name2 }: Props) {
  const samePillarRels = (kor: string) =>
    relations.filter((r) => r.pillar1 === kor && r.pillar2 === kor);
  const crossPillarRels = relations.filter((r) => r.pillar1 !== r.pillar2);

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-[var(--color-ink-muted)]">
        <span className="px-2 py-0.5 rounded-full bg-[var(--color-gold-faint)] text-[var(--color-gold)]">{name1}</span>
      </div>
      <PillarDetail pillars={p1.pillars} dayStem={p1.day_stem} basic highlightDayStem />

      <div className="grid grid-cols-4 gap-3 md:gap-4 py-1">
        {PILLAR_COLUMN_KOR.map((kor) => {
          const rels = samePillarRels(kor);
          return (
            <div key={kor} className="flex flex-col items-center gap-1 min-h-[28px]">
              {rels.length === 0 ? (
                <span className="text-[var(--color-ink-faint)] text-base leading-none">·</span>
              ) : (
                rels.map((r, i) => {
                  const m = KIND_META[r.kind];
                  if (!m) return null;
                  return (
                    <span
                      key={i}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap"
                      style={{ color: m.color, background: m.bg, borderColor: m.border }}
                      title={r.label}
                    >
                      {m.label}
                    </span>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <PillarDetail pillars={p2.pillars} dayStem={p2.day_stem} basic highlightDayStem />
      <div className="text-xs font-semibold text-[var(--color-ink-muted)]">
        <span className="px-2 py-0.5 rounded-full bg-[var(--color-gold-faint)] text-[var(--color-gold)]">{name2}</span>
      </div>

      {crossPillarRels.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">
            기둥 간 교차 관계
          </p>
          <div className="flex flex-wrap gap-1.5">
            {crossPillarRels.map((r, i) => {
              const m = KIND_META[r.kind];
              if (!m) return null;
              return (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2 py-1 rounded-md border"
                  style={{ color: m.color, background: m.bg, borderColor: m.border }}
                >
                  {name1} {r.pillar1} ↔ {name2} {r.pillar2} · {r.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
