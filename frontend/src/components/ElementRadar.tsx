"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { getElementInfo } from "@/lib/elementColors";

interface Props {
  stats: Record<string, number>;
}

function buildElementNarrative(stats: Record<string, number>): string {
  const entries = Object.entries(stats);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  const strongest = sorted[0];
  const strongestInfo = getElementInfo(strongest[0]);

  // 동률 체크
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

export default function ElementRadar({ stats }: Props) {
  const data = Object.entries(stats).map(([name, value]) => {
    const info = getElementInfo(name);
    return { name: info.korean, value };
  });
  const maxVal = Math.max(...Object.values(stats)) + 1;

  return (
    <div>
      {/* Narrative summary */}
      <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-5">
        {buildElementNarrative(stats)}
      </p>

      {/* Element summary cards */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {Object.entries(stats).map(([name, count]) => {
          const info = getElementInfo(name);
          return (
            <div
              key={name}
              className="text-center rounded-lg px-5 py-3 min-w-[72px] border"
              style={{
                backgroundColor: info.bgColor,
                borderColor: info.borderColor,
              }}
            >
              <div className="font-heading text-lg font-bold" style={{ color: info.color }}>
                {info.korean}
              </div>
              <div className="text-xs text-[var(--color-ink-faint)] mt-0.5">{info.meaning}</div>
              <div className="text-xl font-bold mt-1" style={{ color: info.color }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Radar chart */}
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--color-parchment)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 14, fill: "var(--color-ink-muted)" }}
          />
          <PolarRadiusAxis
            domain={[0, maxVal]}
            tickCount={maxVal + 1}
            tick={{ fontSize: 12, fill: "var(--color-ink-faint)" }}
          />
          <Radar
            dataKey="value"
            stroke="var(--color-gold)"
            fill="var(--color-gold)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
