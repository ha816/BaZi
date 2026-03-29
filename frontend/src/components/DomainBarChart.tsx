"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { DomainScore } from "@/types/analysis";

const COLORS: Record<string, string> = {
  high: "#5B8C6A",
  medium: "#B8945A",
  low: "#7E7E8A",
};

interface Props {
  scores: Record<string, DomainScore>;
}

const LEVEL_DESC: Record<string, string> = {
  high: "좋은 편",
  medium: "보통",
  low: "아쉬운 편",
};

function buildDomainNarrative(scores: Record<string, DomainScore>): string {
  const entries = Object.entries(scores);
  const sorted = [...entries].sort((a, b) => b[1].score - a[1].score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const highCount = entries.filter(([, s]) => s.level === "high").length;

  let text = `올해 가장 좋은 영역은 ${best[0]}(${best[1].score}점)이에요.`;
  if (worst[0] !== best[0]) {
    text += ` ${worst[0]}(${worst[1].score}점)은 상대적으로 아쉬우니 조심하세요.`;
  }
  if (highCount >= 3) {
    text += " 전반적으로 여러 영역에서 좋은 흐름이에요.";
  } else if (highCount === 0) {
    text += " 올해는 무리하기보다 내실을 다지는 데 집중하면 좋겠어요.";
  }

  return text;
}

export default function DomainBarChart({ scores }: Props) {
  const data = Object.entries(scores).map(([name, info]) => ({
    name,
    score: info.score,
    color: COLORS[info.level] ?? COLORS.low,
  }));

  return (
    <div className="mb-4">
      {/* Narrative summary */}
      <p className="text-sm text-[var(--color-ink-light)] leading-relaxed mb-4">
        {buildDomainNarrative(scores)}
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 14, fill: "var(--color-ink-muted)" }}
            axisLine={{ stroke: "var(--color-parchment)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, "dataMax + 1"]}
            allowDecimals={false}
            tick={{ fontSize: 13, fill: "var(--color-ink-faint)" }}
            axisLine={false}
            tickLine={false}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={44}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
            <LabelList
              dataKey="score"
              position="top"
              formatter={(v) => `${v}점`}
              style={{ fontSize: 13, fontWeight: 600, fill: "var(--color-ink-light)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
