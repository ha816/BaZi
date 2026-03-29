interface Props {
  title: string;
  lines: string[];
  variant?: "default" | "info" | "warning" | "success";
}

const BORDER_COLORS: Record<string, string> = {
  default: "var(--color-border-light)",
  info: "var(--color-water)",
  warning: "var(--color-fire)",
  success: "var(--color-wood)",
};

/* ── 텍스트 파서: 기술 용어 제거 + 구조화 ── */

interface ParsedBlock {
  category: string | null;
  description: string;
  tips: { label: string; text: string }[];
}

function parseInterpretLines(lines: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  let current: ParsedBlock | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // [카테고리] 설명 — 한자: 실제내용
    const catMatch = line.match(/^\[([^\]]+)\]\s*(.*)/);
    if (catMatch) {
      if (current) blocks.push(current);
      let desc = catMatch[2];
      // "대운의 흐름 — 偏財: 의미있는설명" → "의미있는설명"
      const techStrip = desc.match(/^.*?[\u4E00-\u9FFF]+:\s*(.*)/);
      if (techStrip && techStrip[1]) desc = techStrip[1];
      current = { category: catMatch[1], description: desc, tips: [] };
      continue;
    }

    // 이모지로 시작하는 팁 줄: 💼 투자: 설명...
    const emojiMatch = line.match(
      /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\uFE0F?\s+(.*)/u,
    );
    if (emojiMatch) {
      const tipContent = emojiMatch[1];
      const colonMatch = tipContent.match(/^([^:]{1,12}):\s*(.*)/);
      const tip = colonMatch
        ? { label: colonMatch[1].trim(), text: colonMatch[2] }
        : { label: "", text: tipContent };

      if (current) {
        current.tips.push(tip);
      } else {
        current = { category: null, description: "", tips: [tip] };
      }
      continue;
    }

    // 일반 텍스트 줄
    if (current) blocks.push(current);
    current = { category: null, description: line, tips: [] };
  }

  if (current) blocks.push(current);
  return blocks;
}

export default function InterpretSection({
  title,
  lines,
  variant = "default",
}: Props) {
  if (lines.length === 0) return null;

  const borderColor = BORDER_COLORS[variant];
  const blocks = parseInterpretLines(lines);

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
        <div
          key={i}
          className="rounded-lg px-5 py-4 bg-[var(--color-ivory)]"
          style={blockStyle}
        >
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
            <div
              className={`space-y-2 ${
                block.description
                  ? "mt-3 border-t border-[var(--color-border-light)] pt-3"
                  : ""
              }`}
            >
              {block.tips.map((tip, j) => (
                <p
                  key={j}
                  className="text-sm text-[var(--color-ink-muted)] leading-relaxed"
                >
                  {tip.label && (
                    <>
                      <span className="font-medium text-[var(--color-ink)]">
                        {tip.label}
                      </span>
                      <span className="mx-1.5 text-[var(--color-border)]">
                        |
                      </span>
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
