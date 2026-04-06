import type { DomainScore } from "@/types/analysis";

const LEVEL_COLORS: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  high:   { color: "var(--color-wood)",  bgColor: "#EEF4F0", borderColor: "#C1D6C8" },
  medium: { color: "var(--color-earth)", bgColor: "#F5F0E7", borderColor: "#DDD0B8" },
  low:    { color: "var(--color-metal)", bgColor: "#F0F0F2", borderColor: "#C8C8CE" },
};

const LEVEL_LABEL: Record<string, string> = { high: "좋음", medium: "보통", low: "주의" };

interface Props {
  scores: Record<string, DomainScore>;
}

function buildDomainNarrative(scores: Record<string, DomainScore>): string {
  const entries = Object.entries(scores);
  const sorted = [...entries].sort((a, b) => b[1].score - a[1].score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const highCount = entries.filter(([, s]) => s.level === "high").length;

  let text = `올해 가장 좋은 영역은 ${best[0]}이에요.`;
  if (worst[0] !== best[0]) {
    text += ` ${worst[0]}은 상대적으로 아쉬우니 조심하세요.`;
  }
  if (highCount >= 3) {
    text += " 전반적으로 여러 영역에서 좋은 흐름이에요.";
  } else if (highCount === 0) {
    text += " 올해는 무리하기보다 내실을 다지는 데 집중하면 좋겠어요.";
  }
  return text;
}

export default function DomainBarChart({ scores }: Props) {
  const entries = Object.entries(scores);

  return (
    <div>
      <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-4">
        {buildDomainNarrative(scores)}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {entries.map(([name, info], i) => {
          const colors = LEVEL_COLORS[info.level] ?? LEVEL_COLORS.low;
          const isLast = entries.length % 2 === 1 && i === entries.length - 1;
          return (
            <div
              key={name}
              className={`rounded-xl p-4 border ${isLast ? "col-span-2" : ""}`}
              style={{ backgroundColor: colors.bgColor, borderColor: colors.borderColor }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: colors.color }}>{name}</span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: colors.color, backgroundColor: colors.borderColor + "80" }}
                >
                  {LEVEL_LABEL[info.level]}
                </span>
              </div>
              <div className="flex gap-1 mb-2.5">
                {Array.from({ length: 3 }, (_, j) => (
                  <span
                    key={j}
                    className="text-xs"
                    style={{ color: j < info.score ? colors.color : "var(--color-border)" }}
                  >●</span>
                ))}
              </div>
              <p className="text-xs text-[var(--color-ink-faint)] leading-relaxed">{info.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
