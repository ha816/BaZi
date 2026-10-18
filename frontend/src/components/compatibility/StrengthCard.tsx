"use client";

import { useState } from "react";
import type { PillarSnapshot } from "@/types/analysis";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import type { CompatTabProps } from "./types";

// 분석 용신·삼재 탭(YongshinTab) 신강·신약 카드와 같은 축·색·그림 — 네 기둥 ±8, 세 기둥 ±6
const LABEL_COLOR: Record<string, string> = {
  "신강(身強)": "var(--color-fire)",
  "신약(身弱)": "var(--color-water)",
};
const STRENGTH_IMG: Record<string, string> = {
  "신강(身強)": "/kkachi/strength/신강.png",
  "신약(身弱)": "/kkachi/strength/신약.png",
};
const FALLBACK_IMG = "/kkachi/normal_kkachi_00.png";

function Person({ name, snap }: { name: string; snap: PillarSnapshot }) {
  const color = LABEL_COLOR[snap.strength_label] ?? "var(--color-earth)";
  const pct = snap.strength_pct == null ? null : Math.min(100, Math.max(0, snap.strength_pct));
  return (
    <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-ivory-warm)] p-3 space-y-2.5">
      <img
        src={STRENGTH_IMG[snap.strength_label] ?? FALLBACK_IMG}
        alt={snap.strength_label}
        className="w-full aspect-square rounded-lg object-cover"
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
      />
      <div className="text-center">
        <p className="text-xs font-semibold text-[var(--color-ink-muted)] truncate">{name}님</p>
        <p className="font-heading text-base font-bold" style={{ color }}>{snap.strength_label}</p>
        {pct != null && <p className="text-[11px] font-semibold" style={{ color }}>기운 {pct}%</p>}
      </div>
      {pct != null && (
        <div>
          <div className="relative h-2.5 rounded-full overflow-hidden bg-[var(--color-parchment)]">
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
            <div
              className="absolute top-0 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.abs(pct - 50)}%`, left: pct >= 50 ? "50%" : `${pct}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between text-[9px] mt-1">
            <span className="text-[var(--color-water)]">약</span>
            <span className="text-[var(--color-fire)]">강{snap.hour_unknown ? " · 세 기둥" : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** 신강·신약 — 두 사람 일간의 힘(그림·게이지) + 조합 한 줄 + 사람별 풀이(백엔드 summary.strength·strength_p1·p2) */
export default function StrengthCard({ data, name1, name2 }: CompatTabProps) {
  const [open, setOpen] = useState(false);
  const { pillar1_snapshot: s1, pillar2_snapshot: s2 } = data;
  if (!s1 || !s2) return null;
  const fill = (s?: string) => (s ?? "").replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);
  const pair = fill(data.summary?.strength);
  const stories = [fill(data.summary?.strength_p1), fill(data.summary?.strength_p2)];
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신강·신약(身強·身弱)">
        <p>일간(日干)이 얼마나 힘 있는지 보는 척도예요. 나를 돕는 글자가 많으면 <strong>신강</strong>, 적으면 <strong>신약</strong>이에요. 신강은 스스로 밀고 가는 힘, 신약은 도움을 끌어 쓰는 흐름이에요. 두 분의 조합이 관계의 주도권과 호흡을 보여줘요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>
          {name1}님과 {name2}님의 타고난 기운이 사주 안에서 얼마나 힘 있는지 나란히 놓고 볼게요. 한 분이 강하고 한 분이 여리면 이끄는 쪽과 받쳐주는 쪽이 자연스럽게 나뉘어요.
        </KkachiTip>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-shimmer w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-70"
          >
            ✨ 두 분의 신강·신약 확인하기
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Person name={name1} snap={s1} />
              <Person name={name2} snap={s2} />
            </div>
            {pair && (
              <div className="rounded-xl border border-[var(--color-gold-light)] bg-[var(--color-gold-faint)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)]">
                <span className="text-[11px] font-semibold text-[var(--color-gold)] mr-1.5">두 분의 강약</span>{pair}
              </div>
            )}
            {stories.map((t, i) => t && <KkachiTip key={i} label={`${i === 0 ? name1 : name2}님`}>{t}</KkachiTip>)}
          </>
        )}
      </div>
    </div>
  );
}
