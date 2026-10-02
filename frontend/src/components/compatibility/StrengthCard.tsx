import type { PillarSnapshot } from "@/types/analysis";
import CollapsibleSectionHeader from "../CollapsibleSectionHeader";
import KkachiTip from "../KkachiTip";
import type { CompatTabProps } from "./types";

// 분석 YongshinTab 게이지와 같은 축 — 네 기둥 ±8, 세 기둥 ±6
const STRENGTH_MAX = 8;
const LABEL_COLOR: Record<string, string> = {
  "신강(身強)": "var(--color-fire)",
  "신약(身弱)": "var(--color-water)",
  "중화(中和)": "var(--color-earth)",
};

function Gauge({ name, snap }: { name: string; snap: PillarSnapshot }) {
  const color = LABEL_COLOR[snap.strength_label] ?? "var(--color-earth)";
  const max = snap.hour_unknown ? 6 : STRENGTH_MAX;
  const v = snap.strength;
  const pct = v == null ? null : Math.min(100, Math.max(0, 50 + (v / max) * 50));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--color-ink-muted)]">{name}님</span>
        <span className="font-semibold" style={{ color }}>
          {v != null && `${v > 0 ? `+${v}` : v} · `}{snap.strength_label}
        </span>
      </div>
      {pct != null && (
        <div className="relative h-2.5 rounded-full overflow-hidden bg-[var(--color-parchment)]">
          <div className="absolute left-1/2 top-0 h-full w-0.5 bg-[var(--color-border-light)] z-10" />
          <div
            className="absolute top-0 h-full rounded-full"
            style={{ width: `${Math.abs(pct - 50)}%`, left: pct >= 50 ? "50%" : `${pct}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

/** 신강·신약 — 두 사람 일간의 힘을 같은 축에 나란히 + 강약 조합 한 줄(백엔드 summary.strength) */
export default function StrengthCard({ data, name1, name2 }: CompatTabProps) {
  const { pillar1_snapshot: s1, pillar2_snapshot: s2 } = data;
  if (!s1 || !s2) return null;
  const pair = (data.summary?.strength ?? "").replace(/\{p1\}/g, name1).replace(/\{p2\}/g, name2);
  const anyScore = s1.strength != null || s2.strength != null;
  return (
    <div className="slide-card">
      <CollapsibleSectionHeader title="신강·신약(身強·身弱)">
        <p>일간(日干)이 사주 안에서 얼마나 힘 있는지 보는 척도예요. 나를 돕는 글자(같은 오행·나를 생하는 오행)가 많으면 신강, 적으면 신약이에요. 두 분의 강약이 어떻게 어울리는지가 관계의 주도권과 호흡을 보여줘요.</p>
      </CollapsibleSectionHeader>
      <div className="divider" />
      <div className="slide-card__body space-y-4">
        <KkachiTip>{pair || "두 분의 신강·신약을 나란히 놓고 봤어요."}</KkachiTip>
        <div className="space-y-3">
          <Gauge name={name1} snap={s1} />
          <Gauge name={name2} snap={s2} />
        </div>
        {anyScore && (
          <div className="flex justify-between text-[10px] text-[var(--color-ink-faint)]">
            <span className="text-[var(--color-water)]">← 신약(身弱)</span>
            <span>가운데 = 중화(中和)</span>
            <span className="text-[var(--color-fire)]">신강(身強) →</span>
          </div>
        )}
      </div>
    </div>
  );
}
