import type { DomainScore } from "@/types/analysis";

const LEVEL_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  high:   { color: "var(--color-wood)",  bgColor: "#EEF4F0", borderColor: "#C1D6C8" },
  medium: { color: "var(--color-earth)", bgColor: "#F5F0E7", borderColor: "#DDD0B8" },
  low:    { color: "var(--color-metal)", bgColor: "#F0F0F2", borderColor: "#C8C8CE" },
};

const LEVEL_LABEL: Record<string, string> = { high: "좋음", medium: "보통", low: "주의" };

interface Props {
  scores: Record<string, DomainScore>;
  /** 영역별 월운 뱃지 — 예: { "재물운": ["편재(偏財)"] } */
  monthBadges?: Record<string, string[]>;
}

export default function DomainBarChart({ scores, monthBadges = {} }: Props) {
  const entries = Object.entries(scores);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(([name, info]) => {
          const colors = LEVEL_COLORS[info.level] ?? LEVEL_COLORS.low;
          const isLow = info.level === "low";
          const badges = monthBadges[name] ?? [];
          return (
            <div
              key={name}
              className="rounded-lg p-3 border"
              style={{
                backgroundColor: colors.bgColor,
                borderColor: colors.borderColor,
                opacity: isLow ? 0.5 : 1,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: colors.color }}>{name}</span>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ color: colors.color, backgroundColor: colors.borderColor + "80" }}
                >
                  {LEVEL_LABEL[info.level]}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1 rounded-full bg-[var(--color-border-light)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round(info.score / 4 * 100)}%`, backgroundColor: colors.color }}
                  />
                </div>
                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: colors.color }}>
                  {Math.round(info.score / 4 * 100)}%
                </span>
              </div>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {badges.map((b) => (
                    <span key={b}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                      style={{ color: colors.color, borderColor: colors.borderColor, backgroundColor: "var(--color-card)" }}
                    >
                      이번달 +{b}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[var(--color-ink-faint)] leading-relaxed">{info.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
