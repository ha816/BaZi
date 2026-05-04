import type { DomainScore } from "@/types/analysis";

const LEVEL_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  high:   { color: "var(--color-wood)",  bgColor: "#EEF4F0", borderColor: "#C1D6C8" },
  medium: { color: "var(--color-earth)", bgColor: "#F5F0E7", borderColor: "#DDD0B8" },
  low:    { color: "var(--color-metal)", bgColor: "#F0F0F2", borderColor: "#C8C8CE" },
};

const LEVEL_LABEL: Record<string, string> = { high: "좋음", medium: "보통", low: "주의" };

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

interface Props {
  scores: Record<string, DomainScore>;
  /** 영역별 월운 뱃지 — 예: { "재물운": ["편재(偏財)"] } */
  monthBadges?: Record<string, string[]>;
}

export default function DomainBarChart({ scores, monthBadges = {} }: Props) {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map(([name, info], idx) => {
        const colors = LEVEL_COLORS[info.level] ?? LEVEL_COLORS.low;
        const badges = monthBadges[name] ?? [];
        const medal = RANK_MEDAL[idx];
        return (
          <div
            key={name}
            className="rounded-lg p-3 border"
            style={{ backgroundColor: colors.bgColor, borderColor: colors.borderColor }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base w-5 text-center">{medal ?? ""}</span>
              <span className="text-sm font-bold flex-shrink-0" style={{ color: colors.color }}>
                {name}
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ color: colors.color, backgroundColor: colors.borderColor + "80" }}
              >
                {LEVEL_LABEL[info.level]}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${info.score}%`, backgroundColor: colors.color }}
                />
              </div>
              <span className="text-xs font-semibold w-9 text-right" style={{ color: colors.color }}>
                {info.score}%
              </span>
            </div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1 pl-7">
                {badges.map((b) => (
                  <span key={b}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
                    style={{ color: colors.color, borderColor: colors.borderColor, backgroundColor: "var(--color-card)" }}
                  >
                    월운(月運) · {b}
                  </span>
                ))}
              </div>
            )}
            {info.reason && (
              <p className="text-[11px] text-[var(--color-ink-faint)] leading-relaxed pl-7">{info.reason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
