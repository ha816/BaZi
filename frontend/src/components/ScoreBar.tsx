interface Props {
  score: number;
  color?: string;
  max?: number;
}

export default function ScoreBar({ score, color, max = 100 }: Props) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="w-full h-2 rounded-full bg-[var(--color-parchment)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: color
            ? color
            : score >= 70
            ? "linear-gradient(90deg, var(--color-gold-light), var(--color-gold))"
            : score >= 45
            ? "linear-gradient(90deg, var(--color-earth), var(--color-gold-light))"
            : "linear-gradient(90deg, var(--color-water), var(--color-metal))",
        }}
      />
    </div>
  );
}
