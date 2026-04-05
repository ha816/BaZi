import type { InterpretBlock } from "@/types/analysis";

interface Props {
  title: string;
  blocks: InterpretBlock[];
  variant?: "default" | "info" | "warning" | "success";
}

const BORDER_COLORS: Record<string, string> = {
  default: "var(--color-border-light)",
  info: "var(--color-water)",
  warning: "var(--color-fire)",
  success: "var(--color-wood)",
};

export default function InterpretSection({ title, blocks, variant = "default" }: Props) {
  if (blocks.length === 0) return null;

  const borderColor = BORDER_COLORS[variant];
  const blockStyle =
    variant !== "default"
      ? { borderLeft: `3px solid ${borderColor}` }
      : { border: `1px solid var(--color-border-light)` };

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="font-heading text-base font-semibold text-[var(--color-ink)]">
          {title}
        </h4>
      )}
      {blocks.map((block, i) => (
        <div key={i} className="rounded-lg px-5 py-4 bg-[var(--color-ivory)]" style={blockStyle}>
          {block.category && (
            <span className="inline-block text-xs font-medium text-[var(--color-gold)] bg-[var(--color-gold-faint)] px-2.5 py-0.5 rounded-full mb-2">
              {block.category}
            </span>
          )}
          {block.description && (
            <p className="text-base text-[var(--color-ink-light)] leading-relaxed">
              {block.description}
            </p>
          )}
          {block.tips.length > 0 && (
            <div className={`space-y-2 ${block.description ? "mt-3 border-t border-[var(--color-border-light)] pt-3" : ""}`}>
              {block.tips.map((tip, j) => (
                <p key={j} className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                  {tip.label && (
                    <>
                      <span className="font-medium text-[var(--color-ink)]">{tip.label}</span>
                      <span className="mx-1.5 text-[var(--color-border)]">|</span>
                    </>
                  )}
                  {tip.text}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
