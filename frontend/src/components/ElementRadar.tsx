"use client";

import { getElementInfo } from "@/lib/elementColors";

interface Props {
  stats: Record<string, number>;
  showNarrative?: boolean;
}

function buildElementNarrative(stats: Record<string, number>): string {
  const entries = Object.entries(stats);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  const strongest = sorted[0];
  const strongestInfo = getElementInfo(strongest[0]);

  const topCount = strongest[1];
  const topTied = sorted.filter(([, v]) => v === topCount);

  let text: string;
  if (topTied.length >= 2) {
    const names = topTied.map(([e]) => getElementInfo(e).korean).join("과 ");
    text = `전체 ${total}개 글자 중 ${names}의 기운이 각각 ${topCount}개로 가장 많아요.`;
  } else {
    text = `전체 ${total}개 글자 중 ${strongestInfo.korean}의 기운이 ${topCount}개로 가장 많아요.`;
  }

  const missing = entries.filter(([, v]) => v === 0);
  if (missing.length > 0) {
    const missingNames = missing.map(([e]) => getElementInfo(e).korean).join("·");
    text += ` ${missingNames}의 기운은 없는데, 이런 기운을 보완해주는 색상이나 활동을 활용하면 좋아요.`;
  } else {
    text += ` 다섯 가지 기운이 모두 있어서 비교적 균형 잡힌 구성이에요.`;
  }

  return text;
}

const ELEMENT_ORDER = ["木", "火", "土", "金", "水"];

export default function ElementRadar({ stats, showNarrative = true }: Props) {
  const maxVal = Math.max(...Object.values(stats), 1);

  return (
    <div>
      {showNarrative && (
        <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-5">
          {buildElementNarrative(stats)}
        </p>
      )}

      <div className="space-y-3">
        {ELEMENT_ORDER.map((key) => {
          const info = getElementInfo(key);
          const count = stats[key] ?? 0;
          const pct = (count / maxVal) * 100;

          return (
            <div key={key} className="flex items-center gap-3">
              {/* 라벨 */}
              <div
                className="w-16 shrink-0 text-sm font-semibold text-right"
                style={{ color: info.color }}
              >
                {info.korean}({info.label})
              </div>

              {/* 바 */}
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: info.bgColor }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: info.color,
                    opacity: count === 0 ? 0 : 1,
                  }}
                />
              </div>

              {/* 숫자 */}
              <div
                className="w-5 shrink-0 text-sm font-bold text-center"
                style={{ color: count === 0 ? "var(--color-ink-faint)" : info.color }}
              >
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
